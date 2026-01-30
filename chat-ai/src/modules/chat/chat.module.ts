import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../messages/entities/message.entity';
import { ChatGateway } from './gateway/chat.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    AuthModule, // 🔥 THIS FIXES IT
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
