import { redis } from '../../../common/redis/redis.client';

export class RedisSocketRateLimiter {
  private readonly LIMIT = 5;
  private readonly WINDOW_SEC = 10;

  async allow(userId: string): Promise<boolean> {
    const key = `rate:ws:${userId}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, this.WINDOW_SEC);
    }

    return count <= this.LIMIT;
  }
}
