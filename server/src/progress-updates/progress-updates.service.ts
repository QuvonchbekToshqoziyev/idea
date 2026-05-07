import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgressUpdateDto } from './dto/create-progress-update.dto';
import { AiService } from '../ai/ai.service';
import { UpdateType, VisibilityLevel, PlanStatus } from '@prisma/client';

@Injectable()
export class ProgressUpdatesService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  async create(userId: string, planId: string, dto: CreateProgressUpdateDto) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.userId !== userId) throw new ForbiddenException('Not your plan');

    let type: UpdateType = dto.type || UpdateType.NONE;
    let visibility: VisibilityLevel = VisibilityLevel.PUBLIC;
    let aiClassified = false;

    if (type === UpdateType.NONE) {
      const classification = await this.ai.classifyUpdate(dto.content);
      type = classification.type;
      visibility = classification.visibility;
      aiClassified = true;
    } else {
      visibility = VisibilityLevel.PUBLIC;
    }

    const update = await this.prisma.progressUpdate.create({
      data: {
        planId,
        userId,
        content: dto.content,
        type,
        visibility,
        aiClassified,
      },
    });

    // Update plan status if needed
    if (plan.status === PlanStatus.IDEA || plan.status === PlanStatus.STALLED) {
      await this.prisma.plan.update({
        where: { id: planId },
        data: { status: PlanStatus.ACTIVE },
      });
    }

    return update;
  }

  async findAllForPlan(userId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    // Access rules: owner sees all. Others (friends) see only public.
    // For now, let's just check if it's the owner.
    // TODO: Implement friend check once Friendship module is done.
    if (plan.userId === userId) {
      return this.prisma.progressUpdate.findMany({
        where: { planId },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Check if they are friends (mocked for now)
      return this.prisma.progressUpdate.findMany({
        where: { planId, visibility: VisibilityLevel.PUBLIC },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  async remove(userId: string, id: string) {
    const update = await this.prisma.progressUpdate.findUnique({
      where: { id },
    });

    if (!update) throw new NotFoundException('Update not found');
    if (update.userId !== userId) throw new ForbiddenException('Not your update');

    // Soft delete: set visibility to PRIVATE_TO_AUTHOR
    return this.prisma.progressUpdate.update({
      where: { id },
      data: { visibility: VisibilityLevel.PRIVATE_TO_AUTHOR },
    });
  }
}
