import { Controller, Post, Body, HttpCode, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class SignupDto {
  username: string;
  password: string;
}

class LoginDto {
  username: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('guest')
  async guestLogin() {
    return this.auth.createGuest();
  }

  @Post('signup')
  @HttpCode(201)
  async signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto.username, dto.password);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.username, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: any) {
    return this.auth.getCurrentUser(req.user.id);
  }
}
