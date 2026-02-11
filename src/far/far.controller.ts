import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { FarService } from './far.service';
import {
  CalculateFarDto,
  FarCalculationResponseDto,
  CityListResponseDto,
} from './dto';

@ApiTags('far')
@Controller('far')
export class FarController {
  constructor(private readonly farService: FarService) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate FAR for a plot',
    description:
      'Calculates Floor Area Ratio, maximum buildable area, setbacks, and compliance requirements based on city-specific bylaws.',
  })
  @ApiResponse({
    status: 200,
    description: 'FAR calculation successful',
    type: FarCalculationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input parameters',
  })
  @ApiResponse({
    status: 404,
    description: 'City not found or no applicable rules',
  })
  async calculateFar(
    @Body() input: CalculateFarDto,
  ): Promise<FarCalculationResponseDto> {
    return this.farService.calculateFar(input);
  }

  @Get('cities')
  @ApiOperation({
    summary: 'Get list of supported cities',
    description:
      'Returns all cities supported by the FAR calculator with their metadata.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of cities',
    type: CityListResponseDto,
  })
  async getCities(): Promise<CityListResponseDto> {
    const cities = await this.farService.getCities();
    return { cities };
  }

  @Get('cities/:cityId')
  @ApiOperation({
    summary: 'Get city details with bylaws',
    description:
      'Returns complete bylaw information for a specific city including plot size rules, basement rules, stilt rules, and compliance requirements.',
  })
  @ApiParam({
    name: 'cityId',
    description: 'City identifier',
    example: 'delhi',
  })
  @ApiResponse({
    status: 200,
    description: 'City details with bylaws',
  })
  @ApiResponse({
    status: 404,
    description: 'City not found',
  })
  async getCityBylaws(@Param('cityId') cityId: string) {
    const city = await this.farService.getCityWithRules(cityId);

    return {
      id: city.id,
      name: city.name,
      fullName: city.fullName,
      authority: city.authority,
      state: city.state,
      farUnit: city.farUnit,
      sourceUrl: city.sourceUrl,
      lastBylawUpdate: city.lastBylawUpdate,
      generalNotes: city.generalNotes,
      plotSizeRules: city.plotSizeRules.map((rule) => ({
        id: rule.id,
        minSizeSqm: Number(rule.minSizeSqm),
        maxSizeSqm: rule.maxSizeSqm ? Number(rule.maxSizeSqm) : null,
        far: Number(rule.far),
        groundCoverage: Number(rule.groundCoverage),
        maxDwellingUnits: rule.maxDwellingUnits,
        setbacks: rule.getSetbacks(),
        maxHeight: Number(rule.maxHeight),
        maxFloors: rule.maxFloors,
        notes: rule.notes,
      })),
      basementRules: city.basementRules.map((rule) => ({
        allowed: rule.allowed,
        countedInFar: rule.countedInFar,
        maxLevels: rule.maxLevels,
        minHeight: Number(rule.minHeight),
        maxHeight: Number(rule.maxHeight),
        allowedUses: rule.allowedUses,
        notes: rule.notes,
      })),
      stiltRules: city.stiltRules.map((rule) => ({
        allowed: rule.allowed,
        countedInFar: rule.countedInFar,
        minHeight: Number(rule.minHeight),
        mandatory: rule.mandatory,
        mandatoryAbovePlotSize: rule.mandatoryAbovePlotSize
          ? Number(rule.mandatoryAbovePlotSize)
          : null,
        mandatoryAboveFloors: rule.mandatoryAboveFloors,
        notes: rule.notes,
      })),
      complianceRules: city.complianceRules.map((rule) => ({
        ruleType: rule.ruleType,
        required: rule.required,
        thresholdValue: rule.thresholdValue
          ? Number(rule.thresholdValue)
          : null,
        thresholdType: rule.thresholdType,
        notes: rule.notes,
      })),
      roadWidthRules: city.roadWidthRules.map((rule) => ({
        minRoadWidth: Number(rule.minRoadWidth),
        maxRoadWidth: rule.maxRoadWidth ? Number(rule.maxRoadWidth) : null,
        far: Number(rule.far),
        notes: rule.notes,
      })),
    };
  }
}
