import { redis } from '../../common/redis/redis.client';
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwt: JwtService,
  ) { }

  async createGuest() {
    const user = this.userRepo.create({
      id: randomUUID(),
      username: `guest_${Math.random().toString(36).slice(2, 8)}`,
      reputationScore: 50, // Start at neutral
      tier: 'neutral' as any,
    });

    await this.userRepo.save(user);

    const token = this.jwt.sign({
      sub: user.id,
      username: user.username,
    });

    return {
      userId: user.id,
      username: user.username,
      token,
      tier: user.tier,
      reputationScore: user.reputationScore,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      userId: user.id,
      username: user.username,
      tier: user.tier,
      reputationScore: user.reputationScore,
      cleanMessageCount: user.cleanMessageCount,
      warningIssued: user.warningIssued,
    };
  }

  async signup(username: string, password: string) {
    // Check if username already exists
    const existing = await this.userRepo.findOne({
      where: { username },
    });

    if (existing) {
      throw new ConflictException('Username already taken');
    }

    // Validate username
    if (!username || username.length < 3 || username.length > 20) {
      throw new ConflictException('Username must be between 3 and 20 characters');
    }

    // Validate password
    if (!password || password.length < 6) {
      throw new ConflictException('Password must be at least 6 characters');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      id: randomUUID(),
      username,
      password: hashedPassword,
      reputationScore: 50, // Start at neutral
      tier: 'neutral' as any,
    });

    await this.userRepo.save(user);

    const token = this.jwt.sign({
      sub: user.id,
      username: user.username,
    });

    return {
      userId: user.id,
      username: user.username,
      token,
      tier: user.tier,
      reputationScore: user.reputationScore,
    };
  }

  async login(username: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user has a password (guest users don't)
    if (!user.password) {
      throw new UnauthorizedException('Please sign up first');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwt.sign({
      sub: user.id,
      username: user.username,
    });

    return {
      userId: user.id,
      username: user.username,
      token,
      tier: user.tier,
      reputationScore: user.reputationScore,
    };
  }

  async logout(token: string) {
    try {
      // Decode without verifying first to get expiration
      const decoded: any = this.jwt.decode(token);

      if (!decoded || !decoded.exp) {
        return { message: 'Already invalid' };
      }

      const timeLeft = decoded.exp - Math.floor(Date.now() / 1000);

      // Only blacklist if token is still valid
      if (timeLeft > 0) {
        await redis.set(`blacklist:${token}`, 'true', 'EX', timeLeft);
      }

      return { message: 'Logged out successfully' };
    } catch (e) {
      console.error('Logout error:', e);
      return { message: 'Logout failed' };
    }
  }
}
