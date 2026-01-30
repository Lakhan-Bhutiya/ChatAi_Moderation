import 'reflect-metadata';
import { redisSub } from './redis.client';
import { WorkerDataSource } from './data-source';
import { BatchBuffer } from './moderation-batch.buffer';

async function bootstrap() {
  await WorkerDataSource.initialize();

  console.log('🟥 Moderation worker started (DB enabled)');

  const buffer = new BatchBuffer(5000, WorkerDataSource);

  redisSub.subscribe('moderation.queue');

  redisSub.on('message', (_channel, payload) => {
    const msg = JSON.parse(payload);
    buffer.add(msg);
  });
}

bootstrap();
