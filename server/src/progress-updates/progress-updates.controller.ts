import { Controller, Post, Body, Get, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ProgressUpdatesService } from './progress-updates.service';
import { CreateProgressUpdateDto } from './dto/create-progress-update.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('plans/:planId/updates')
@UseGuards(JwtAuthGuard)
export class ProgressUpdatesController {
  constructor(private svc: ProgressUpdatesService) {}

  @Post()
  async create(
    @Param('planId') planId: string,
    @Body() dto: CreateProgressUpdateDto,
    @Request() req: any,
  ) {
    return this.svc.create(req.user.id, planId, dto);
  }

  @Get()
  async all(@Param('planId') planId: string, @Request() req: any) {
    return this.svc.findAllForPlan(req.user.id, planId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.svc.remove(req.user.id, id);
  }
}
