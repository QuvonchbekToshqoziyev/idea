import { Injectable } from '@nestjs/common';
import { UpdateType, VisibilityLevel } from '@prisma/client';

@Injectable()
export class AiService {
  async classifyUpdate(
    content: string,
  ): Promise<{ type: UpdateType; visibility: VisibilityLevel }> {
    // Mocking AI classification
    // In a real app, this would call an LLM
    console.log(`AI Classifying: ${content}`);

    // Simple heuristic for demo
    if (content.toLowerCase().includes('?')) {
      return { type: UpdateType.QUESTION, visibility: VisibilityLevel.PUBLIC };
    }

    return { type: UpdateType.TECHNICAL, visibility: VisibilityLevel.PUBLIC };
  }

  async summarizePlan(): Promise<string> {
    return 'This is a mock summary of the plan updates.';
  }

  async detectStall(): Promise<boolean> {
    return false;
  }
}
