import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async createGuest() {
    const user = this.userRepo.create({
      id: randomUUID(),
      username: `guest_${Math.random().toString(36).slice(2, 8)}`,
    });

    await this.userRepo.save(user);

    const token = this.jwt.sign({
      sub: user.id,
    });

    return {
      userId: user.id,
      token,
    };
  }
}
