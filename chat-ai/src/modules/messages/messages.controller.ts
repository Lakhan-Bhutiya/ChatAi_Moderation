import { Controller, Get, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HttpRateLimitGuard } from 'src/common/guards/http-rate-limit.guard';
import { RedisHttpRateLimitGuard } from 'src/common/guards/redis-http-rate-limit.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard, HttpRateLimitGuard, RedisHttpRateLimitGuard)
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
    if (!roomId || typeof roomId !== 'string' || !roomId.trim()) {
      throw new BadRequestException('roomId is required');
    }
    return this.messagesService.getRoomMessages(
      roomId.trim(),
      limit ? Number(limit) : 50,
      before ? new Date(before) : undefined,
    );
  }
}
