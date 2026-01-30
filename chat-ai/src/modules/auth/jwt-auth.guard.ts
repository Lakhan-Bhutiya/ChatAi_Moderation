import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  
  @Injectable()
  export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwt: JwtService) {}
  
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers['authorization'];
  
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Missing authorization header');
      }
  
      const token = authHeader.replace('Bearer ', '');
  
      try {
        const payload = this.jwt.verify(token);
        request.user = { id: payload.sub };
        return true;
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }
  }
  