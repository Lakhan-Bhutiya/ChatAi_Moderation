
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    async muteUser(userId: string, durationSeconds: number) {
        const mutedUntil = new Date(Date.now() + durationSeconds * 1000);
        await this.userRepo.update(userId, { mutedUntil });
    }

    async isMuted(userId: string): Promise<boolean> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user || !user.mutedUntil) return false;

        return user.mutedUntil > new Date();
    }
}
