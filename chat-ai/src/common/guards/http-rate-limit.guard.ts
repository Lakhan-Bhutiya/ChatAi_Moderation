import {
    CanActivate,
    ExecutionContext,
    Injectable,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  
  type Bucket = {
    count: number;
    resetAt: number;
  };
  
  @Injectable()
  export class HttpRateLimitGuard implements CanActivate {
    private readonly buckets = new Map<string, Bucket>();
  
    private readonly LIMIT = 60;
    private readonly WINDOW_MS = 60_000;
  
    canActivate(context: ExecutionContext): boolean {
      const req = context.switchToHttp().getRequest();
      const userId = req.user?.id;
  
      if (!userId) return true; // auth guard handles unauth
  
      const now = Date.now();
      const bucket = this.buckets.get(userId);
  
      if (!bucket || bucket.resetAt < now) {
        this.buckets.set(userId, {
          count: 1,
          resetAt: now + this.WINDOW_MS,
        });
        return true;
      }
  
      if (bucket.count >= this.LIMIT) {
        throw new HttpException(
          'HTTP rate limit exceeded',
          HttpStatus.TOO_MANY_REQUESTS, // 429
        );
      }
  
      bucket.count += 1;
      return true;
    }
  }
  