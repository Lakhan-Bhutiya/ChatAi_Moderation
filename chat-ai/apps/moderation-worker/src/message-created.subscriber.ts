import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { User } from './user.entity';
import { BatchBuffer } from './moderation-batch.buffer';
import { shouldSample } from './sampling.util';
import { calculateTier } from './reputation.util';
import { redisPub } from './pubsub';

/**
 * Sampling rates based on user tier:
 * - trusted: 25% chance of moderation
 * - neutral: 50% chance of moderation  
 * - suspect: 100% chance of moderation
 */
const SAMPLING_RATES = {
  trusted: 0.25,  // 25%
  neutral: 0.50,  // 50%
  suspect: 1.0,   // 100%
};

export class MessageCreatedSubscriber {
  private readonly redisSub = new Redis({
    host: '127.0.0.1',
    port: 6380,
  });

  constructor(
    private readonly messageRepo: Repository<Message>,
    private readonly userRepo: Repository<User>,
    private readonly buffer: BatchBuffer,
  ) {}

  async start() {
    await this.redisSub.subscribe('moderation.message.created');

    console.log('📡 Worker subscribed to moderation.message.created');

    this.redisSub.on('message', async (_channel, payload) => {
      const { messageId } = JSON.parse(payload);

      const message = await this.messageRepo.findOneBy({
        id: messageId,
      });

      if (!message) {
        console.warn(`⚠️ Message not found: ${messageId}`);
        return;
      }

      // Load user
      const user = await this.userRepo.findOneBy({ id: message.userId });
      if (!user) {
        console.warn(`⚠️ User not found: ${message.userId}`);
        return;
      }

      // Ensure tier is calculated
      if (!user.tier) {
        user.tier = calculateTier(user.reputationScore);
        await this.userRepo.save(user);
      }

      // Get sampling rate based on tier
      const samplingRate = SAMPLING_RATES[user.tier] || SAMPLING_RATES.neutral;
      
      console.log(
        `📊 Message ${messageId} | User tier: ${user.tier} | Sampling rate: ${samplingRate * 100}%`
      );

      // Check if message should be moderated
      if (shouldSample(samplingRate)) {
        // Add to moderation buffer
        console.log(`🔍 Sampling message for moderation: ${messageId}`);
        this.buffer.add(message);
      } else {
        // Auto-approve (skip moderation)
        console.log(`✅ Auto-approving message (not sampled): ${messageId}`);
        
        message.status = 'approved';
        message.severity = 'none';
        message.moderatedAt = new Date();
        await this.messageRepo.save(message);

        // Increment clean message count and check for reward
        user.cleanMessageCount += 1;
        
        // Reward system: every 10 clean messages = +1 reputation
        if (user.cleanMessageCount >= 10) {
          user.cleanMessageCount = 0;
          user.reputationScore = Math.min(100, user.reputationScore + 1);
          user.tier = calculateTier(user.reputationScore);
          console.log(`🎉 Reward: User ${user.id} reputation +1 (now ${user.reputationScore})`);
        }
        
        await this.userRepo.save(user);

        // Notify API via Redis
        await redisPub.publish(
          'moderation.message.approved',
          JSON.stringify({
            messageId: message.id,
            roomId: message.roomId,
          }),
        );
      }
    });
  }
}
