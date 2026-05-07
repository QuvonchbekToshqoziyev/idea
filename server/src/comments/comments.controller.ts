import { Controller, Post, Body, Get, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('plans/:planId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private svc: CommentsService) {}

  @Post()
  async create(
    @Param('planId') planId: string,
    @Body() dto: CreateCommentDto,
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
