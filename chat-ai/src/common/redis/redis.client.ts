import Redis from 'ioredis';

/**
 * Shared Redis client (commands)
 */
export const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
});

/**
 * Redis subscriber (pub/sub)
 */
export const redisSub = new Redis({
  host: '127.0.0.1',
  port: 6379,
});
export const redisPub = new Redis({
  host: '127.0.0.1',
  port: 6379,
});