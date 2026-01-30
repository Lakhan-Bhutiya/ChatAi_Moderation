import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './database/typeorm.config';
import { MessagesModule } from './modules/messages/messages.module';
import { UsersModule } from './modules/users/users.module';
import { ChatModule } from './modules/chat/chat.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { QueueModule } from './queue/queue.module';

import { ReputationModule } from './modules/reputation/reputation.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    MessagesModule,
    UsersModule,
    ChatModule,
    ModerationModule,
    ReputationModule,
    QueueModule,
    UsersModule,
  ],
})
export class AppModule {}
