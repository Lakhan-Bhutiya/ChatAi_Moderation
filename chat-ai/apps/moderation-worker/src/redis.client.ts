import Redis from 'ioredis';

export const redis = new Redis({
  host: '127.0.0.1',
  port: 6380,
});

export const redisSub = new Redis({
  host: '127.0.0.1',
  port: 6380,
});
