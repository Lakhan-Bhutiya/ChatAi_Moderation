import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async getRoomMessages(
    roomId: string,
    limit = 50,
    before?: Date,
  ) {
    // Return approved + pending (old history). Removed messages excluded.
    const qb = this.messageRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.user', 'user')
      .where('m.roomId = :roomId', { roomId })
      .andWhere('(m.status = :approved OR m.status = :pending)', {
        approved: 'approved',
        pending: 'pending',
      })
      .orderBy('m.createdAt', 'DESC')
      .take(limit);

    if (before) {
      qb.andWhere('m.createdAt < :before', { before });
    }

    const messages = await qb.getMany();

    return messages.reverse(); // oldest → newest
  }
}
