import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { ChatGateway } from '../../modules/chat/gateway/chat.gateway';

@Injectable()
export class MessageDeletedSubscriber implements OnModuleInit {
  private readonly redisSub = new Redis({
    host: '127.0.0.1',
    port: 6380,
  });

  constructor(private readonly chatGateway: ChatGateway) {}

  onModuleInit() {
    this.redisSub.subscribe('moderation.message.deleted');
    this.redisSub.subscribe('moderation.message.approved');

    this.redisSub.on('message', (_channel, payload) => {
      const event = JSON.parse(payload);

      if (_channel === 'moderation.message.deleted') {
        this.chatGateway.broadcastRemoval(event);
      }

      if (_channel === 'moderation.message.approved') {
        this.chatGateway.broadcastApproval(
          event.messageId,
          event.roomId,
        );
      }
    });
  }
}
