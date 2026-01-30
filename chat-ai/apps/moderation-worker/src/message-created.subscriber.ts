import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { BatchBuffer } from './moderation-batch.buffer';

export class MessageCreatedSubscriber {
  private readonly redisSub = new Redis({
    host: '127.0.0.1',
    port: 6379,
  });

  constructor(
    private readonly messageRepo: Repository<Message>,
    private readonly buffer: BatchBuffer,
  ) {}

  async start() {
    await this.redisSub.subscribe('moderation.message.created');

    console.log('📡 Worker subscribed to moderation.message.created');

    this.redisSub.on('message', async (_channel, payload) => {
      const { messageId } = JSON.parse(payload);

      const message = await this.messageRepo.findOneBy({
        id: messageId,
      });

      if (!message) return;

      this.buffer.add(message);
    });
  }
}
