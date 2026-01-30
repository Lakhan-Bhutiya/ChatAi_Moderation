import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
  } from 'typeorm';
  
  export type MessageStatus = 'pending' | 'approved' | 'removed';
  export type ModerationSeverity = 'none' | 'minor' | 'major';
  
  @Entity('messages')
  export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Index()
    @Column()
    userId: string;
  
    @Index()
    @Column()
    roomId: string;
  
    @Column({ type: 'text' })
    content: string;
  
    // 🔥 lifecycle
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
  