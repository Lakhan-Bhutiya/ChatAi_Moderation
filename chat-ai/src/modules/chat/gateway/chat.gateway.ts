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
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwt.verify(token);
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
