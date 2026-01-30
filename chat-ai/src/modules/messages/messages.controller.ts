import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HttpRateLimitGuard } from 'src/common/guards/http-rate-limit.guard';
import { RedisHttpRateLimitGuard } from 'src/common/guards/redis-http-rate-limit.guard';
@UseGuards(JwtAuthGuard, HttpRateLimitGuard,RedisHttpRateLimitGuard)
@Controller('messages')
@UseGuards(JwtAuthGuard) // 🔒 PROTECTED
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
  ) {}

  @Get()
  async getRoomMessages(
    @Req() req: any,
    @Query('roomId') roomId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    // req.user.id is now trusted
    return this.messagesService.getRoomMessages(
      roomId,
      limit ? Number(limit) : 50,
      before ? new Date(before) : undefined,
    );
  }
}
