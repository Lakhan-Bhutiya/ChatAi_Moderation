import { Module } from '@nestjs/common';
import { MessageDeletedSubscriber } from './subscribers/message-deleted.subscriber';
import { ChatModule } from '../modules/chat/chat.module';

@Module({
  imports: [ChatModule],
  providers: [MessageDeletedSubscriber],
})
export class QueueModule {}
