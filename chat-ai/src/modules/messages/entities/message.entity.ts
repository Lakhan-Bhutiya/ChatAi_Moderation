import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type MessageStatus = 'pending' | 'approved' | 'removed';
export type ModerationSeverity = 'none' | 'minor' | 'major';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column()
  roomId: string;

  @Column({ type: 'text' })
  content: string;

  // 🔥 NEW — lifecycle
  @Index()
  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'removed'],
    default: 'pending',
  })
  status: MessageStatus;

  @Column({ type: 'boolean', default: false })
  deleted: boolean;

  @Column({
    type: 'enum',
    enum: ['none', 'minor', 'major'],
    default: 'none',
  })
  severity: ModerationSeverity;

  @Column({ type: 'timestamp', nullable: true })
  moderatedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
