import { Controller, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private svc: SessionsService) {}

  @Post()
  async create(@Body() dto: CreateSessionDto, @Request() req: any) {
    return this.svc.create(req.user.id, dto);
  }

  @Patch(':id/convert')
  async convert(
    @Param('id') id: string,
    @Body('plan_id') planId: string,
    @Request() req: any,
  ) {
    return this.svc.convert(req.user.id, id, planId);
  }

  @Patch(':id/end')
  async end(@Param('id') id: string, @Request() req: any) {
    return this.svc.end(req.user.id, id);
  }
}
