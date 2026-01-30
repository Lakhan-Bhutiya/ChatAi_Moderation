import { randomInt } from 'crypto';

export function shouldSample(rate: number): boolean {
  if (rate >= 1) return true;
  if (rate <= 0) return false;

  return randomInt(0, 100) < rate * 100;
}
