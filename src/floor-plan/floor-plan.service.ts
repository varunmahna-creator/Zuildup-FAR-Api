import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import {
  GenerateFloorPlanDto,
  FloorPlanResponseDto,
} from './dto/generate-floor-plan.dto';
import { getRelevantRules, getRulesText } from './design-rules';

@Injectable()
export class FloorPlanService {
  private readonly logger = new Logger(FloorPlanService.name);
  private _anthropic: Anthropic | null = null;

  private get anthropic(): Anthropic {
    if (!this._anthropic) {
      this._anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || 'dummy',
        baseURL: process.env.ANTHROPIC_BASE_URL || 'http://127.0.0.1:18801',
      });
    }
    return this._anthropic;
  }

  async generateFloorPlan(
    dto: GenerateFloorPlanDto,
  ): Promise<FloorPlanResponseDto> {
    const plotArea = dto.plotLength * dto.plotWidth;
    const floorLabel =
      dto.floors === 1
        ? 'Ground only'
        : dto.floors === 2
          ? 'G+1'
          : dto.floors === 3
            ? 'G+2'
            : 'G+3';

    // Determine relevant rooms for rules
    const roomTypes = [
      'bedroom',
      'kitchen',
      'living',
      'dining',
      'utility',
      ...(dto.additionalRooms || []),
    ];
    if (dto.floors > 1) roomTypes.push('staircase');
    if (dto.wantLift) roomTypes.push('lift');
    if (dto.wantStilt) roomTypes.push('parking');

    // Get relevant design rules
    const rules = getRelevantRules(roomTypes, dto.vastuCompliant);
    const rulesText = getRulesText(rules);

    // Build system prompt
    const systemPrompt = `You are ZuildUp AI, an expert Indian home architect specializing in:
- Vastu Shastra compliant designs (when requested)
- Indian residential architecture for Delhi NCR region
- Space-efficient floor plans for various plot sizes
- Modern, traditional, and contemporary Indian home styles

You help users design their dream homes by providing detailed floor plan suggestions, room layouts, and Vastu guidance. Always respond in a helpful, professional manner.

When suggesting floor plans, always include:
1. Room-by-room placement with approximate dimensions in feet
2. Vastu compliance details (if required)
3. Practical considerations for Indian climate and lifestyle
4. Clear directional orientation based on the facing direction

IMPORTANT: Focus on practical, buildable designs that work within Delhi NCR building regulations.`;

    // Build user prompt
    const additionalRoomsList =
      dto.additionalRooms && dto.additionalRooms.length > 0
        ? dto.additionalRooms.join(', ')
        : 'None specified';

    const userPrompt = `Generate a detailed floor plan for an Indian home with the following specifications:

PLOT DETAILS:
- Plot Size: ${dto.plotLength} feet × ${dto.plotWidth} feet (${plotArea} sq.ft)
- Facing Direction: ${dto.facing.toUpperCase()} facing
- Number of Floors: ${floorLabel}
${dto.city ? `- City: ${dto.city.charAt(0).toUpperCase() + dto.city.slice(1)} (Delhi NCR)` : ''}

ROOM REQUIREMENTS:
- Bedrooms: ${dto.bedrooms}
- Bathrooms: ${dto.bathrooms}
- Kitchen Type: ${dto.kitchenType || 'modular'}
- Additional Rooms: ${additionalRoomsList}
${dto.wantStilt ? '- Stilt Parking: Yes' : ''}
${dto.wantBasement ? '- Basement: Yes' : ''}
${dto.wantLift ? '- Lift: Yes' : ''}

STYLE PREFERENCES:
- Architecture Style: ${dto.style || 'modern'}
- Vastu Compliance: ${dto.vastuCompliant ? 'Required (strictly follow Vastu Shastra)' : 'Not required'}

${rulesText ? `\nDESIGN RULES TO FOLLOW:\n${rulesText}` : ''}

Please provide:
1. **Floor-wise Layout**: Detailed room placement for each floor with approximate dimensions
2. **Room Descriptions**: Purpose and recommended size for each room
3. **Vastu Analysis**: How the design follows Vastu principles (if required)
4. **Rules Compliance**: List which design rules are followed and any potential conflicts
5. **Special Features**: Recommendations based on plot orientation and style
6. **Built-up Area**: Estimated total built-up area

Format your response clearly with sections and bullet points for easy reading.`;

    try {
      // Call Claude API
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        system: systemPrompt,
      });

      const aiResponse =
        message.content[0].type === 'text'
          ? message.content[0].text
          : 'No response generated';

      // Build image prompt for potential DALL-E generation
      const imagePrompt = this.buildImagePrompt(dto, plotArea);

      return {
        success: true,
        description: aiResponse,
        imagePrompt,
        rulesApplied: rules.map((r) => r.text),
        plotSummary: {
          area: plotArea,
          length: dto.plotLength,
          width: dto.plotWidth,
          facing: dto.facing,
          floors: floorLabel,
          bhk: dto.bedrooms,
        },
      };
    } catch (error) {
      this.logger.error('Floor plan generation failed', error);
      return {
        success: false,
        description: '',
        rulesApplied: rules.map((r) => r.text),
        plotSummary: {
          area: plotArea,
          length: dto.plotLength,
          width: dto.plotWidth,
          facing: dto.facing,
          floors: floorLabel,
          bhk: dto.bedrooms,
        },
        error: error.message || 'Failed to generate floor plan',
      };
    }
  }

  private buildImagePrompt(dto: GenerateFloorPlanDto, plotArea: number): string {
    const additionalRooms =
      dto.additionalRooms && dto.additionalRooms.length > 0
        ? `, ${dto.additionalRooms.join(', ')}`
        : '';

    return `Professional 2D architectural floor plan, top-down view, Indian house design, ${dto.plotLength}x${dto.plotWidth} feet plot, ${dto.facing} facing, ${dto.bedrooms} bedrooms, ${dto.bathrooms} bathrooms, ${dto.kitchenType || 'modular'} kitchen${additionalRooms}. Style: Clean architectural blueprint with labeled rooms, dimensions marked in feet, furniture layout shown, warm beige/cream color scheme, professional rendering like real estate floor plans. Include: room labels with dimensions, door swings, window placements, furniture outlines, compass showing north direction. Title at top showing "${dto.plotLength}'x${dto.plotWidth}' ${dto.facing.toUpperCase()} Facing ${dto.bedrooms}BHK".`;
  }
}
