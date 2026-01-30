import { Module } from '@nestjs/common';
import { ModerationQueueProducer } from './moderation.queue.producer';

@Module({
  providers: [ModerationQueueProducer],
  exports: [ModerationQueueProducer],
})
export class ModerationModule {}
