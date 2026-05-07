import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PlanStatus } from '@prisma/client';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async detectStalledPlans() {
    this.logger.log('Running stall detection job...');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Update plans set status='stalled', stalledSince=NOW()
    // where status='active' AND no progress updates in last 7 days
    const activePlans = await this.prisma.plan.findMany({
      where: { status: PlanStatus.ACTIVE },
      include: {
        progressUpdates: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    for (const plan of activePlans) {
      const lastUpdate = plan.progressUpdates[0];
      if (!lastUpdate || lastUpdate.createdAt < sevenDaysAgo) {
        await this.prisma.plan.update({
          where: { id: plan.id },
          data: {
            status: PlanStatus.STALLED,
            stalledSince: new Date(),
          },
        });
        this.logger.log(`Plan ${plan.id} marked as stalled`);
      }
    }
  }
}
