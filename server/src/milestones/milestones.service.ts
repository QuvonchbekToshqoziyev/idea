import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MilestonesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, planId: string, title: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.userId !== userId) throw new ForbiddenException('Not your plan');

    return this.prisma.milestone.create({
      data: { planId, title },
    });
  }

  async update(
    userId: string,
    id: string,
    data: { title?: string; completed?: boolean },
  ) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.plan.userId !== userId)
      throw new ForbiddenException('Not your plan');

    const updateData: any = { ...data };
    if (data.completed === true && !milestone.completed) {
      updateData.completedAt = new Date();
    } else if (data.completed === false) {
      updateData.completedAt = null;
    }

    return this.prisma.milestone.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(userId: string, id: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!milestone) throw new NotFoundException('Milestone not found');
    if (milestone.plan.userId !== userId)
      throw new ForbiddenException('Not your plan');

    return this.prisma.milestone.delete({ where: { id } });
  }
}
