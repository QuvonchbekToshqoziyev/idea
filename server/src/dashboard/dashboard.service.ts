import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanStatus, FriendshipStatus, VisibilityLevel } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const plans: any[] = await this.prisma.plan.findMany({
      where: { userId },
    });

    const active_plans = plans.filter((p: any) => p.status === PlanStatus.ACTIVE);
    const stalled_plans = plans.filter((p: any) => p.status === PlanStatus.STALLED);
    const completed_plans = plans.filter((p: any) => p.status === PlanStatus.COMPLETED);

    // Get friend updates
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: FriendshipStatus.ACCEPTED },
          { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
        ],
      },
    });

    const friendIds = friendships.map((f: any) => (f.requesterId === userId ? f.addresseeId : f.requesterId));

    const recent_friend_updates = await this.prisma.progressUpdate.findMany({
      where: {
        userId: { in: friendIds },
        visibility: VisibilityLevel.PUBLIC,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        plan: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return {
      active_plans,
      stalled_plans,
      completed_plans,
      recent_friend_updates,
      metrics: {
        total_plans: plans.length,
        completed: completed_plans.length,
        active: active_plans.length,
        stalled: stalled_plans.length,
      },
    };
  }
}
