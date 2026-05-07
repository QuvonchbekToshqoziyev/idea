import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { InspirationsService } from '../inspirations/inspirations.service';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private inspirations: InspirationsService,
  ) {}

  async create(userId: string, dto: CreateSessionDto) {
    let categoryId: number | undefined;
    if (dto.category_slug) {
      const category = await this.prisma.category.findUnique({
        where: { slug: dto.category_slug },
      });
      if (!category) throw new NotFoundException('Category not found');
      categoryId = category.id;
    }

    const session = await this.prisma.session.create({
      data: {
        userId,
        intent: dto.intent,
        categoryId,
      },
    });

    let inspirationItems: any[] = [];
    if (dto.category_slug) {
      inspirationItems = await this.inspirations.findAllByCategory(
        dto.category_slug,
      );

      // Link inspirations to session
      for (const item of inspirationItems) {
        await this.prisma.sessionInspiration.create({
          data: {
            sessionId: session.id,
            inspirationId: item.id,
          },
        });
      }
    }

    return { session, inspirations: inspirationItems };
  }

  async convert(userId: string, id: string, planId: string) {
    const session = await this.prisma.session.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId)
      throw new ForbiddenException('Not your session');

    return this.prisma.session.update({
      where: { id },
      data: {
        converted: true,
        convertedPlanId: planId,
        endedAt: new Date(),
      },
    });
  }

  async end(userId: string, id: string) {
    const session = await this.prisma.session.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId)
      throw new ForbiddenException('Not your session');

    return this.prisma.session.update({
      where: { id },
      data: { endedAt: new Date() },
    });
  }
}
