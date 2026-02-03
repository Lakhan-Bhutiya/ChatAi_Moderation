import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../messages/entities/message.entity';
import { ChatGateway } from './gateway/chat.gateway';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    AuthModule,
    UsersModule,
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule { }
