import Redis from 'ioredis';

/**
 * Shared Redis client (commands)
 */
export const redis = new Redis({
  host: '127.0.0.1',
  port: 6380,
});

/**
 * Redis subscriber (pub/sub)
 */
export const redisSub = new Redis({
  host: '127.0.0.1',
  port: 6380,
});
export const redisPub = new Redis({
  host: '127.0.0.1',
  port: 6380,
});