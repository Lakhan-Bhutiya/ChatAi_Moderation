import 'reflect-metadata';
import { WorkerDataSource } from './db';
import { BatchBuffer } from './moderation-batch.buffer';
import { MessageCreatedSubscriber } from './message-created.subscriber';
import { Message } from './message.entity';
import { User } from './user.entity';

async function bootstrap() {
  await WorkerDataSource.initialize();

  console.log('🟥 Moderation worker started (DB enabled)');

  const messageRepo = WorkerDataSource.getRepository(Message);
  const userRepo = WorkerDataSource.getRepository(User);
  
  const buffer = new BatchBuffer(5000, messageRepo, userRepo);
  const subscriber = new MessageCreatedSubscriber(messageRepo, userRepo, buffer);

  await subscriber.start();
  
  console.log('✅ Moderation worker ready');
}

bootstrap();
