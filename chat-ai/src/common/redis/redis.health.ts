import { redis } from './redis.client';

export async function checkRedisHealth() {
  try {
    await redis.ping();
    return { redis: 'up' };
  } catch {
    return { redis: 'down' };
  }
}
