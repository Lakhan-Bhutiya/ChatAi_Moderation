import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export type UserTier = 'trusted' | 'neutral' | 'suspect';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reputationScore: number;

  @Column({ type: 'enum', enum: ['trusted', 'neutral', 'suspect'] })
  tier: UserTier;

  @Column()
  cleanMessageCount: number;

  @Column()
  warningIssued: boolean;
}
