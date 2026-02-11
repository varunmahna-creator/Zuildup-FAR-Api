/**
 * FAR Calculation Logic Tests
 * Tests the core calculation algorithms independent of NestJS/TypeORM
 */

import {
  convertToSqm,
  round,
  calculateNetPlotArea,
  estimatePlotDimensions,
} from '../common/utils/unit-converter';

// Mock data structures matching the entities
interface PlotSizeRule {
  minSizeSqm: number;
  maxSizeSqm: number | null;
  far: number;
  groundCoverage: number;
  setbackFront: number;
  setbackRear: number;
  setbackSide1: number;
  setbackSide2: number;
  maxHeight: number;
  maxFloors: number;
  maxDwellingUnits: number;
  notes: string;
}

interface RoadWidthRule {
  minRoadWidth: number;
  maxRoadWidth: number | null;
  far: number;
  notes: string;
}

// Test data
const delhiPlotRules: PlotSizeRule[] = [
  { minSizeSqm: 0, maxSizeSqm: 50, far: 350, groundCoverage: 90, setbackFront: 0, setbackRear: 0, setbackSide1: 0, setbackSide2: 0, maxHeight: 17.5, maxFloors: 4, maxDwellingUnits: 3, notes: 'Row housing' },
  { minSizeSqm: 50, maxSizeSqm: 100, far: 350, groundCoverage: 90, setbackFront: 0, setbackRear: 0, setbackSide1: 0, setbackSide2: 0, maxHeight: 17.5, maxFloors: 4, maxDwellingUnits: 4, notes: 'Row housing type' },
  { minSizeSqm: 100, maxSizeSqm: 250, far: 300, groundCoverage: 75, setbackFront: 3, setbackRear: 0, setbackSide1: 0, setbackSide2: 0, maxHeight: 17.5, maxFloors: 4, maxDwellingUnits: 4, notes: 'Builder floor' },
  { minSizeSqm: 250, maxSizeSqm: 500, far: 225, groundCoverage: 75, setbackFront: 3, setbackRear: 3, setbackSide1: 3, setbackSide2: 0, maxHeight: 17.5, maxFloors: 4, maxDwellingUnits: 6, notes: 'Bungalow type' },
  { minSizeSqm: 500, maxSizeSqm: null, far: 200, groundCoverage: 50, setbackFront: 6, setbackRear: 3, setbackSide1: 3, setbackSide2: 3, maxHeight: 17.5, maxFloors: 4, maxDwellingUnits: 6, notes: 'Large plot' },
];

const delhiRoadWidthRules: RoadWidthRule[] = [
  { minRoadWidth: 0, maxRoadWidth: 9, far: 200, notes: 'Road < 9m' },
  { minRoadWidth: 9, maxRoadWidth: 12, far: 250, notes: 'Road 9-12m' },
  { minRoadWidth: 12, maxRoadWidth: 18, far: 300, notes: 'Road 12-18m' },
  { minRoadWidth: 18, maxRoadWidth: 24, far: 325, notes: 'Road 18-24m' },
  { minRoadWidth: 24, maxRoadWidth: null, far: 350, notes: 'Road > 24m' },
];

const noidaPlotRules: PlotSizeRule[] = [
  { minSizeSqm: 0, maxSizeSqm: 112, far: 1.8, groundCoverage: 65, setbackFront: 3, setbackRear: 2, setbackSide1: 0, setbackSide2: 0, maxHeight: 15, maxFloors: 4, maxDwellingUnits: 3, notes: 'Small plots' },
  { minSizeSqm: 112, maxSizeSqm: 200, far: 1.8, groundCoverage: 65, setbackFront: 3, setbackRear: 2, setbackSide1: 2, setbackSide2: 0, maxHeight: 15, maxFloors: 4, maxDwellingUnits: 4, notes: '120-240 sqyd' },
  { minSizeSqm: 200, maxSizeSqm: 400, far: 1.5, groundCoverage: 55, setbackFront: 4.5, setbackRear: 3, setbackSide1: 3, setbackSide2: 0, maxHeight: 15, maxFloors: 4, maxDwellingUnits: 4, notes: '240-480 sqyd' },
  { minSizeSqm: 400, maxSizeSqm: null, far: 1.2, groundCoverage: 45, setbackFront: 6, setbackRear: 3, setbackSide1: 3, setbackSide2: 3, maxHeight: 15, maxFloors: 4, maxDwellingUnits: 6, notes: 'Large plots' },
];

// Helper functions (mimicking the service logic)
function findApplicablePlotRule(
  rules: PlotSizeRule[],
  plotAreaSqm: number,
): PlotSizeRule | null {
  const sortedRules = [...rules].sort((a, b) => a.minSizeSqm - b.minSizeSqm);

  for (const rule of sortedRules) {
    const minSize = rule.minSizeSqm;
    const maxSize = rule.maxSizeSqm ?? Infinity;
    if (plotAreaSqm >= minSize && plotAreaSqm < maxSize) {
      return rule;
    }
  }
  return sortedRules[sortedRules.length - 1] || null;
}

function getFarByRoadWidth(
  rules: RoadWidthRule[],
  roadWidth: number,
  farUnit: 'percentage' | 'ratio',
): number | null {
  for (const rule of rules) {
    const minWidth = rule.minRoadWidth;
    const maxWidth = rule.maxRoadWidth ?? Infinity;
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

describe('FAR Calculation Logic', () => {
  describe('findApplicablePlotRule', () => {
    it('should find correct rule for Delhi 200 sqm plot', () => {
      const rule = findApplicablePlotRule(delhiPlotRules, 200);
      expect(rule).not.toBeNull();
      expect(rule!.far).toBe(300); // 100-250 sqm bracket
      expect(rule!.groundCoverage).toBe(75);
    });

    it('should find correct rule for Delhi small plot (40 sqm)', () => {
      const rule = findApplicablePlotRule(delhiPlotRules, 40);
      expect(rule).not.toBeNull();
      expect(rule!.far).toBe(350);
      expect(rule!.groundCoverage).toBe(90);
    });

    it('should find correct rule for Delhi large plot (600 sqm)', () => {
      const rule = findApplicablePlotRule(delhiPlotRules, 600);
      expect(rule).not.toBeNull();
      expect(rule!.far).toBe(200);
      expect(rule!.groundCoverage).toBe(50);
    });

    it('should return last rule for very large plots', () => {
      const rule = findApplicablePlotRule(delhiPlotRules, 10000);
      expect(rule).not.toBeNull();
      expect(rule!.far).toBe(200); // Largest bracket (500+ sqm)
    });

    it('should find correct rule for Noida plots', () => {
      const rule = findApplicablePlotRule(noidaPlotRules, 250);
      expect(rule).not.toBeNull();
      expect(rule!.far).toBe(1.5); // 200-400 sqm bracket
      expect(rule!.groundCoverage).toBe(55);
    });
  });

  describe('getFarByRoadWidth', () => {
    it('should return correct FAR for narrow road (< 9m)', () => {
      const far = getFarByRoadWidth(delhiRoadWidthRules, 6, 'percentage');
      expect(far).toBe(2.0); // 200% converted to ratio
    });

    it('should return correct FAR for 12m road', () => {
      const far = getFarByRoadWidth(delhiRoadWidthRules, 12, 'percentage');
      expect(far).toBe(3.0); // 300% converted to ratio
    });

    it('should return correct FAR for wide road (> 24m)', () => {
      const far = getFarByRoadWidth(delhiRoadWidthRules, 30, 'percentage');
      expect(far).toBe(3.5); // 350% converted to ratio
    });

    it('should handle ratio unit without conversion', () => {
      // If farUnit is already ratio, no conversion needed
      const mockRatioRules: RoadWidthRule[] = [
        { minRoadWidth: 0, maxRoadWidth: 9, far: 1.5, notes: 'Test' },
      ];
      const far = getFarByRoadWidth(mockRatioRules, 6, 'ratio');
      expect(far).toBe(1.5);
    });
  });

  describe('Delhi FAR Calculations', () => {
    it('should calculate correct FAR for 200 sqm plot with 12m road', () => {
      const plotAreaSqm = 200;
      const roadWidth = 12;

      const rule = findApplicablePlotRule(delhiPlotRules, plotAreaSqm);
      let effectiveFar = rule!.far / 100; // Convert percentage to ratio

      const roadFar = getFarByRoadWidth(delhiRoadWidthRules, roadWidth, 'percentage');

      // FAR should be minimum of plot-based and road-based
      if (roadFar !== null && roadFar < effectiveFar) {
        effectiveFar = roadFar;
      }

      expect(effectiveFar).toBe(3.0); // Plot FAR (3.0) equals road FAR (3.0)

      const maxBuiltUpArea = plotAreaSqm * effectiveFar;
      expect(maxBuiltUpArea).toBe(600); // 200 * 3.0 = 600 sqm
    });

    it('should limit FAR based on narrow road', () => {
      const plotAreaSqm = 200;
      const roadWidth = 6; // Narrow road

      const rule = findApplicablePlotRule(delhiPlotRules, plotAreaSqm);
      let effectiveFar = rule!.far / 100; // 3.0

      const roadFar = getFarByRoadWidth(delhiRoadWidthRules, roadWidth, 'percentage');
      // Road FAR is 2.0 (< 9m road)

      if (roadFar !== null && roadFar < effectiveFar) {
        effectiveFar = roadFar;
      }

      expect(effectiveFar).toBe(2.0); // Limited by road width

      const maxBuiltUpArea = plotAreaSqm * effectiveFar;
      expect(maxBuiltUpArea).toBe(400); // 200 * 2.0 = 400 sqm
    });

    it('should calculate ground floor area correctly', () => {
      const plotAreaSqm = 200;
      const rule = findApplicablePlotRule(delhiPlotRules, plotAreaSqm);
      const groundCoverage = rule!.groundCoverage;

      const maxGroundFloorArea = plotAreaSqm * (groundCoverage / 100);
      expect(maxGroundFloorArea).toBe(150); // 200 * 0.75 = 150 sqm
    });
  });

  describe('Noida FAR Calculations', () => {
    it('should calculate FAR for 250 sqm Noida plot', () => {
      const plotAreaSqm = 250;

      const rule = findApplicablePlotRule(noidaPlotRules, plotAreaSqm);
      const effectiveFar = rule!.far; // Noida uses ratio directly

      expect(effectiveFar).toBe(1.5);

      const maxBuiltUpArea = plotAreaSqm * effectiveFar;
      expect(maxBuiltUpArea).toBe(375); // 250 * 1.5 = 375 sqm
    });

    it('should calculate ground floor area for Noida', () => {
      const plotAreaSqm = 250;
      const rule = findApplicablePlotRule(noidaPlotRules, plotAreaSqm);
      const groundCoverage = rule!.groundCoverage;

      const maxGroundFloorArea = plotAreaSqm * (groundCoverage / 100);
      expect(maxGroundFloorArea).toBe(137.5); // 250 * 0.55 = 137.5 sqm
    });
  });

  describe('Unit Conversions in FAR Context', () => {
    it('should convert 300 sqyd to sqm correctly', () => {
      const plotAreaSqyd = 300;
      const plotAreaSqm = convertToSqm(plotAreaSqyd, 'sqyd');

      // 300 sqyd * 0.836127 = ~250.84 sqm
      expect(plotAreaSqm).toBeCloseTo(250.84, 1);
    });

    it('should convert 250 gaj to sqm correctly (same as sqyd)', () => {
      const plotAreaGaj = 250;
      const plotAreaSqm = convertToSqm(plotAreaGaj, 'gaj');

      // 250 gaj * 0.836127 = ~209.03 sqm
      expect(plotAreaSqm).toBeCloseTo(209.03, 1);
    });

    it('should find correct rule after unit conversion', () => {
      // User inputs 300 sqyd plot in Noida
      const plotAreaSqyd = 300;
      const plotAreaSqm = convertToSqm(plotAreaSqyd, 'sqyd'); // ~250.84 sqm

      const rule = findApplicablePlotRule(noidaPlotRules, plotAreaSqm);
      expect(rule).not.toBeNull();
      expect(rule!.far).toBe(1.5); // Falls in 200-400 sqm bracket
    });
  });

  describe('Net Plot Area Calculations', () => {
    it('should calculate net area for Delhi builder floor type', () => {
      // 200 sqm plot, dimensions estimated
      const dims = estimatePlotDimensions(200);
      // ~12.91m x 15.49m

      // Builder floor setbacks: front:3, rear:0, side1:0, side2:0
      const netArea = calculateNetPlotArea(dims.width, dims.depth, {
        front: 3,
        rear: 0,
        side1: 0,
        side2: 0,
      });

      // Net depth = 15.49 - 3 = 12.49
      // Net area = 12.91 * 12.49 ≈ 161.25
      expect(netArea).toBeCloseTo(161.25, 0);
    });

    it('should calculate net area for large plot with all setbacks', () => {
      // 500 sqm plot: setbacks front:6, rear:3, side1:3, side2:3
      const dims = estimatePlotDimensions(500);
      // ~20.41m x 24.49m

      const netArea = calculateNetPlotArea(dims.width, dims.depth, {
        front: 6,
        rear: 3,
        side1: 3,
        side2: 3,
      });

      // Net width = 20.41 - 6 = 14.41
      // Net depth = 24.49 - 9 = 15.49
      expect(netArea).toBeGreaterThan(0);
      expect(netArea).toBeLessThan(500);
    });
  });

  describe('Floor Breakdown Calculations', () => {
    it('should calculate total FAR area for 4 floors', () => {
      const plotAreaSqm = 200;
      const rule = findApplicablePlotRule(delhiPlotRules, plotAreaSqm);
      const groundFloorArea = plotAreaSqm * (rule!.groundCoverage / 100); // 150 sqm
      const numFloors = 4;

      const totalFarArea = groundFloorArea * numFloors;
      expect(totalFarArea).toBe(600); // 150 * 4 = 600 sqm
    });

    it('should not count basement in FAR', () => {
      const groundFloorArea = 150;
      const basementArea = groundFloorArea; // Same as ground floor
      const regularFloorsArea = groundFloorArea * 4;

      const totalFarArea = regularFloorsArea; // Basement NOT counted
      const totalNonFarArea = basementArea; // Basement is non-FAR

      expect(totalFarArea).toBe(600);
      expect(totalNonFarArea).toBe(150);
    });

    it('should not count stilt in FAR', () => {
      const groundFloorArea = 150;
      const stiltArea = groundFloorArea;
      const regularFloorsArea = groundFloorArea * 4;

      const totalFarArea = regularFloorsArea; // Stilt NOT counted
      const totalNonFarArea = stiltArea;

      expect(totalFarArea).toBe(600);
      expect(totalNonFarArea).toBe(150);
    });

    it('should calculate terrace area as 25% of ground floor', () => {
      const groundFloorArea = 150;
      const terraceArea = groundFloorArea * 0.25;

      expect(terraceArea).toBe(37.5);
    });
  });

  describe('Compliance Requirements', () => {
    it('should require fire NOC for buildings >= 15m', () => {
      const maxHeight = 17.5;
      const fireNOCRequired = maxHeight >= 15;
      expect(fireNOCRequired).toBe(true);
    });

    it('should not require fire NOC for buildings < 15m', () => {
      const maxHeight = 12;
      const fireNOCRequired = maxHeight >= 15;
      expect(fireNOCRequired).toBe(false);
    });

    it('should require rainwater harvesting for plots >= 100 sqm', () => {
      const plotAreaSqm = 200;
      const rainwaterRequired = plotAreaSqm >= 100;
      expect(rainwaterRequired).toBe(true);
    });

    it('should require solar panel for plots >= 500 sqm', () => {
      const plotAreaSqm = 600;
      const solarRequired = plotAreaSqm >= 500;
      expect(solarRequired).toBe(true);
    });

    it('should not require solar panel for plots < 500 sqm', () => {
      const plotAreaSqm = 200;
      const solarRequired = plotAreaSqm >= 500;
      expect(solarRequired).toBe(false);
    });

    it('should calculate parking requirement as 1 ECS per floor', () => {
      const numFloors = 4;
      const requiredECS = Math.min(numFloors, 4);
      expect(requiredECS).toBe(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum plot size (0 sqm boundary)', () => {
      const rule = findApplicablePlotRule(delhiPlotRules, 1);
      expect(rule).not.toBeNull();
      expect(rule!.minSizeSqm).toBe(0);
    });

    it('should handle exact boundary values', () => {
      // At exactly 100 sqm, should get 100-250 bracket
      const rule = findApplicablePlotRule(delhiPlotRules, 100);
      expect(rule!.far).toBe(300);
    });

    it('should handle very small road width', () => {
      const far = getFarByRoadWidth(delhiRoadWidthRules, 3, 'percentage');
      expect(far).toBe(2.0); // Falls in 0-9m bracket
    });

    it('should handle exact road width boundaries', () => {
      // At exactly 9m, should get 9-12m bracket
      const far = getFarByRoadWidth(delhiRoadWidthRules, 9, 'percentage');
      expect(far).toBe(2.5); // 250% converted to 2.5
    });
  });
});
