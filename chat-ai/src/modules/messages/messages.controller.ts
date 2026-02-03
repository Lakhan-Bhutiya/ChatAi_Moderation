import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HttpRateLimitGuard } from 'src/common/guards/http-rate-limit.guard';
import { RedisHttpRateLimitGuard } from 'src/common/guards/redis-http-rate-limit.guard';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard, HttpRateLimitGuard, RedisHttpRateLimitGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get Room Messages', description: 'Fetches message history for a specific room. Supports pagination.' })
  @ApiQuery({ name: 'roomId', example: 'general', description: 'The ID of the room to fetch messages from.' })
  @ApiQuery({ name: 'limit', required: false, example: 50, description: 'Number of messages to return (Max 100).' })
  @ApiQuery({ name: 'before', required: false, description: 'Timestamp to fetch messages before (for endless scrolling).' })
  @ApiResponse({ status: 200, description: 'List of messages returned.' })
  @ApiResponse({ status: 429, description: 'Too many requests.' })
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
