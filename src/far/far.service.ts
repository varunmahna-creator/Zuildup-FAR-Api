import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  City,
  PlotSizeRule,
  BasementRule,
  StiltRule,
  ComplianceRule,
  RoadWidthRule,
} from './entities';
import {
  CalculateFarDto,
  FarCalculationResponseDto,
  FloorBreakdownDto,
  CityListItemDto,
} from './dto';
import {
  convertToSqm,
  convertFromSqm,
  calculateNetPlotArea,
  estimatePlotDimensions,
  round,
} from '../common/utils/unit-converter';

@Injectable()
export class FarService {
  constructor(
    @InjectRepository(City)
    private cityRepository: Repository<City>,
    @InjectRepository(PlotSizeRule)
    private plotSizeRuleRepository: Repository<PlotSizeRule>,
    @InjectRepository(BasementRule)
    private basementRuleRepository: Repository<BasementRule>,
    @InjectRepository(StiltRule)
    private stiltRuleRepository: Repository<StiltRule>,
    @InjectRepository(ComplianceRule)
    private complianceRuleRepository: Repository<ComplianceRule>,
    @InjectRepository(RoadWidthRule)
    private roadWidthRuleRepository: Repository<RoadWidthRule>,
  ) {}

  /**
   * Get all supported cities
   */
  async getCities(): Promise<CityListItemDto[]> {
    const cities = await this.cityRepository.find({
      order: { name: 'ASC' },
    });

    return cities.map((city) => ({
      id: city.id,
      name: city.name,
      fullName: city.fullName,
      authority: city.authority,
      state: city.state,
    }));
  }

  /**
   * Get city with all its rules
   */
  async getCityWithRules(cityId: string): Promise<City> {
    const city = await this.cityRepository.findOne({
      where: { id: cityId },
      relations: [
        'plotSizeRules',
        'basementRules',
        'stiltRules',
        'complianceRules',
        'roadWidthRules',
      ],
    });

    if (!city) {
      throw new NotFoundException(`City '${cityId}' not found`);
    }

    return city;
  }

  /**
   * Main FAR calculation
   */
  async calculateFar(input: CalculateFarDto): Promise<FarCalculationResponseDto> {
    // Get city with all rules
    const city = await this.getCityWithRules(input.city);

    // Convert plot area to sqm
    const plotAreaSqm = convertToSqm(input.plotArea, input.plotUnit);
    const areaConversions = convertFromSqm(plotAreaSqm);

    // Find applicable plot size rule
    const applicableRule = this.findApplicablePlotRule(
      city.plotSizeRules,
      plotAreaSqm,
    );

    if (!applicableRule) {
      throw new NotFoundException(
        `No applicable FAR rules found for plot size: ${plotAreaSqm} sqm in ${city.name}`,
      );
    }

    // Calculate FAR (handle Delhi's percentage-based FAR)
    let effectiveFar = Number(applicableRule.far);
    let farSource = 'plot_size';

    if (city.farUnit === 'percentage') {
      effectiveFar = effectiveFar / 100; // Convert 350 to 3.5
    }

    // Check road width FAR (Delhi specific)
    if (input.roadWidth && city.roadWidthRules.length > 0) {
      const roadFar = this.getFarByRoadWidth(
        city.roadWidthRules,
        input.roadWidth,
        city.farUnit,
      );
      if (roadFar !== null && roadFar < effectiveFar) {
        effectiveFar = roadFar;
        farSource = 'road_width';
      }
    }

    // Calculate buildable areas
    const maxBuiltUpArea = plotAreaSqm * effectiveFar;
    const groundCoverage = Number(applicableRule.groundCoverage);
    const maxGroundFloorArea = plotAreaSqm * (groundCoverage / 100);

    // Get or estimate plot dimensions
    const dimensions =
      input.plotWidth && input.plotDepth
        ? { width: input.plotWidth, depth: input.plotDepth }
        : estimatePlotDimensions(plotAreaSqm);

    // Calculate net plot area after setbacks
    const setbacks = applicableRule.getSetbacks();
    const netPlotArea = calculateNetPlotArea(
      dimensions.width,
      dimensions.depth,
      setbacks,
    );

    // Get basement and stilt rules
    const basementRule = city.basementRules[0];
    const stiltRule = city.stiltRules[0];

    // Check if stilt is mandatory
    const isStiltMandatory: boolean = !!(
      stiltRule?.mandatory &&
      ((stiltRule.mandatoryAbovePlotSize &&
        plotAreaSqm >= Number(stiltRule.mandatoryAbovePlotSize)) ||
        (stiltRule.mandatoryAboveFloors &&
          input.desiredFloors >= stiltRule.mandatoryAboveFloors))
    );

    // Generate floor breakdown
    const floors = this.generateFloorBreakdown(
      input,
      maxGroundFloorArea,
      basementRule,
      stiltRule,
      isStiltMandatory,
    );

    // Calculate totals
    let totalFarArea = 0;
    let totalNonFarArea = 0;

    for (const floor of floors) {
      if (floor.countedInFar) {
        totalFarArea += floor.area;
      } else {
        totalNonFarArea += floor.area;
      }
    }

    const grandTotalArea = totalFarArea + totalNonFarArea;

    // Calculate compliance
    const compliance = this.calculateCompliance(
      city.complianceRules,
      plotAreaSqm,
      Number(applicableRule.maxHeight),
      input.desiredFloors,
    );

    // Build notes
    const notes: string[] = [...city.generalNotes];
    if (applicableRule.notes) {
      notes.unshift(applicableRule.notes);
    }
    if (isStiltMandatory && !input.wantStilt) {
      notes.unshift(
        'Note: Stilt parking is mandatory for your plot configuration',
      );
    }
    if (input.wantBalcony) {
      notes.push(
        'Balcony projections up to 1.5m (max 50% of setback) are allowed',
      );
    }

    // Build response
    return {
      city: {
        id: city.id,
        name: city.name,
        fullName: city.fullName,
        authority: city.authority,
        state: city.state,
      },
      plotAreaSqm: areaConversions.sqm,
      plotAreaSqft: areaConversions.sqft,
      plotAreaSqyd: areaConversions.sqyd,
      plotAreaGaj: areaConversions.gaj,
      roadWidth: input.roadWidth,

      applicableFar: round(effectiveFar),
      groundCoverage,
      farSource,

      maxBuiltUpArea: round(maxBuiltUpArea),
      maxBuiltUpAreaSqft: round(maxBuiltUpArea * 10.7639),
      maxGroundFloorArea: round(maxGroundFloorArea),
      maxGroundFloorAreaSqft: round(maxGroundFloorArea * 10.7639),

      setbacks,

      maxHeight: Number(applicableRule.maxHeight),
      maxFloors: applicableRule.maxFloors,
      maxDwellingUnits: applicableRule.maxDwellingUnits,

      netPlotArea: round(netPlotArea),
      netPlotAreaSqft: round(netPlotArea * 10.7639),

      basementInfo: {
        allowed: basementRule?.allowed ?? true,
        countedInFar: basementRule?.countedInFar ?? false,
        maxArea: round(maxGroundFloorArea),
        maxAreaSqft: round(maxGroundFloorArea * 10.7639),
        maxLevels: basementRule?.maxLevels ?? 1,
        minHeight: Number(basementRule?.minHeight ?? 2.4),
        maxHeight: Number(basementRule?.maxHeight ?? 4.0),
      },

      stiltInfo: {
        allowed: stiltRule?.allowed ?? true,
        countedInFar: stiltRule?.countedInFar ?? false,
        mandatory: isStiltMandatory,
        minHeight: Number(stiltRule?.minHeight ?? 2.4),
        area: input.wantStilt ? round(maxGroundFloorArea) : undefined,
        areaSqft: input.wantStilt
          ? round(maxGroundFloorArea * 10.7639)
          : undefined,
      },

      floors,

      totalFarArea: round(totalFarArea),
      totalFarAreaSqft: round(totalFarArea * 10.7639),
      totalNonFarArea: round(totalNonFarArea),
      totalNonFarAreaSqft: round(totalNonFarArea * 10.7639),
      grandTotalArea: round(grandTotalArea),
      grandTotalAreaSqft: round(grandTotalArea * 10.7639),

      compliance,
      notes,
    };
  }

  /**
   * Find applicable plot size rule
   */
  private findApplicablePlotRule(
    rules: PlotSizeRule[],
    plotAreaSqm: number,
  ): PlotSizeRule | null {
    // Sort rules by minSize ascending
    const sortedRules = [...rules].sort(
      (a, b) => Number(a.minSizeSqm) - Number(b.minSizeSqm),
    );

    for (const rule of sortedRules) {
      const minSize = Number(rule.minSizeSqm);
      const maxSize = rule.maxSizeSqm ? Number(rule.maxSizeSqm) : Infinity;

      if (plotAreaSqm >= minSize && plotAreaSqm < maxSize) {
        return rule;
      }
    }

    // Return last rule for plots exceeding all ranges
    return sortedRules[sortedRules.length - 1] || null;
  }

  /**
   * Get FAR based on road width
   */
  private getFarByRoadWidth(
    rules: RoadWidthRule[],
    roadWidth: number,
    farUnit: 'percentage' | 'ratio',
  ): number | null {
    for (const rule of rules) {
      const minWidth = Number(rule.minRoadWidth);
      const maxWidth = rule.maxRoadWidth
        ? Number(rule.maxRoadWidth)
        : Infinity;

      if (roadWidth >= minWidth && roadWidth < maxWidth) {
        let far = Number(rule.far);
        if (farUnit === 'percentage') {
          far = far / 100;
        }
        return far;
      }
    }
    return null;
  }

  /**
   * Generate floor-wise breakdown
   */
  private generateFloorBreakdown(
    input: CalculateFarDto,
    groundFloorArea: number,
    basementRule: BasementRule | undefined,
    stiltRule: StiltRule | undefined,
    isStiltMandatory: boolean,
  ): FloorBreakdownDto[] {
    const floors: FloorBreakdownDto[] = [];
    const SQM_TO_SQFT = 10.7639;

    // Basement (if selected)
    if (input.wantBasement) {
      const basementLevels = input.basementType === 'double' ? 2 : 1;
      for (let i = basementLevels; i >= 1; i--) {
        floors.push({
          floorName: basementLevels > 1 ? `Basement ${i}` : 'Basement',
          floorType: 'basement',
          area: round(groundFloorArea),
          areaSqft: round(groundFloorArea * SQM_TO_SQFT),
          countedInFar: basementRule?.countedInFar ?? false,
          height: Number(basementRule?.minHeight ?? 2.4),
          notes: `For ${input.basementPurpose?.join('/') || 'parking/storage'}`,
        });
      }
    }

    // Stilt (if selected or mandatory)
    if (input.wantStilt || isStiltMandatory) {
      floors.push({
        floorName: 'Stilt Parking',
        floorType: 'stilt',
        area: round(groundFloorArea),
        areaSqft: round(groundFloorArea * SQM_TO_SQFT),
        countedInFar: stiltRule?.countedInFar ?? false,
        height: Number(stiltRule?.minHeight ?? 2.4),
        notes: isStiltMandatory
          ? 'Mandatory as per bylaws'
          : 'Open parking area',
      });
    }

    // Regular floors
    const floorNames = [
      'Ground Floor',
      'First Floor',
      'Second Floor',
      'Third Floor',
    ];
    for (let i = 0; i < input.desiredFloors; i++) {
      floors.push({
        floorName: floorNames[i] || `Floor ${i + 1}`,
        floorType: 'regular',
        area: round(groundFloorArea),
        areaSqft: round(groundFloorArea * SQM_TO_SQFT),
        countedInFar: true,
        height: 3.0,
        notes:
          i === 0 && !input.wantStilt ? 'With parking provision' : undefined,
      });
    }

    // Terrace (if selected)
    if (input.wantTerrace) {
      const terraceArea = groundFloorArea * 0.25; // 25% coverage for mumty
      floors.push({
        floorName: 'Terrace/Mumty',
        floorType: 'terrace',
        area: round(terraceArea),
        areaSqft: round(terraceArea * SQM_TO_SQFT),
        countedInFar: false,
        height: 3.0,
        notes: 'Staircase cover and water tank',
      });
    }

    return floors;
  }

  /**
   * Calculate compliance requirements
   */
  private calculateCompliance(
    rules: ComplianceRule[],
    plotAreaSqm: number,
    maxHeight: number,
    desiredFloors: number,
  ) {
    const getRule = (type: string) =>
      rules.find((r) => r.ruleType === type);

    const fireRule = getRule('fire_noc');
    const rainwaterRule = getRule('rainwater_harvesting');
    const solarRule = getRule('solar_panel');
    const airportRule = getRule('airport_noc');
    const parkingRule = getRule('parking');

    // Calculate parking requirement
    let requiredECS = Math.min(desiredFloors, 4); // 1 per dwelling unit
    if (parkingRule && plotAreaSqm > 300) {
      requiredECS = Math.max(
        requiredECS,
        Math.ceil(plotAreaSqm * 0.01), // Rough estimate
      );
    }

    return {
      fireNOC: {
        required: !!(
          fireRule?.required &&
          maxHeight >= Number(fireRule.thresholdValue || 15)
        ),
        reason: fireRule?.notes || 'Fire NOC not required',
      },
      rainwaterHarvesting: {
        required: !!(
          rainwaterRule?.required &&
          plotAreaSqm >= Number(rainwaterRule.thresholdValue || 100)
        ),
        reason: rainwaterRule?.notes || 'Rainwater harvesting not required',
      },
      solarPanel: {
        required: !!(
          solarRule?.required &&
          plotAreaSqm >= Number(solarRule.thresholdValue || 500)
        ),
        reason: solarRule?.notes || 'Solar panel not required',
      },
      airportNOC: {
        required: !!(
          airportRule?.required &&
          maxHeight >= Number(airportRule.thresholdValue || 30)
        ),
        reason: airportRule?.notes || 'Airport NOC not required',
      },
      parkingRequirement: {
        requiredECS,
        notes: parkingRule?.notes || 'Minimum 1 ECS per dwelling unit',
      },
    };
  }
}
