import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../messages/entities/message.entity';
import { redisPub } from '../../../common/redis/redis.client';
import { UsersService } from '../../users/users.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly usersService: UsersService,
  ) { }

  private async checkSpam(userId: string, content: string): Promise<boolean> {
    const rateKey = `spam:rate:${userId}`;
    const lastMsgKey = `spam:lastMsg:${userId}`;

    // 1. Duplicate Message Check
    const lastMsg = await redisPub.get(lastMsgKey);
    if (lastMsg === content) {
      await this.punishUser(userId, 'spam_duplicate');
      return true;
    }
    await redisPub.set(lastMsgKey, content, 'EX', 30); // Remember last msg for 30s

    // 2. Rate Limit (5 msgs / 10s)
    const count = await redisPub.incr(rateKey);
    if (count === 1) {
      await redisPub.expire(rateKey, 10);
    }

    if (count > 5) {
      await this.punishUser(userId, 'spam_rate');
      return true;
    }

    return false;
  }

  private async punishUser(userId: string, reason: string) {
    console.log(`🚨 Punishing user ${userId} for ${reason}`);
    // Mute for 60 seconds
    await this.usersService.muteUser(userId, 60);

    // 🧹 Wipe the Redis "memory" so the counter starts from 0 after the mute expires
    const rateKey = `spam:rate:${userId}`;
    const lastMsgKey = `spam:lastMsg:${userId}`;
    await redisPub.del(rateKey, lastMsgKey);
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwt.verify(token);

      // 🔒 Check Blacklist
      const isBlacklisted = await redisPub.get(`blacklist:${token}`);
      if (isBlacklisted) {
        console.log('🔴 Connection rejected: Token is blacklisted');
        client.disconnect();
        return;
      }

      client.data.userId = payload.sub;
      console.log('🟢 socket connected user=', payload.sub);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.roomId);
    console.log('👥 joined room', data.roomId);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() payload: { roomId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('🔥 sendMessage called', payload);

    const userId = client.data.userId;
    if (!userId) return;

    // 0️⃣ Check if muted
    const isMuted = await this.usersService.isMuted(userId);
    if (isMuted) {
      client.emit('error', { message: 'You are muted for spamming.' });
      return;
    }

    // 🛡️ Anti-Spam Check
    const isSpam = await this.checkSpam(userId, payload.content);
    if (isSpam) {
      client.emit('error', { message: 'You are muted for spamming.' });
      return;
    }

    // 1️⃣ save message as pending
    const message = this.messageRepo.create({
      userId,
      roomId: payload.roomId,
      content: payload.content,
    });

    const saved = await this.messageRepo.save(message);

    // Load user relation for the message
    const messageWithUser = await this.messageRepo.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });

    // 2️⃣ emit immediately (pending)
    this.server.to(payload.roomId).emit('newMessage', messageWithUser);

    // 3️⃣ publish to redis for moderation
    console.log('📡 publishing to redis', saved.id);

    await redisPub.publish(
      'moderation.message.created',
      JSON.stringify({
        messageId: saved.id,
        userId,
        roomId: payload.roomId,
        content: payload.content,
      }),
    );

  }
  broadcastRemoval(event: any) {
    this.server.to(event.roomId).emit('messageRemoved', event);
  }

  broadcastApproval(messageId: string, roomId: string) {
    this.server.to(roomId).emit('messageApproved', { messageId });
  }

}
