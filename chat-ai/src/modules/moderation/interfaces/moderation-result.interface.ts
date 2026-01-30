export type ModerationSeverity = 'none' | 'minor' | 'major';

export interface ModerationResult {
  messageId: string;
  flagged: boolean;
  severity: ModerationSeverity;
  moderatedAt: Date;
}

