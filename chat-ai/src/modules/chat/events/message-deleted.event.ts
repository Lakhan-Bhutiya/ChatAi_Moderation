export interface MessageDeletedEvent {
    messageId: string;
    roomId: string;
    reason: 'moderation';
    deletedAt: Date;
  }
  