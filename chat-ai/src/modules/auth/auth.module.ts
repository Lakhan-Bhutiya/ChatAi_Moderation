import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
@Module({
    imports: [
      TypeOrmModule.forFeature([User]),
      JwtModule.register({
        secret: 'DEV_SECRET',
        signOptions: { expiresIn: '7d' },
      }),
    ],
    providers: [AuthService],
    controllers: [AuthController],
    exports: [
      JwtModule, // 🔥 REQUIRED FOR GUARDS
    ],
  })
  export class AuthModule {}
  