export interface MessageCreatedEvent {
    messageId: string;
    userId: string;
    roomId: string;
    content: string;
    createdAt: Date;
  }
  