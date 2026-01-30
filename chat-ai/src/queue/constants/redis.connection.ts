import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export const createRedisConnection = (
  configService: ConfigService,
): RedisOptions => ({
  host: configService.get<string>('REDIS_HOST'),
  port: Number(configService.get<string>('REDIS_PORT')),
  maxRetriesPerRequest: null,
});
