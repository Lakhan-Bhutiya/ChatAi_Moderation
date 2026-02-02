import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { User } from './user.entity';
import { moderateContent } from './moderation-engine';
import {
  REPUTATION_LIMITS,
  CLEAN_REWARD_THRESHOLD,
  PENALTY,
} from './reputation.constants';
import { calculateTier } from './reputation.util';
import { redisPub } from './pubsub';
import { AppLogger } from './logger';


export class BatchBuffer {
  private buffer: Message[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly flushIntervalMs: number,
    private readonly messageRepo: Repository<Message>,
    private readonly userRepo: Repository<User>,
  ) {}

  add(message: Message) {
    this.buffer.push(message);

    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush();
      }, this.flushIntervalMs);
    }
  }

  async flush() {
    if (this.buffer.length === 0) {
      this.timer = null;
      return;
    }

    console.log(
      `🧠 Moderation batch started (${this.buffer.length} messages)`,
    );

    const messages = [...this.buffer];
    this.buffer = [];
    this.timer = null;

    for (const msg of messages) {
      const result = await moderateContent(msg.content);

      const user = await this.userRepo.findOneBy({ id: msg.userId });
      if (!user) continue;

      // 🟢 CLEAN MESSAGE
      if (!result.flagged) {
        msg.status = 'approved';
        msg.severity = 'none';
        msg.moderatedAt = new Date();
        await this.messageRepo.save(msg);

        user.cleanMessageCount += 1;

        if (user.cleanMessageCount >= CLEAN_REWARD_THRESHOLD) {
          user.cleanMessageCount = 0;
          user.reputationScore = Math.min(
            REPUTATION_LIMITS.MAX,
            user.reputationScore + 1,
          );
        }

        user.tier = calculateTier(user.reputationScore);
        await this.userRepo.save(user);

        AppLogger.info('moderation.approved', {
            messageId: msg.id,
            userId: msg.userId,
          });

        console.log(
          `✅ Clean message | user=${user.id} score=${user.reputationScore}`,
        );

        // 🔥 Notify API via Redis
        await redisPub.publish(
          'moderation.message.approved',
          JSON.stringify({
            messageId: msg.id,
            roomId: msg.roomId,
          }),
        );

        continue;
      }

      // 🔴 FLAGGED MESSAGE
      msg.status = 'removed';
      msg.deleted = true;
      msg.severity = result.severity;
      msg.moderatedAt = new Date();
      await this.messageRepo.save(msg);

      if (result.severity === 'major') {
        user.reputationScore = Math.max(
          REPUTATION_LIMITS.MIN,
          user.reputationScore - PENALTY.MAJOR_MIN,
        );
      } else {
        user.reputationScore = Math.max(
          REPUTATION_LIMITS.MIN,
          user.reputationScore - PENALTY.MINOR,
        );
      }

      user.warningIssued = true;
      user.cleanMessageCount = 0;
      user.tier = calculateTier(user.reputationScore);
      await this.userRepo.save(user);
      AppLogger.warn('moderation.removed', {
        messageId: msg.id,
        userId: msg.userId,
        severity: result.severity,
      });
      

      console.log(
        `🗑️ Message removed [${result.severity}] | user=${user.id}`,
      );

      // 🔥 Notify API via Redis
      await redisPub.publish(
        'moderation.message.deleted',
        JSON.stringify({
          messageId: msg.id,
          roomId: msg.roomId,
          severity: result.severity,
        }),
      );
    }
  }
}
