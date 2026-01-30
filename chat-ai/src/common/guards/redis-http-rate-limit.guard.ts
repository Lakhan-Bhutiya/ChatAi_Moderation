import {
    CanActivate,
    ExecutionContext,
    Injectable,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { redis } from '../redis/redis.client';
  
  @Injectable()
  export class RedisHttpRateLimitGuard implements CanActivate {
    private readonly LIMIT = 60;
    private readonly WINDOW_SEC = 60;
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest();
      const userId = req.user?.id;
  
      if (!userId) return true;
  
      const key = `rate:http:${userId}`;
      const count = await redis.incr(key);
  
      if (count === 1) {
        await redis.expire(key, this.WINDOW_SEC);
      }
  
      if (count > this.LIMIT) {
        throw new HttpException(
          'HTTP rate limit exceeded',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
  
      return true;
    }
  }
  