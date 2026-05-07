import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private svc: UsersService) {}

  @Get('friends')
  async getFriends(@Request() req: any) {
    return this.svc.findFriends(req.user.id);
  }

  @Post('friends/request')
  async requestFriend(@Body('addressee_id') addresseeId: string, @Request() req: any) {
    return this.svc.sendFriendRequest(req.user.id, addresseeId);
  }

  @Patch('friends/:id/accept')
  async acceptFriend(@Param('id') id: string, @Request() req: any) {
    return this.svc.acceptFriendRequest(req.user.id, id);
  }

  @Delete('friends/:id')
  async removeFriend(@Param('id') id: string, @Request() req: any) {
    return this.svc.removeFriendship(req.user.id, id);
  }

  @Get(':id')
  async getProfile(@Param('id') id: string) {
    return this.svc.findOne(id);
  }
}
