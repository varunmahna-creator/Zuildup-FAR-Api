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

export type FacingDirection = 'north' | 'south' | 'east' | 'west';
export type ArchitectureStyle = 'modern' | 'traditional' | 'contemporary' | 'minimalist';
export type KitchenType = 'modular' | 'semi-modular' | 'traditional';
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
  | 'home_theatre'
  | 'balcony'
  | 'terrace';

export class GenerateFloorPlanDto {
  @ApiProperty({
    description: 'Plot length in feet',
    example: 40,
    minimum: 15,
    maximum: 200,
  })
  @IsNumber()
  @Min(15)
  @Max(200)
  plotLength: number;

  @ApiProperty({
    description: 'Plot width in feet',
    example: 30,
    minimum: 15,
    maximum: 200,
  })
  @IsNumber()
  @Min(15)
  @Max(200)
  plotWidth: number;

  @ApiProperty({
    description: 'Plot facing direction',
    enum: ['north', 'south', 'east', 'west'],
    example: 'east',
  })
  @IsString()
  @IsIn(['north', 'south', 'east', 'west'])
  facing: FacingDirection;

  @ApiProperty({
    description: 'Number of floors (1 = Ground only, 2 = G+1, 3 = G+2, 4 = G+3)',
    example: 2,
    minimum: 1,
    maximum: 4,
  })
  @IsNumber()
  @Min(1)
  @Max(4)
  floors: number;

  @ApiProperty({
    description: 'Number of bedrooms (1-5)',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  bedrooms: number;

  @ApiProperty({
    description: 'Number of bathrooms (1-5)',
    example: 2,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  bathrooms: number;

  @ApiPropertyOptional({
    description: 'Kitchen type',
    enum: ['modular', 'semi-modular', 'traditional'],
    example: 'modular',
  })
  @IsOptional()
  @IsString()
  @IsIn(['modular', 'semi-modular', 'traditional'])
  kitchenType?: KitchenType;

  @ApiPropertyOptional({
    description: 'Additional rooms to include',
    example: ['pooja', 'store', 'parking'],
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
      'balcony',
      'terrace',
    ],
    { each: true },
  )
  additionalRooms?: RoomType[];

  @ApiPropertyOptional({
    description: 'Architecture style preference',
    enum: ['modern', 'traditional', 'contemporary', 'minimalist'],
    example: 'modern',
  })
  @IsOptional()
  @IsString()
  @IsIn(['modern', 'traditional', 'contemporary', 'minimalist'])
  style?: ArchitectureStyle;

  @ApiProperty({
    description: 'Whether to generate Vastu-compliant design',
    example: true,
  })
  @IsBoolean()
  vastuCompliant: boolean;

  @ApiPropertyOptional({
    description: 'Whether to include stilt parking',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  wantStilt?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to include basement',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  wantBasement?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to include lift',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  wantLift?: boolean;

  @ApiPropertyOptional({
    description: 'City for regional compliance (Delhi NCR)',
    enum: ['delhi', 'noida', 'gurugram', 'ghaziabad', 'faridabad'],
    example: 'delhi',
  })
  @IsOptional()
  @IsString()
  @IsIn(['delhi', 'noida', 'gurugram', 'ghaziabad', 'faridabad'])
  city?: string;
}

export class FloorPlanResponseDto {
  @ApiProperty({ description: 'Whether generation was successful' })
  success: boolean;

  @ApiProperty({ description: 'AI-generated floor plan description' })
  description: string;

  @ApiPropertyOptional({ description: 'Image prompt for DALL-E generation' })
  imagePrompt?: string;

  @ApiPropertyOptional({ description: 'Generated image URL (if available)' })
  imageUrl?: string;

  @ApiProperty({ description: 'Design rules applied' })
  rulesApplied: string[];

  @ApiProperty({ description: 'Plot details summary' })
  plotSummary: {
    area: number;
    length: number;
    width: number;
    facing: string;
    floors: string;
    bhk: number;
  };

  @ApiPropertyOptional({ description: 'Error message if generation failed' })
  error?: string;
}
