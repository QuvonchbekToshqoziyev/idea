import { Controller, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('plans/:planId/milestones')
@UseGuards(JwtAuthGuard)
export class MilestonesController {
  constructor(private svc: MilestonesService) {}

  @Post()
  async create(@Param('planId') planId: string, @Body('title') title: string, @Request() req: any) {
    return this.svc.create(req.user.id, planId, title);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: { title?: string; completed?: boolean },
    @Request() req: any,
  ) {
    return this.svc.update(req.user.id, id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.svc.remove(req.user.id, id);
  }
}
