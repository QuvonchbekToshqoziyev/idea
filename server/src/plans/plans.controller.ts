import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlanStatus } from '@prisma/client';

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private svc: PlansService) {}

  @Post()
  async create(@Body() dto: CreatePlanDto, @Request() req: any) {
    return this.svc.create(req.user.id, dto);
  }

  @Get()
  async all(
    @Request() req: any,
    @Query('status') status?: PlanStatus,
    @Query('category') category?: string,
  ) {
    return this.svc.findAllForUser(req.user.id, req.user.id, {
      status,
      category,
    });
  }

  @Get(':id')
  async one(@Param('id') id: string, @Request() req: any) {
    return this.svc.findOne(id, req.user.id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    return this.svc.update(id, req.user.id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.svc.remove(id, req.user.id);
  }
}
