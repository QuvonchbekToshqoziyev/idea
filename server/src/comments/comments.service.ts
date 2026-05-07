import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AiService } from '../ai/ai.service';
import { UpdateType, VisibilityLevel, FriendshipStatus } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  async create(userId: string, planId: string, dto: CreateCommentDto) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    // Check if friend
    if (plan.userId !== userId) {
      const friendship = await this.prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: userId, addresseeId: plan.userId, status: FriendshipStatus.ACCEPTED },
            { requesterId: plan.userId, addresseeId: userId, status: FriendshipStatus.ACCEPTED },
          ],
        },
      });

      if (!friendship) {
        throw new ForbiddenException('You must be a friend to comment on this plan');
      }
    }

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

    return this.prisma.comment.create({
      data: {
        planId,
        userId,
        content: dto.content,
        type,
        visibility,
        aiClassified,
      },
    });
  }

  async findAllForPlan(userId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    if (plan.userId === userId) {
      return this.prisma.comment.findMany({
        where: { planId },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      return this.prisma.comment.findMany({
        where: { planId, visibility: VisibilityLevel.PUBLIC },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  async remove(userId: string, id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    // Owner of comment or plan owner can suppress
    if (comment.userId !== userId && comment.plan.userId !== userId) {
      throw new ForbiddenException('Not authorized to suppress this comment');
    }

    return this.prisma.comment.update({
      where: { id },
      data: { visibility: VisibilityLevel.PRIVATE_TO_AUTHOR },
    });
  }
}
