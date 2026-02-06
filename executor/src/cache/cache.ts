interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class ExpiringCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttlMs: number;

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

const ONE_HOUR_MS = 60 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

// Cache all the strategies count for any vault (expires after 1 hour)
export const strategyCountCache = new ExpiringCache<number>(ONE_HOUR_MS);

// Cache the strategyId for a vault that is recently executed (expires after 30 minutes)
export const strategyIdCache = new ExpiringCache<string>(THIRTY_MINUTES_MS);

// Cache the strategyId for a vault that is recently executed (expires after 30 minutes)
export const strategyCanExecCache = new ExpiringCache<string>(THIRTY_MINUTES_MS);