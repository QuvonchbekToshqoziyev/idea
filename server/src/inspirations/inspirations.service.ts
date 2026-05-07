import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InspirationsService {
  constructor(private prisma: PrismaService) {}

  async findAllByCategory(categorySlug: string, limit: number = 6) {
    const category = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) throw new NotFoundException('Category not found');

    return this.prisma.inspirationItem.findMany({
      where: { categoryId: category.id },
      take: limit,
    });
  }

  async findMany(ids: string[]) {
    return this.prisma.inspirationItem.findMany({
      where: { id: { in: ids } },
    });
  }
}
