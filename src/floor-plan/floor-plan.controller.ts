import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FloorPlanService } from './floor-plan.service';
import {
  GenerateFloorPlanDto,
  FloorPlanResponseDto,
} from './dto/generate-floor-plan.dto';
import { DESIGN_RULES, getRelevantRules } from './design-rules';

@ApiTags('Floor Plan')
@Controller('api/v1/floor-plan')
export class FloorPlanController {
  constructor(private readonly floorPlanService: FloorPlanService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate AI floor plan',
    description:
      'Generate a detailed floor plan description using AI based on plot specifications and design preferences',
  })
  @ApiResponse({
    status: 200,
    description: 'Floor plan generated successfully',
    type: FloorPlanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input parameters',
  })
  async generateFloorPlan(
    @Body() dto: GenerateFloorPlanDto,
  ): Promise<FloorPlanResponseDto> {
    return this.floorPlanService.generateFloorPlan(dto);
  }

  @Get('rules')
  @ApiOperation({
    summary: 'Get all design rules',
    description:
      'Get all available Vastu and practical design rules for floor plan generation',
  })
  @ApiResponse({
    status: 200,
    description: 'List of design rules',
  })
  getAllRules() {
    const vastuRules = DESIGN_RULES.filter((r) => r.vastu);
    const practicalRules = DESIGN_RULES.filter((r) => !r.vastu);

    return {
      total: DESIGN_RULES.length,
      vastu: {
        count: vastuRules.length,
        rules: vastuRules,
      },
      practical: {
        count: practicalRules.length,
        rules: practicalRules,
      },
    };
  }

  @Post('rules/filter')
  @ApiOperation({
    summary: 'Get filtered design rules',
    description:
      'Get design rules relevant to specific room types and Vastu preference',
  })
  @ApiResponse({
    status: 200,
    description: 'Filtered list of design rules',
  })
  getFilteredRules(
    @Body()
    body: {
      roomTypes: string[];
      vastuCompliant?: boolean;
    },
  ) {
    const rules = getRelevantRules(
      body.roomTypes,
      body.vastuCompliant !== false,
    );
    const vastuRules = rules.filter((r) => r.vastu);
    const practicalRules = rules.filter((r) => !r.vastu);

    return {
      total: rules.length,
      vastu: {
        count: vastuRules.length,
        rules: vastuRules,
      },
      practical: {
        count: practicalRules.length,
        rules: practicalRules,
      },
    };
  }
}
