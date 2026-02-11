/**
 * Standalone Test Server for FAR Calculator
 * Runs without PostgreSQL - uses in-memory data
 *
 * Usage: node test-server.js
 * Then open: http://localhost:3001/api/docs
 */

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ============================================================================
// UNIT CONVERSION UTILITIES
// ============================================================================

const SQM_TO_SQFT = 10.7639;
const SQM_TO_SQYD = 1.19599;
const SQFT_TO_SQM = 0.092903;
const SQYD_TO_SQM = 0.836127;

function convertToSqm(area, unit) {
  switch (unit) {
    case 'sqm': return area;
    case 'sqft': return area * SQFT_TO_SQM;
    case 'sqyd':
    case 'gaj': return area * SQYD_TO_SQM;
    default: return area;
  }
}

function convertFromSqm(areaSqm) {
  return {
    sqm: round(areaSqm),
    sqft: round(areaSqm * SQM_TO_SQFT),
    sqyd: round(areaSqm * SQM_TO_SQYD),
    gaj: round(areaSqm * SQM_TO_SQYD),
  };
}

function round(value, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function calculateNetPlotArea(plotWidth, plotDepth, setbacks) {
  const netWidth = Math.max(0, plotWidth - setbacks.side1 - setbacks.side2);
  const netDepth = Math.max(0, plotDepth - setbacks.front - setbacks.rear);
  return netWidth * netDepth;
}

function estimatePlotDimensions(areaSqm) {
  const ratio = 1.2;
  const width = Math.sqrt(areaSqm / ratio);
  const depth = width * ratio;
  return { width: round(width), depth: round(depth) };
}

// ============================================================================
// IN-MEMORY SEED DATA
// ============================================================================

const cities = {
  delhi: {
    id: 'delhi',
    name: 'Delhi',
    fullName: 'New Delhi (MPD-2021)',
    authority: 'DDA / MCD (as per MPD-2021)',
    state: 'Delhi NCT',
    farUnit: 'percentage',
    sourceUrl: 'https://dda.org.in/planning/mpd-2021.htm',
    generalNotes: [
      'FAR calculations based on Master Plan for Delhi 2021',
      'Stilt parking is not counted in FAR if kept open',
      'Basement not counted in FAR if used for parking/storage only',
      'Height measured from ground level to top of building',
      'Lift machine room and water tank (mumty) allowed above max height',
    ],
  },
  noida: {
    id: 'noida',
    name: 'Noida',
    fullName: 'Noida (Greater Noida)',
    authority: 'Noida Authority / GNIDA',
    state: 'Uttar Pradesh',
    farUnit: 'ratio',
    sourceUrl: 'https://noidaauthorityonline.in/building-bylaws',
    generalNotes: [
      'FAR as per Noida Building Regulations 2020',
      'Additional FAR available for affordable housing',
      'Green building certification can get FAR bonus',
      'Basement floor not counted in FAR',
    ],
  },
  gurugram: {
    id: 'gurugram',
    name: 'Gurugram',
    fullName: 'Gurugram (Gurgaon)',
    authority: 'HSVP / DTCP Haryana',
    state: 'Haryana',
    farUnit: 'ratio',
    sourceUrl: 'https://tcpharyana.gov.in/BuildingByeLaws.htm',
    generalNotes: [
      'FAR as per Haryana Building Code 2017',
      'Licensed colony plots follow HSVP guidelines',
      'Additional FAR purchasable in some sectors',
      'Basement for parking not counted in FAR',
    ],
  },
  ghaziabad: {
    id: 'ghaziabad',
    name: 'Ghaziabad',
    fullName: 'Ghaziabad',
    authority: 'GDA (Ghaziabad Development Authority)',
    state: 'Uttar Pradesh',
    farUnit: 'ratio',
    sourceUrl: 'https://gda.gov.in/building-bye-laws',
    generalNotes: [
      'FAR as per GDA Building Bye-laws 2018',
      'Stilt parking exempted from FAR',
      'Basement allowed for parking/services only',
    ],
  },
  faridabad: {
    id: 'faridabad',
    name: 'Faridabad',
    fullName: 'Faridabad',
    authority: 'HSVP / MCF',
    state: 'Haryana',
    farUnit: 'ratio',
    sourceUrl: 'https://tcpharyana.gov.in/BuildingByeLaws.htm',
    generalNotes: [
      'FAR as per Haryana Building Code 2017',
      'Similar to Gurugram regulations',
      'Basement for parking not counted in FAR',
    ],
  },
};

// Plot Size Rules
const plotSizeRules = {
  delhi: [
    { minSizeSqm: 0, maxSizeSqm: 32, far: 350, groundCoverage: 90, maxDwellingUnits: 3, setbackFront: 0, setbackRear: 0, setbackSide1: 0, setbackSide2: 0, maxHeight: 17.5, maxFloors: 4, notes: 'Row housing - Plots below 32 sqm' },
    { minSizeSqm: 32, maxSizeSqm: 50, far: 350, groundCoverage: 90, maxDwellingUnits: 3, setbackFront: 0, setbackRear: 0, setbackSide1: 0, setbackSide2: 0, maxHeight: 17.5, maxFloors: 4, notes: 'Row housing - 32-50 sqm plots' },
    { minSizeSqm: 50, maxSizeSqm: 100, far: 350, groundCoverage: 90, maxDwellingUnits: 4, setbackFront: 0, setbackRear: 0, setbackSide1: 0, setbackSide2: 0, maxHeight: 17.5, maxFloors: 4, notes: 'Row housing type - Stilt + 4 floors (G+3)' },
    { minSizeSqm: 100, maxSizeSqm: 250, far: 300, groundCoverage: 75, maxDwellingUnits: 4, setbackFront: 3, setbackRear: 0, setbackSide1: 0, setbackSide2: 0, maxHeight: 17.5, maxFloors: 4, notes: 'Builder floor type - Front setback 3m required' },
    { minSizeSqm: 250, maxSizeSqm: 500, far: 225, groundCoverage: 75, maxDwellingUnits: 6, setbackFront: 3, setbackRear: 3, setbackSide1: 3, setbackSide2: 0, maxHeight: 17.5, maxFloors: 4, notes: 'Bungalow type - 3 sided setbacks' },
    { minSizeSqm: 500, maxSizeSqm: 750, far: 200, groundCoverage: 50, maxDwellingUnits: 6, setbackFront: 6, setbackRear: 3, setbackSide1: 3, setbackSide2: 3, maxHeight: 17.5, maxFloors: 4, notes: 'Large plot - All sided setbacks' },
    { minSizeSqm: 750, maxSizeSqm: 1000, far: 200, groundCoverage: 50, maxDwellingUnits: 9, setbackFront: 6, setbackRear: 3, setbackSide1: 3, setbackSide2: 3, maxHeight: 17.5, maxFloors: 4, notes: 'Estate plots - 750-1000 sqm' },
    { minSizeSqm: 1000, maxSizeSqm: null, far: 200, groundCoverage: 50, maxDwellingUnits: 12, setbackFront: 9, setbackRear: 3, setbackSide1: 3, setbackSide2: 3, maxHeight: 17.5, maxFloors: 4, notes: 'Large estate - Above 1000 sqm' },
  ],
  noida: [
    { minSizeSqm: 0, maxSizeSqm: 112, far: 1.8, groundCoverage: 65, maxDwellingUnits: 3, setbackFront: 3, setbackRear: 2, setbackSide1: 0, setbackSide2: 0, maxHeight: 15, maxFloors: 4, notes: 'Small plots up to 120 sqyd' },
    { minSizeSqm: 112, maxSizeSqm: 200, far: 1.8, groundCoverage: 65, maxDwellingUnits: 4, setbackFront: 3, setbackRear: 2, setbackSide1: 2, setbackSide2: 0, maxHeight: 15, maxFloors: 4, notes: '120-240 sqyd plots' },
    { minSizeSqm: 200, maxSizeSqm: 400, far: 1.5, groundCoverage: 55, maxDwellingUnits: 4, setbackFront: 4.5, setbackRear: 3, setbackSide1: 3, setbackSide2: 0, maxHeight: 15, maxFloors: 4, notes: '240-480 sqyd plots' },
    { minSizeSqm: 400, maxSizeSqm: null, far: 1.2, groundCoverage: 45, maxDwellingUnits: 6, setbackFront: 6, setbackRear: 3, setbackSide1: 3, setbackSide2: 3, maxHeight: 15, maxFloors: 4, notes: 'Large plots above 480 sqyd' },
  ],
  gurugram: [
    { minSizeSqm: 0, maxSizeSqm: 100, far: 1.75, groundCoverage: 75, maxDwellingUnits: 3, setbackFront: 3, setbackRear: 1.5, setbackSide1: 0, setbackSide2: 0, maxHeight: 15, maxFloors: 4, notes: 'Plots up to 100 sqm' },
    { minSizeSqm: 100, maxSizeSqm: 200, far: 1.75, groundCoverage: 66, maxDwellingUnits: 4, setbackFront: 3, setbackRear: 2, setbackSide1: 2, setbackSide2: 0, maxHeight: 15, maxFloors: 4, notes: '100-200 sqm plots' },
    { minSizeSqm: 200, maxSizeSqm: 500, far: 1.5, groundCoverage: 50, maxDwellingUnits: 4, setbackFront: 4.5, setbackRear: 2, setbackSide1: 2, setbackSide2: 2, maxHeight: 15, maxFloors: 4, notes: '200-500 sqm plots' },
    { minSizeSqm: 500, maxSizeSqm: null, far: 1.25, groundCoverage: 40, maxDwellingUnits: 6, setbackFront: 6, setbackRear: 3, setbackSide1: 3, setbackSide2: 3, maxHeight: 15, maxFloors: 4, notes: 'Large plots above 500 sqm' },
  ],
  ghaziabad: [
    { minSizeSqm: 0, maxSizeSqm: 100, far: 2.0, groundCoverage: 70, maxDwellingUnits: 3, setbackFront: 3, setbackRear: 2, setbackSide1: 0, setbackSide2: 0, maxHeight: 15, maxFloors: 4, notes: 'Small plots' },
    { minSizeSqm: 100, maxSizeSqm: 200, far: 1.8, groundCoverage: 65, maxDwellingUnits: 4, setbackFront: 3, setbackRear: 2, setbackSide1: 2, setbackSide2: 0, maxHeight: 15, maxFloors: 4, notes: '100-200 sqm plots' },
    { minSizeSqm: 200, maxSizeSqm: 400, far: 1.5, groundCoverage: 55, maxDwellingUnits: 4, setbackFront: 4.5, setbackRear: 3, setbackSide1: 2, setbackSide2: 2, maxHeight: 15, maxFloors: 4, notes: '200-400 sqm plots' },
    { minSizeSqm: 400, maxSizeSqm: null, far: 1.25, groundCoverage: 45, maxDwellingUnits: 6, setbackFront: 6, setbackRear: 3, setbackSide1: 3, setbackSide2: 3, maxHeight: 15, maxFloors: 4, notes: 'Large plots' },
  ],
  faridabad: [
    { minSizeSqm: 0, maxSizeSqm: 100, far: 1.75, groundCoverage: 75, maxDwellingUnits: 3, setbackFront: 3, setbackRear: 1.5, setbackSide1: 0, setbackSide2: 0, maxHeight: 15, maxFloors: 4, notes: 'Plots up to 100 sqm (Faridabad)' },
    { minSizeSqm: 100, maxSizeSqm: 200, far: 1.75, groundCoverage: 66, maxDwellingUnits: 4, setbackFront: 3, setbackRear: 2, setbackSide1: 2, setbackSide2: 0, maxHeight: 15, maxFloors: 4, notes: '100-200 sqm plots (Faridabad)' },
    { minSizeSqm: 200, maxSizeSqm: 500, far: 1.5, groundCoverage: 50, maxDwellingUnits: 4, setbackFront: 4.5, setbackRear: 2, setbackSide1: 2, setbackSide2: 2, maxHeight: 15, maxFloors: 4, notes: '200-500 sqm plots (Faridabad)' },
    { minSizeSqm: 500, maxSizeSqm: null, far: 1.25, groundCoverage: 40, maxDwellingUnits: 6, setbackFront: 6, setbackRear: 3, setbackSide1: 3, setbackSide2: 3, maxHeight: 15, maxFloors: 4, notes: 'Large plots above 500 sqm (Faridabad)' },
  ],
};

// Road Width Rules (Delhi only)
const roadWidthRules = {
  delhi: [
    { minRoadWidth: 0, maxRoadWidth: 9, far: 200, notes: 'Road < 9m' },
    { minRoadWidth: 9, maxRoadWidth: 12, far: 250, notes: 'Road 9-12m' },
    { minRoadWidth: 12, maxRoadWidth: 18, far: 300, notes: 'Road 12-18m' },
    { minRoadWidth: 18, maxRoadWidth: 24, far: 325, notes: 'Road 18-24m' },
    { minRoadWidth: 24, maxRoadWidth: null, far: 350, notes: 'Road > 24m' },
  ],
};

// Basement Rules
const basementRules = {
  delhi: { allowed: true, countedInFar: false, maxLevels: 2, minHeight: 2.4, maxHeight: 4.0, allowedUses: ['parking', 'storage', 'services'], notes: 'Basement not counted in FAR if used for permitted purposes only' },
  noida: { allowed: true, countedInFar: false, maxLevels: 1, minHeight: 2.4, maxHeight: 3.5, allowedUses: ['parking', 'storage'], notes: 'Single basement allowed' },
  gurugram: { allowed: true, countedInFar: false, maxLevels: 2, minHeight: 2.4, maxHeight: 4.0, allowedUses: ['parking', 'storage', 'servant quarter'], notes: 'Double basement allowed for plots > 500 sqm' },
  ghaziabad: { allowed: true, countedInFar: false, maxLevels: 1, minHeight: 2.4, maxHeight: 3.5, allowedUses: ['parking', 'storage'], notes: 'Single basement allowed' },
  faridabad: { allowed: true, countedInFar: false, maxLevels: 2, minHeight: 2.4, maxHeight: 4.0, allowedUses: ['parking', 'storage', 'servant quarter'], notes: 'Similar to Gurugram regulations' },
};

// Stilt Rules
const stiltRules = {
  delhi: { allowed: true, countedInFar: false, minHeight: 2.4, mandatory: true, mandatoryAboveFloors: 3, notes: 'Stilt mandatory for G+3 and above' },
  noida: { allowed: true, countedInFar: false, minHeight: 2.4, mandatory: false, notes: 'Stilt optional but recommended' },
  gurugram: { allowed: true, countedInFar: false, minHeight: 2.4, mandatory: false, notes: 'Stilt parking encouraged' },
  ghaziabad: { allowed: true, countedInFar: false, minHeight: 2.4, mandatory: false, notes: 'Stilt optional' },
  faridabad: { allowed: true, countedInFar: false, minHeight: 2.4, mandatory: false, notes: 'Stilt optional' },
};

// Compliance Rules
const complianceRules = [
  { ruleType: 'fire_noc', required: true, thresholdValue: 15, thresholdType: 'height', notes: 'Required for buildings above 15m height' },
  { ruleType: 'rainwater_harvesting', required: true, thresholdValue: 100, thresholdType: 'plot_size', notes: 'Mandatory for plots above 100 sqm' },
  { ruleType: 'solar_panel', required: true, thresholdValue: 500, thresholdType: 'plot_size', notes: 'Mandatory for plots above 500 sqm' },
  { ruleType: 'airport_noc', required: true, thresholdValue: 30, thresholdType: 'height', notes: 'Required for buildings above 30m near airports' },
  { ruleType: 'parking', required: true, thresholdValue: 1, thresholdType: 'floors', notes: 'Minimum 1 ECS per dwelling unit' },
];

// ============================================================================
// FAR CALCULATION LOGIC
// ============================================================================

function findApplicablePlotRule(rules, plotAreaSqm) {
  const sortedRules = [...rules].sort((a, b) => a.minSizeSqm - b.minSizeSqm);

  for (const rule of sortedRules) {
    const minSize = rule.minSizeSqm;
    const maxSize = rule.maxSizeSqm || Infinity;
    if (plotAreaSqm >= minSize && plotAreaSqm < maxSize) {
      return rule;
    }
  }
  return sortedRules[sortedRules.length - 1] || null;
}

function getFarByRoadWidth(rules, roadWidth, farUnit) {
  for (const rule of rules) {
    const minWidth = rule.minRoadWidth;
    const maxWidth = rule.maxRoadWidth || Infinity;
    if (roadWidth >= minWidth && roadWidth < maxWidth) {
      let far = rule.far;
      if (farUnit === 'percentage') {
        far = far / 100;
      }
      return far;
    }
  }
  return null;
}

function generateFloorBreakdown(input, groundFloorArea, basementRule, stiltRule, isStiltMandatory) {
  const floors = [];
  const SQM_TO_SQFT = 10.7639;

  // Basement
  if (input.wantBasement) {
    const basementLevels = input.basementType === 'double' ? 2 : 1;
    for (let i = basementLevels; i >= 1; i--) {
      floors.push({
        floorName: basementLevels > 1 ? `Basement ${i}` : 'Basement',
        floorType: 'basement',
        area: round(groundFloorArea),
        areaSqft: round(groundFloorArea * SQM_TO_SQFT),
        countedInFar: basementRule?.countedInFar ?? false,
        height: basementRule?.minHeight ?? 2.4,
        notes: `For ${(input.basementPurpose || ['parking', 'storage']).join('/')}`,
      });
    }
  }

  // Stilt
  if (input.wantStilt || isStiltMandatory) {
    floors.push({
      floorName: 'Stilt Parking',
      floorType: 'stilt',
      area: round(groundFloorArea),
      areaSqft: round(groundFloorArea * SQM_TO_SQFT),
      countedInFar: stiltRule?.countedInFar ?? false,
      height: stiltRule?.minHeight ?? 2.4,
      notes: isStiltMandatory ? 'Mandatory as per bylaws' : 'Open parking area',
    });
  }

  // Regular floors
  const floorNames = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor'];
  for (let i = 0; i < input.desiredFloors; i++) {
    floors.push({
      floorName: floorNames[i] || `Floor ${i + 1}`,
      floorType: 'regular',
      area: round(groundFloorArea),
      areaSqft: round(groundFloorArea * SQM_TO_SQFT),
      countedInFar: true,
      height: 3.0,
      notes: i === 0 && !input.wantStilt ? 'With parking provision' : undefined,
    });
  }

  // Terrace
  if (input.wantTerrace) {
    const terraceArea = groundFloorArea * 0.25;
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

function calculateCompliance(rules, plotAreaSqm, maxHeight, desiredFloors) {
  const getRule = (type) => rules.find((r) => r.ruleType === type);

  const fireRule = getRule('fire_noc');
  const rainwaterRule = getRule('rainwater_harvesting');
  const solarRule = getRule('solar_panel');
  const airportRule = getRule('airport_noc');
  const parkingRule = getRule('parking');

  let requiredECS = Math.min(desiredFloors, 4);
  if (parkingRule && plotAreaSqm > 300) {
    requiredECS = Math.max(requiredECS, Math.ceil(plotAreaSqm * 0.01));
  }

  return {
    fireNOC: {
      required: fireRule?.required && maxHeight >= (fireRule.thresholdValue || 15),
      reason: fireRule?.notes,
    },
    rainwaterHarvesting: {
      required: rainwaterRule?.required && plotAreaSqm >= (rainwaterRule.thresholdValue || 100),
      reason: rainwaterRule?.notes,
    },
    solarPanel: {
      required: solarRule?.required && plotAreaSqm >= (solarRule.thresholdValue || 500),
      reason: solarRule?.notes,
    },
    airportNOC: {
      required: airportRule?.required && maxHeight >= (airportRule.thresholdValue || 30),
      reason: airportRule?.notes,
    },
    parkingRequirement: {
      requiredECS,
      notes: parkingRule?.notes || 'Minimum 1 ECS per dwelling unit',
    },
  };
}

function calculateFar(input) {
  const city = cities[input.city];
  if (!city) {
    throw new Error(`City '${input.city}' not found. Available: ${Object.keys(cities).join(', ')}`);
  }

  const cityPlotRules = plotSizeRules[input.city];
  const cityRoadWidthRules = roadWidthRules[input.city] || [];
  const basementRule = basementRules[input.city];
  const stiltRule = stiltRules[input.city];

  const plotAreaSqm = convertToSqm(input.plotArea, input.plotUnit);
  const areaConversions = convertFromSqm(plotAreaSqm);

  const applicableRule = findApplicablePlotRule(cityPlotRules, plotAreaSqm);
  if (!applicableRule) {
    throw new Error(`No applicable FAR rules found for plot size: ${plotAreaSqm} sqm in ${city.name}`);
  }

  let effectiveFar = applicableRule.far;
  let farSource = 'plot_size';

  if (city.farUnit === 'percentage') {
    effectiveFar = effectiveFar / 100;
  }

  // Check road width FAR (Delhi specific)
  if (input.roadWidth && cityRoadWidthRules.length > 0) {
    const roadFar = getFarByRoadWidth(cityRoadWidthRules, input.roadWidth, city.farUnit);
    if (roadFar !== null && roadFar < effectiveFar) {
      effectiveFar = roadFar;
      farSource = 'road_width';
    }
  }

  const maxBuiltUpArea = plotAreaSqm * effectiveFar;
  const groundCoverage = applicableRule.groundCoverage;
  const maxGroundFloorArea = plotAreaSqm * (groundCoverage / 100);

  const dimensions = input.plotWidth && input.plotDepth
    ? { width: input.plotWidth, depth: input.plotDepth }
    : estimatePlotDimensions(plotAreaSqm);

  const setbacks = {
    front: applicableRule.setbackFront,
    rear: applicableRule.setbackRear,
    side1: applicableRule.setbackSide1,
    side2: applicableRule.setbackSide2,
  };

  const netPlotArea = calculateNetPlotArea(dimensions.width, dimensions.depth, setbacks);

  const isStiltMandatory = stiltRule?.mandatory && (
    (stiltRule.mandatoryAbovePlotSize && plotAreaSqm >= stiltRule.mandatoryAbovePlotSize) ||
    (stiltRule.mandatoryAboveFloors && input.desiredFloors >= stiltRule.mandatoryAboveFloors)
  );

  const floors = generateFloorBreakdown(input, maxGroundFloorArea, basementRule, stiltRule, isStiltMandatory);

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

  const compliance = calculateCompliance(complianceRules, plotAreaSqm, applicableRule.maxHeight, input.desiredFloors);

  const notes = [...city.generalNotes];
  if (applicableRule.notes) {
    notes.unshift(applicableRule.notes);
  }
  if (isStiltMandatory && !input.wantStilt) {
    notes.unshift('Note: Stilt parking is mandatory for your plot configuration');
  }
  if (input.wantBalcony) {
    notes.push('Balcony projections up to 1.5m (max 50% of setback) are allowed');
  }

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
    maxBuiltUpAreaSqft: round(maxBuiltUpArea * SQM_TO_SQFT),
    maxGroundFloorArea: round(maxGroundFloorArea),
    maxGroundFloorAreaSqft: round(maxGroundFloorArea * SQM_TO_SQFT),

    setbacks,

    maxHeight: applicableRule.maxHeight,
    maxFloors: applicableRule.maxFloors,
    maxDwellingUnits: applicableRule.maxDwellingUnits,

    netPlotArea: round(netPlotArea),
    netPlotAreaSqft: round(netPlotArea * SQM_TO_SQFT),

    basementInfo: {
      allowed: basementRule?.allowed ?? true,
      countedInFar: basementRule?.countedInFar ?? false,
      maxArea: round(maxGroundFloorArea),
      maxAreaSqft: round(maxGroundFloorArea * SQM_TO_SQFT),
      maxLevels: basementRule?.maxLevels ?? 1,
      minHeight: basementRule?.minHeight ?? 2.4,
      maxHeight: basementRule?.maxHeight ?? 4.0,
    },

    stiltInfo: {
      allowed: stiltRule?.allowed ?? true,
      countedInFar: stiltRule?.countedInFar ?? false,
      mandatory: isStiltMandatory,
      minHeight: stiltRule?.minHeight ?? 2.4,
      area: input.wantStilt ? round(maxGroundFloorArea) : undefined,
      areaSqft: input.wantStilt ? round(maxGroundFloorArea * SQM_TO_SQFT) : undefined,
    },

    floors,

    totalFarArea: round(totalFarArea),
    totalFarAreaSqft: round(totalFarArea * SQM_TO_SQFT),
    totalNonFarArea: round(totalNonFarArea),
    totalNonFarAreaSqft: round(totalNonFarArea * SQM_TO_SQFT),
    grandTotalArea: round(grandTotalArea),
    grandTotalAreaSqft: round(grandTotalArea * SQM_TO_SQFT),

    compliance,
    notes,
  };
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all cities
app.get('/api/v1/far/cities', (req, res) => {
  const cityList = Object.values(cities).map((city) => ({
    id: city.id,
    name: city.name,
    fullName: city.fullName,
    authority: city.authority,
    state: city.state,
  }));
  res.json(cityList);
});

// Get city with all rules
app.get('/api/v1/far/cities/:cityId', (req, res) => {
  const city = cities[req.params.cityId];
  if (!city) {
    return res.status(404).json({ error: `City '${req.params.cityId}' not found` });
  }
  res.json({
    ...city,
    plotSizeRules: plotSizeRules[city.id],
    roadWidthRules: roadWidthRules[city.id] || [],
    basementRules: basementRules[city.id],
    stiltRules: stiltRules[city.id],
    complianceRules: complianceRules,
  });
});

// Calculate FAR
app.post('/api/v1/far/calculate', (req, res) => {
  try {
    const input = req.body;

    // Validation
    if (!input.city) {
      return res.status(400).json({ error: 'city is required' });
    }
    if (!input.plotArea || input.plotArea <= 0) {
      return res.status(400).json({ error: 'plotArea must be a positive number' });
    }
    if (!input.plotUnit || !['sqm', 'sqft', 'sqyd', 'gaj'].includes(input.plotUnit)) {
      return res.status(400).json({ error: 'plotUnit must be one of: sqm, sqft, sqyd, gaj' });
    }
    if (!input.desiredFloors || input.desiredFloors < 1 || input.desiredFloors > 4) {
      return res.status(400).json({ error: 'desiredFloors must be between 1 and 4' });
    }

    const result = calculateFar(input);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// SWAGGER/OPENAPI DOCUMENTATION
// ============================================================================

const swaggerDoc = {
  openapi: '3.0.0',
  info: {
    title: 'Zuildup FAR Calculator API',
    version: '1.0.0',
    description: 'Floor Area Ratio Calculator for Delhi NCR residential construction',
  },
  servers: [{ url: 'http://localhost:3001', description: 'Test Server' }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: { '200': { description: 'Service is healthy' } },
      },
    },
    '/api/v1/far/cities': {
      get: {
        summary: 'List all supported cities',
        tags: ['FAR'],
        responses: {
          '200': {
            description: 'List of cities',
            content: {
              'application/json': {
                example: [
                  { id: 'delhi', name: 'Delhi', fullName: 'New Delhi (MPD-2021)', authority: 'DDA / MCD', state: 'Delhi NCT' },
                ],
              },
            },
          },
        },
      },
    },
    '/api/v1/far/cities/{cityId}': {
      get: {
        summary: 'Get city bylaws details',
        tags: ['FAR'],
        parameters: [{ name: 'cityId', in: 'path', required: true, schema: { type: 'string', enum: ['delhi', 'noida', 'gurugram', 'ghaziabad', 'faridabad'] } }],
        responses: {
          '200': { description: 'City with all rules' },
          '404': { description: 'City not found' },
        },
      },
    },
    '/api/v1/far/calculate': {
      post: {
        summary: 'Calculate FAR for a plot',
        tags: ['FAR'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['city', 'plotArea', 'plotUnit', 'desiredFloors'],
                properties: {
                  city: { type: 'string', enum: ['delhi', 'noida', 'gurugram', 'ghaziabad', 'faridabad'], example: 'delhi' },
                  plotArea: { type: 'number', example: 200 },
                  plotUnit: { type: 'string', enum: ['sqm', 'sqft', 'sqyd', 'gaj'], example: 'sqm' },
                  plotWidth: { type: 'number', example: 12, description: 'Optional plot width in meters' },
                  plotDepth: { type: 'number', example: 16.67, description: 'Optional plot depth in meters' },
                  roadWidth: { type: 'number', example: 12, description: 'Road width in meters (affects FAR in Delhi)' },
                  desiredFloors: { type: 'integer', minimum: 1, maximum: 4, example: 4 },
                  wantBasement: { type: 'boolean', default: false },
                  basementType: { type: 'string', enum: ['single', 'double'], default: 'single' },
                  basementPurpose: { type: 'array', items: { type: 'string' }, example: ['parking', 'storage'] },
                  wantStilt: { type: 'boolean', default: false },
                  wantTerrace: { type: 'boolean', default: true },
                  wantBalcony: { type: 'boolean', default: true },
                },
              },
              examples: {
                'Delhi 200sqm': {
                  summary: 'Delhi plot with road width',
                  value: { city: 'delhi', plotArea: 200, plotUnit: 'sqm', roadWidth: 12, desiredFloors: 4, wantBasement: true, wantStilt: true, wantTerrace: true },
                },
                'Noida 300sqyd': {
                  summary: 'Noida plot in sq yards',
                  value: { city: 'noida', plotArea: 300, plotUnit: 'sqyd', desiredFloors: 3, wantTerrace: true },
                },
                'Gurugram 500sqm': {
                  summary: 'Large Gurugram plot',
                  value: { city: 'gurugram', plotArea: 500, plotUnit: 'sqm', desiredFloors: 4, wantBasement: true, basementType: 'double' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'FAR calculation result with floor breakdown' },
          '400': { description: 'Validation error' },
          '404': { description: 'City not found' },
        },
      },
    },
  },
};

// Serve Swagger UI
app.get('/api/docs', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Zuildup FAR API Docs</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      spec: ${JSON.stringify(swaggerDoc)},
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: "BaseLayout"
    });
  </script>
</body>
</html>
  `);
});

// Serve OpenAPI spec
app.get('/api/docs/json', (req, res) => {
  res.json(swaggerDoc);
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🏗️  Zuildup FAR Calculator - Test Server                     ║
║                                                                ║
║   Server running at: http://localhost:${PORT}                    ║
║   API Docs (Swagger): http://localhost:${PORT}/api/docs          ║
║   Health Check: http://localhost:${PORT}/health                  ║
║                                                                ║
║   Endpoints:                                                   ║
║   - GET  /api/v1/far/cities         List all cities            ║
║   - GET  /api/v1/far/cities/:id     Get city bylaws            ║
║   - POST /api/v1/far/calculate      Calculate FAR              ║
║                                                                ║
║   No database required - using in-memory data                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});
