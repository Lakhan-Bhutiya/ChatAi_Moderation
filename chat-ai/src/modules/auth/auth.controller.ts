import { Controller, Post, Body, HttpCode, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SignupDto, LoginDto } from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) { }

  @Post('guest')
  @ApiOperation({ summary: 'Login as a Guest', description: 'Creates a temporary account with no password. Good for quick testing.' })
  @ApiResponse({ status: 201, description: 'Guest session created successfully.' })
  async guestLogin() {
    return this.auth.createGuest();
  }

  @Post('signup')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new account', description: 'Creates a permanent account with a password.' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 409, description: 'Username already taken.' })
  async signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto.username, dto.password);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login', description: 'Exchange username/password for a JWT token.' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.username, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Profile', description: 'Returns details about the currently logged-in user.' })
  @ApiResponse({ status: 200, description: 'User profile returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized / Token expired.' })
  async getCurrentUser(@Req() req: any) {
    return this.auth.getCurrentUser(req.user.id);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout', description: 'Blacklists the current token so it cannot be used again.' })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  async logout(@Req() req: any) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      return this.auth.logout(token);
    }
    return { message: 'No token provided' };
  }
}
