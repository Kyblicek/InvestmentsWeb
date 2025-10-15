type Bucket = {
  tokens: number;
  lastRefill: number;
};

export class TokenBucket {
  private buckets = new Map<string, Bucket>();

  constructor(private capacity: number, private refillIntervalMs: number, private refillAmount: number) {}

  private getBucket(key: string) {
    const existing = this.buckets.get(key);
    if (existing) {
      this.refill(existing);
      return existing;
    }

    const bucket: Bucket = {
      tokens: this.capacity,
      lastRefill: Date.now(),
    };
    this.buckets.set(key, bucket);
    return bucket;
  }

  private refill(bucket: Bucket) {
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    if (elapsed <= 0) {
      return;
    }

    const tokensToAdd = Math.floor(elapsed / this.refillIntervalMs) * this.refillAmount;
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }

  consume(key: string) {
    const bucket = this.getBucket(key);
    if (bucket.tokens <= 0) {
      return false;
    }
    bucket.tokens -= 1;
    return true;
  }
}
