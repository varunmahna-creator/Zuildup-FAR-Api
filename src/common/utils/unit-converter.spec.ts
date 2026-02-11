import {
  convertToSqm,
  convertFromSqm,
  round,
  calculateNetPlotArea,
  estimatePlotDimensions,
  formatArea,
} from './unit-converter';

describe('Unit Converter Utilities', () => {
  describe('convertToSqm', () => {
    it('should return same value for sqm', () => {
      expect(convertToSqm(100, 'sqm')).toBe(100);
    });

    it('should convert sqft to sqm correctly', () => {
      // 1 sqft = 0.092903 sqm
      const result = convertToSqm(1000, 'sqft');
      expect(result).toBeCloseTo(92.903, 2);
    });

    it('should convert sqyd to sqm correctly', () => {
      // 1 sqyd = 0.836127 sqm
      const result = convertToSqm(100, 'sqyd');
      expect(result).toBeCloseTo(83.6127, 2);
    });

    it('should convert gaj to sqm correctly (same as sqyd)', () => {
      const result = convertToSqm(100, 'gaj');
      expect(result).toBeCloseTo(83.6127, 2);
    });

    it('should handle zero values', () => {
      expect(convertToSqm(0, 'sqm')).toBe(0);
      expect(convertToSqm(0, 'sqft')).toBe(0);
    });
  });

  describe('convertFromSqm', () => {
    it('should convert 100 sqm to all units', () => {
      const result = convertFromSqm(100);
      expect(result.sqm).toBe(100);
      expect(result.sqft).toBeCloseTo(1076.39, 1);
      expect(result.sqyd).toBeCloseTo(119.6, 1);
      expect(result.gaj).toBeCloseTo(119.6, 1);
    });

    it('should handle zero value', () => {
      const result = convertFromSqm(0);
      expect(result.sqm).toBe(0);
      expect(result.sqft).toBe(0);
      expect(result.sqyd).toBe(0);
      expect(result.gaj).toBe(0);
    });
  });

  describe('round', () => {
    it('should round to 2 decimal places by default', () => {
      expect(round(3.14159)).toBe(3.14);
      expect(round(3.145)).toBe(3.15);
      expect(round(3.144)).toBe(3.14);
    });

    it('should round to specified decimal places', () => {
      expect(round(3.14159, 3)).toBe(3.142);
      expect(round(3.14159, 1)).toBe(3.1);
      expect(round(3.14159, 0)).toBe(3);
    });

    it('should handle whole numbers', () => {
      expect(round(100)).toBe(100);
      expect(round(100, 3)).toBe(100);
    });
  });

  describe('calculateNetPlotArea', () => {
    it('should calculate net area with all setbacks', () => {
      // Plot: 20m x 30m with front:3, rear:3, side1:2, side2:2
      // Net: (20-2-2) x (30-3-3) = 16 x 24 = 384
      const result = calculateNetPlotArea(20, 30, {
        front: 3,
        rear: 3,
        side1: 2,
        side2: 2,
      });
      expect(result).toBe(384);
    });

    it('should calculate net area with zero setbacks', () => {
      const result = calculateNetPlotArea(10, 15, {
        front: 0,
        rear: 0,
        side1: 0,
        side2: 0,
      });
      expect(result).toBe(150);
    });

    it('should return 0 if setbacks exceed dimensions', () => {
      // If setbacks are larger than plot, result should be 0
      const result = calculateNetPlotArea(5, 5, {
        front: 3,
        rear: 3,
        side1: 3,
        side2: 3,
      });
      expect(result).toBe(0);
    });

    it('should handle partial setbacks (only front)', () => {
      const result = calculateNetPlotArea(10, 20, {
        front: 3,
        rear: 0,
        side1: 0,
        side2: 0,
      });
      // Net: 10 x (20-3) = 10 x 17 = 170
      expect(result).toBe(170);
    });
  });

  describe('estimatePlotDimensions', () => {
    it('should estimate dimensions with 1:1.2 ratio', () => {
      // For 120 sqm: width = sqrt(120/1.2) = 10, depth = 12
      const result = estimatePlotDimensions(120);
      expect(result.width).toBeCloseTo(10, 0);
      expect(result.depth).toBeCloseTo(12, 0);
    });

    it('should handle small plots', () => {
      const result = estimatePlotDimensions(48);
      // width = sqrt(48/1.2) = sqrt(40) ≈ 6.32
      // depth = 6.32 * 1.2 ≈ 7.59
      expect(result.width).toBeGreaterThan(0);
      expect(result.depth).toBeGreaterThan(result.width);
    });

    it('should maintain area approximately', () => {
      const area = 200;
      const result = estimatePlotDimensions(area);
      const calculatedArea = result.width * result.depth;
      // Allow 1% tolerance due to rounding
      expect(calculatedArea).toBeCloseTo(area, 0);
    });
  });

  describe('formatArea', () => {
    it('should format sqm correctly', () => {
      expect(formatArea(100, 'sqm')).toBe('100 sq.m');
    });

    it('should format sqft correctly', () => {
      expect(formatArea(1000, 'sqft')).toBe('1,000 sq.ft');
    });

    it('should format sqyd correctly', () => {
      expect(formatArea(250, 'sqyd')).toBe('250 sq.yd');
    });

    it('should format gaj correctly', () => {
      expect(formatArea(300, 'gaj')).toBe('300 gaj');
    });

    it('should format large numbers with locale formatting', () => {
      expect(formatArea(100000, 'sqft')).toBe('1,00,000 sq.ft');
    });
  });
});
