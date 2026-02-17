import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  IsIn,
  IsArray,
} from 'class-validator';

export type AreaUnit = 'sqm' | 'sqft' | 'sqyd' | 'gaj';
export type CityId = 'delhi' | 'noida' | 'gurugram' | 'ghaziabad' | 'faridabad';
export type FacingDirection = 'north' | 'south' | 'east' | 'west';
export type RoomType =
  | 'living'
  | 'dining'
  | 'kitchen'
  | 'pooja'
  | 'store'
  | 'utility'
  | 'parking'
  | 'servant'
  | 'study'
  | 'gym'
  | 'home_theatre';

export class CalculateFarDto {
  @ApiProperty({
    description: 'City ID',
    enum: ['delhi', 'noida', 'gurugram', 'ghaziabad', 'faridabad'],
    example: 'delhi',
  })
  @IsString()
  @IsIn(['delhi', 'noida', 'gurugram', 'ghaziabad', 'faridabad'])
  city: CityId;

  @ApiProperty({
    description: 'Plot area value',
    example: 200,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  plotArea: number;

  @ApiProperty({
    description: 'Unit of plot area',
    enum: ['sqm', 'sqft', 'sqyd', 'gaj'],
    example: 'sqyd',
  })
  @IsString()
  @IsIn(['sqm', 'sqft', 'sqyd', 'gaj'])
  plotUnit: AreaUnit;

  @ApiPropertyOptional({
    description: 'Plot width in meters',
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  plotWidth?: number;

  @ApiPropertyOptional({
    description: 'Plot depth in meters',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  plotDepth?: number;

  @ApiPropertyOptional({
    description: 'Road width in meters (affects FAR in Delhi)',
    example: 9,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  roadWidth?: number;

  @ApiProperty({
    description: 'Whether basement is desired',
    example: false,
  })
  @IsBoolean()
  wantBasement: boolean;

  @ApiPropertyOptional({
    description: 'Purpose of basement',
    example: ['parking', 'storage'],
  })
  @IsOptional()
  @IsArray()
  basementPurpose?: ('parking' | 'storage' | 'both')[];

  @ApiProperty({
    description: 'Whether stilt parking is desired',
    example: true,
  })
  @IsBoolean()
  wantStilt: boolean;

  @ApiProperty({
    description: 'Number of floors desired (1-4)',
    example: 3,
    minimum: 1,
    maximum: 4,
  })
  @IsNumber()
  @Min(1)
  @Max(4)
  desiredFloors: number;

  @ApiProperty({
    description: 'Whether balcony is desired',
    example: true,
  })
  @IsBoolean()
  wantBalcony: boolean;

  @ApiProperty({
    description: 'Whether terrace is desired',
    example: true,
  })
  @IsBoolean()
  wantTerrace: boolean;

  @ApiProperty({
    description: 'Whether lift is desired',
    example: false,
  })
  @IsBoolean()
  wantLift: boolean;

  // ============================================
  // FLOOR PLAN GENERATION INPUTS
  // ============================================

  @ApiPropertyOptional({
    description: 'Plot facing direction (for Vastu compliance)',
    enum: ['north', 'south', 'east', 'west'],
    example: 'east',
  })
  @IsOptional()
  @IsString()
  @IsIn(['north', 'south', 'east', 'west'])
  facing?: FacingDirection;

  @ApiPropertyOptional({
    description: 'Number of bedrooms (1-5)',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  bedrooms?: number;

  @ApiPropertyOptional({
    description: 'Number of bathrooms (1-5)',
    example: 2,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  bathrooms?: number;

  @ApiPropertyOptional({
    description: 'Additional rooms to include in floor plan',
    example: ['living', 'dining', 'kitchen', 'pooja'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsIn(
    [
      'living',
      'dining',
      'kitchen',
      'pooja',
      'store',
      'utility',
      'parking',
      'servant',
      'study',
      'gym',
      'home_theatre',
    ],
    { each: true },
  )
  rooms?: RoomType[];

  @ApiPropertyOptional({
    description: 'Whether to generate Vastu-compliant floor plan',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  vastuCompliant?: boolean;
}
