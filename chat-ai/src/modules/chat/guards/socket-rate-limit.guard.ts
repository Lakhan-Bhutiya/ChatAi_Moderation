type SocketBucket = {
    count: number;
    resetAt: number;
  };
  
  export class SocketRateLimiter {
    private readonly buckets = new Map<string, SocketBucket>();
  
    private readonly LIMIT = 5;
    private readonly WINDOW_MS = 10_000;
  
    allow(userId: string): boolean {
      const now = Date.now();
      const bucket = this.buckets.get(userId);
  
      if (!bucket || bucket.resetAt < now) {
        this.buckets.set(userId, {
          count: 1,
          resetAt: now + this.WINDOW_MS,
        });
        return true;
      }
  
      if (bucket.count >= this.LIMIT) {
        return false;
      }
  
      bucket.count += 1;
      return true;
    }
  }
  