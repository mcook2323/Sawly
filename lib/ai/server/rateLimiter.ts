export interface RateLimitResult { allowed: boolean; retryAfterSeconds: number; reason?: "window" | "daily" | "duplicate"; }
export interface RateLimiter { check(keys: string[], fingerprint: string, now?: number): RateLimitResult; }

interface Entry { times: number[]; day: string; daily: number; lastFingerprint?: string; lastAt?: number; }
export class MemoryRateLimiter implements RateLimiter {
  private entries = new Map<string, Entry>();
  constructor(private windowMs = 60_000, private maxPerWindow = 12, private dailyCap = 100, private duplicateMs = 1_500) {}
  check(keys: string[], fingerprint: string, now = Date.now()): RateLimitResult {
    const day = new Date(now).toISOString().slice(0, 10);
    for (const key of keys) {
      const entry = this.entries.get(key) ?? { times: [], day, daily: 0 };
      if (entry.day !== day) { entry.day = day; entry.daily = 0; entry.times = []; }
      entry.times = entry.times.filter((time) => now - time < this.windowMs);
      if (entry.lastFingerprint === fingerprint && entry.lastAt && now - entry.lastAt < this.duplicateMs) return { allowed: false, retryAfterSeconds: Math.ceil((this.duplicateMs - (now - entry.lastAt)) / 1000), reason: "duplicate" };
      if (entry.times.length >= this.maxPerWindow) return { allowed: false, retryAfterSeconds: Math.ceil((this.windowMs - (now - entry.times[0])) / 1000), reason: "window" };
      if (entry.daily >= this.dailyCap) return { allowed: false, retryAfterSeconds: 86_400, reason: "daily" };
    }
    for (const key of keys) { const entry = this.entries.get(key) ?? { times: [], day, daily: 0 }; entry.times.push(now); entry.daily += 1; entry.lastFingerprint = fingerprint; entry.lastAt = now; this.entries.set(key, entry); }
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
export const conversationRateLimiter: RateLimiter = new MemoryRateLimiter();
