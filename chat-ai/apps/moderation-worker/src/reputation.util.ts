export type Tier = 'trusted' | 'neutral' | 'suspect';

/**
 * Pure business logic.
 * No entity imports.
 * Safe for worker.
 */
export function calculateTier(score: number): Tier {
  if (score >= 80) return 'trusted';
  if (score >= 40) return 'neutral';
  return 'suspect';
}
