import Redis from 'ioredis';

export const redisPub = new Redis({
  host: '127.0.0.1',
  port: 6380,
});
