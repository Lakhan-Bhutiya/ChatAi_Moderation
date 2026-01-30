import { ReputationTier } from '../enums/reputation-tier.enum';

export interface UserReputation {
  score: number;
  tier: ReputationTier;
  cleanMessageCount: number;
  warningIssued: boolean;
}
