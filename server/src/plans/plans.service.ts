import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { PlanStatus, FriendshipStatus, VisibilityLevel } from '@prisma/client';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePlanDto) {
    const category = await this.prisma.category.findUnique({
      where: { slug: dto.category_slug },
    });
    if (!category) throw new NotFoundException('category not found');

    const plan = await this.prisma.plan.create({
      data: {
        userId: userId,
        categoryId: category.id,
        title: dto.title,
        description: dto.description,
        targetDate: dto.target_date ? new Date(dto.target_date) : undefined,
        planInspirations: {
          create: (dto.inspiration_ids || []).map((id: string) => ({
            inspirationId: id,
          })),
        },
      },
    });

    return plan;
  }

  async findAllForUser(
    userId: string,
    currentUserId: string,
    filters: { status?: PlanStatus; category?: string } = {},
  ) {
    const where: any = { userId };

    if (filters.status) where.status = filters.status;
    if (filters.category) {
      where.category = { slug: filters.category };
    }

    // If not owner, only see public plans (in this app, plan visibility is tied to progress updates)
    // Actually, spec says: "Get all public plans of a user. Returns private plans only if caller is the owner."
    // But our Plan model doesn't have visibility. Spec says "if any progress update is public".

    const plans = await this.prisma.plan.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: {
            progressUpdates: { where: { visibility: VisibilityLevel.PUBLIC } },
          },
        },
      },
    });

    if (userId === currentUserId) return plans;

    // Filter plans: friend of owner can see if any progress update is public.
    // Check friendship
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          {
            requesterId: currentUserId,
            addresseeId: userId,
            status: FriendshipStatus.ACCEPTED,
          },
          {
            requesterId: userId,
            addresseeId: currentUserId,
            status: FriendshipStatus.ACCEPTED,
          },
        ],
      },
    });

    if (!friendship) {
      // Not friends, only see plans that would be considered "public"
      // Let's assume for now that if they aren't friends, they see nothing or only very specific plans.
      // Spec says: "Friends see only public ones" for progress updates.
      // "Get all public plans of a user" -> we'll filter by those having public updates.
      return plans.filter((p: any) => p._count.progressUpdates > 0);
    }

    return plans;
  }

  async findOne(id: string, currentUserId: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true } },
        progressUpdates: true,
        milestones: true,
        category: true,
      },
    });

    if (!plan) throw new NotFoundException('plan not found');

    if (plan.userId === currentUserId) return plan;

    // Friend check
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          {
            requesterId: currentUserId,
            addresseeId: plan.userId,
            status: FriendshipStatus.ACCEPTED,
          },
          {
            requesterId: plan.userId,
            addresseeId: currentUserId,
            status: FriendshipStatus.ACCEPTED,
          },
        ],
      },
    });

    const hasPublicUpdates = plan.progressUpdates.some(
      (u: any) => u.visibility === VisibilityLevel.PUBLIC,
    );

    if (friendship && hasPublicUpdates) {
      // Friends see only public ones
      return {
        ...plan,
        progressUpdates: plan.progressUpdates.filter(
          (u: any) => u.visibility === VisibilityLevel.PUBLIC,
        ),
      };
    }

    throw new ForbiddenException('You do not have access to this plan');
  }

  async update(id: string, userId: string, dto: any) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.userId !== userId) throw new ForbiddenException('Not your plan');

    const data: any = { ...dto };
    if (dto.target_date) data.targetDate = new Date(dto.target_date);
    delete data.target_date;

    return this.prisma.plan.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.userId !== userId) throw new ForbiddenException('Not your plan');

    // Soft delete: set status to ARCHIVED
    return this.prisma.plan.update({
      where: { id },
      data: { status: PlanStatus.ARCHIVED },
    });
  }
}
