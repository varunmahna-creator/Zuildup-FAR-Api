import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetbacksDto {
  @ApiProperty({ example: 3 })
  front: number;

  @ApiProperty({ example: 0 })
  rear: number;

  @ApiProperty({ example: 0 })
  side1: number;

  @ApiProperty({ example: 0 })
  side2: number;
}

export class FloorBreakdownDto {
  @ApiProperty({ example: 'Ground Floor' })
  floorName: string;

  @ApiProperty({ example: 'regular' })
  floorType: 'basement' | 'stilt' | 'regular' | 'terrace';

  @ApiProperty({ example: 125.42 })
  area: number;

  @ApiProperty({ example: 1350.5 })
  areaSqft: number;

  @ApiProperty({ example: true })
  countedInFar: boolean;

  @ApiPropertyOptional({ example: 3.0 })
  height?: number;

  @ApiPropertyOptional({ example: 'With parking provision' })
  notes?: string;
}

export class BasementInfoDto {
  @ApiProperty({ example: true })
  allowed: boolean;

  @ApiProperty({ example: false })
  countedInFar: boolean;

  @ApiProperty({ example: 125.42 })
  maxArea: number;

  @ApiProperty({ example: 1350.5 })
  maxAreaSqft: number;

  @ApiProperty({ example: 2 })
  maxLevels: number;

  @ApiProperty({ example: 2.4 })
  minHeight: number;

  @ApiProperty({ example: 4.0 })
  maxHeight: number;
}

export class StiltInfoDto {
  @ApiProperty({ example: true })
  allowed: boolean;

  @ApiProperty({ example: false })
  countedInFar: boolean;

  @ApiProperty({ example: false })
  mandatory: boolean;

  @ApiProperty({ example: 2.4 })
  minHeight: number;

  @ApiPropertyOptional({ example: 125.42 })
  area?: number;

  @ApiPropertyOptional({ example: 1350.5 })
  areaSqft?: number;
}

export class ComplianceItemDto {
  @ApiProperty({ example: true })
  required: boolean;

  @ApiPropertyOptional({ example: 'Required for buildings above 15m height' })
  reason?: string;
}

export class ParkingRequirementDto {
  @ApiProperty({ example: 3 })
  requiredECS: number;

  @ApiPropertyOptional({ example: 'Minimum 1 ECS per dwelling unit' })
  notes?: string;
}

export class ComplianceResultDto {
  @ApiProperty()
  fireNOC: ComplianceItemDto;

  @ApiProperty()
  rainwaterHarvesting: ComplianceItemDto;

  @ApiProperty()
  solarPanel: ComplianceItemDto;

  @ApiProperty()
  airportNOC: ComplianceItemDto;

  @ApiProperty()
  parkingRequirement: ParkingRequirementDto;
}

export class CityInfoDto {
  @ApiProperty({ example: 'delhi' })
  id: string;

  @ApiProperty({ example: 'Delhi' })
  name: string;

  @ApiProperty({ example: 'New Delhi (MPD-2021)' })
  fullName: string;

  @ApiProperty({ example: 'DDA / MCD (as per MPD-2021)' })
  authority: string;

  @ApiProperty({ example: 'Delhi NCT' })
  state: string;
}

export class FarCalculationResponseDto {
  @ApiProperty({ description: 'City information' })
  city: CityInfoDto;

  @ApiProperty({ example: 167.22, description: 'Plot area in square meters' })
  plotAreaSqm: number;

  @ApiProperty({ example: 1800, description: 'Plot area in square feet' })
  plotAreaSqft: number;

  @ApiProperty({ example: 200, description: 'Plot area in square yards' })
  plotAreaSqyd: number;

  @ApiProperty({ example: 200, description: 'Plot area in gaj' })
  plotAreaGaj: number;

  @ApiPropertyOptional({
    example: 9,
    description: 'Road width in meters',
  })
  roadWidth?: number;

  @ApiProperty({ example: 3.0, description: 'Applicable FAR value' })
  applicableFar: number;

  @ApiProperty({
    example: 75,
    description: 'Maximum ground coverage percentage',
  })
  groundCoverage: number;

  @ApiPropertyOptional({
    example: 'plot_size',
    description: 'Source of FAR determination',
  })
  farSource?: string;

  @ApiProperty({ example: 501.66, description: 'Maximum built-up area in sqm' })
  maxBuiltUpArea: number;

  @ApiProperty({
    example: 5400,
    description: 'Maximum built-up area in sqft',
  })
  maxBuiltUpAreaSqft: number;

  @ApiProperty({
    example: 125.42,
    description: 'Maximum ground floor area in sqm',
  })
  maxGroundFloorArea: number;

  @ApiProperty({
    example: 1350,
    description: 'Maximum ground floor area in sqft',
  })
  maxGroundFloorAreaSqft: number;

  @ApiProperty({ description: 'Setback requirements' })
  setbacks: SetbacksDto;

  @ApiProperty({
    example: 17.5,
    description: 'Maximum building height in meters',
  })
  maxHeight: number;

  @ApiProperty({ example: 4, description: 'Maximum number of floors' })
  maxFloors: number;

  @ApiPropertyOptional({
    example: 4,
    description: 'Maximum dwelling units allowed',
  })
  maxDwellingUnits?: number;

  @ApiProperty({
    example: 100.34,
    description: 'Net plot area after setbacks in sqm',
  })
  netPlotArea: number;

  @ApiProperty({
    example: 1080.26,
    description: 'Net plot area after setbacks in sqft',
  })
  netPlotAreaSqft: number;

  @ApiProperty({ description: 'Basement information' })
  basementInfo: BasementInfoDto;

  @ApiProperty({ description: 'Stilt information' })
  stiltInfo: StiltInfoDto;

  @ApiProperty({
    type: [FloorBreakdownDto],
    description: 'Floor-wise breakdown',
  })
  floors: FloorBreakdownDto[];

  @ApiProperty({ example: 376.26, description: 'Total FAR area in sqm' })
  totalFarArea: number;

  @ApiProperty({ example: 4050.59, description: 'Total FAR area in sqft' })
  totalFarAreaSqft: number;

  @ApiProperty({ example: 125.42, description: 'Total non-FAR area in sqm' })
  totalNonFarArea: number;

  @ApiProperty({ example: 1350.5, description: 'Total non-FAR area in sqft' })
  totalNonFarAreaSqft: number;

  @ApiProperty({ example: 501.68, description: 'Grand total area in sqm' })
  grandTotalArea: number;

  @ApiProperty({ example: 5401.09, description: 'Grand total area in sqft' })
  grandTotalAreaSqft: number;

  @ApiProperty({ description: 'Compliance requirements' })
  compliance: ComplianceResultDto;

  @ApiProperty({
    type: [String],
    description: 'Important notes and disclaimers',
  })
  notes: string[];
}

// City list response
export class CityListItemDto {
  @ApiProperty({ example: 'delhi' })
  id: string;

  @ApiProperty({ example: 'Delhi' })
  name: string;

  @ApiProperty({ example: 'New Delhi (MPD-2021)' })
  fullName: string;

  @ApiProperty({ example: 'DDA / MCD (as per MPD-2021)' })
  authority: string;

  @ApiProperty({ example: 'Delhi NCT' })
  state: string;
}

export class CityListResponseDto {
  @ApiProperty({ type: [CityListItemDto] })
  cities: CityListItemDto[];
}
