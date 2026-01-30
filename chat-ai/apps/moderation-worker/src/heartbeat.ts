import { AppLogger } from './logger';

export function startHeartbeat() {
  setInterval(() => {
    AppLogger.info('worker.heartbeat', {
      service: 'moderation-worker',
    });
  }, 10_000);
}
