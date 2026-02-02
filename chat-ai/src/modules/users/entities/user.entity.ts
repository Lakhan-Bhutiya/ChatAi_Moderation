import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReputationTier {
  TRUSTED = 'trusted',
  NEUTRAL = 'neutral',
  SUSPECT = 'suspect',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ---------- Identity ----------
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  // ---------- Reputation ----------
  @Column({ type: 'int', default: 50 })
  reputationScore: number;

  @Column({
    type: 'enum',
    enum: ReputationTier,
    default: ReputationTier.NEUTRAL,
  })
  tier: ReputationTier;

  @Column({ type: 'int', default: 0 })
  cleanMessageCount: number;

  @Column({ type: 'boolean', default: false })
  warningIssued: boolean;

  // ---------- Meta ----------
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
