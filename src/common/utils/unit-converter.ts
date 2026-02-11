/**
 * Unit conversion utilities for area calculations
 */

// Conversion constants
const SQM_TO_SQFT = 10.7639;
const SQM_TO_SQYD = 1.19599;
const SQFT_TO_SQM = 0.092903;
const SQYD_TO_SQM = 0.836127;

export type AreaUnit = 'sqm' | 'sqft' | 'sqyd' | 'gaj';

/**
 * Convert any area unit to square meters
 */
export function convertToSqm(area: number, unit: AreaUnit): number {
  switch (unit) {
    case 'sqm':
      return area;
    case 'sqft':
      return area * SQFT_TO_SQM;
    case 'sqyd':
    case 'gaj': // Gaj is same as sq yards
      return area * SQYD_TO_SQM;
    default:
      return area;
  }
}

/**
 * Convert square meters to all other units
 */
export function convertFromSqm(areaSqm: number): {
  sqm: number;
  sqft: number;
  sqyd: number;
  gaj: number;
} {
  return {
    sqm: round(areaSqm),
    sqft: round(areaSqm * SQM_TO_SQFT),
    sqyd: round(areaSqm * SQM_TO_SQYD),
    gaj: round(areaSqm * SQM_TO_SQYD),
  };
}

/**
 * Round to 2 decimal places
 */
export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate net plot area after setbacks
 */
export function calculateNetPlotArea(
  plotWidth: number,
  plotDepth: number,
  setbacks: { front: number; rear: number; side1: number; side2: number },
): number {
  const netWidth = Math.max(0, plotWidth - setbacks.side1 - setbacks.side2);
  const netDepth = Math.max(0, plotDepth - setbacks.front - setbacks.rear);
  return netWidth * netDepth;
}

/**
 * Estimate plot dimensions from area (assuming roughly square plot)
 * Common Indian plots are slightly rectangular with 1:1.2 ratio
 */
export function estimatePlotDimensions(areaSqm: number): {
  width: number;
  depth: number;
} {
  const ratio = 1.2;
  const width = Math.sqrt(areaSqm / ratio);
  const depth = width * ratio;
  return {
    width: round(width),
    depth: round(depth),
  };
}

/**
 * Format area for display with locale
 */
export function formatArea(area: number, unit: AreaUnit): string {
  const unitLabels: Record<AreaUnit, string> = {
    sqm: 'sq.m',
    sqft: 'sq.ft',
    sqyd: 'sq.yd',
    gaj: 'gaj',
  };
  return `${area.toLocaleString('en-IN')} ${unitLabels[unit]}`;
}
