import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ModerationJob } from './interfaces/moderation-job.interface';

@Injectable()
export class ModerationQueueProducer {
  private queue: Queue;

  constructor() {
    // 🔴 HARD-CODED REDIS CONNECTION
    this.queue = new Queue('moderation-queue', {
      connection: {
        host: '127.0.0.1',
        port: 6380,
      },
    });
  }

  async enqueue(job: ModerationJob) {
    await this.queue.add('moderate-message', job);
  }
}
