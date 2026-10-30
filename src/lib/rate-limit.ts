/**
 * Pembatas laju sliding-window di memori proses.
 * Cukup untuk satu instans server (mode lomba/self-host). Untuk deployment
 * multi-instans, ganti penyimpanan Map ini dengan Redis/Postgres.
 */
interface Bucket {
  hits: number[];
  blockedUntil: number;
}

const MAX_KEYS = 10_000;

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly blockMs: number;

  constructor(limit: number, windowMs: number, blockMs: number = windowMs) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.blockMs = blockMs;
  }

  private bucket(key: string, now: number): Bucket {
    let b = this.buckets.get(key);
    if (!b) {
      if (this.buckets.size >= MAX_KEYS) this.sweep(now);
      b = { hits: [], blockedUntil: 0 };
      this.buckets.set(key, b);
    }
    b.hits = b.hits.filter((t) => now - t < this.windowMs);
    return b;
  }

  /** Sisa detik penguncian, atau 0 bila boleh lanjut. */
  retryAfter(key: string, now = Date.now()): number {
    const b = this.bucket(key, now);
    return b.blockedUntil > now ? Math.ceil((b.blockedUntil - now) / 1000) : 0;
  }

  /** Catat satu percobaan; mengembalikan detik penguncian bila batas terlampaui. */
  hit(key: string, now = Date.now()): number {
    const b = this.bucket(key, now);
    if (b.blockedUntil > now) return Math.ceil((b.blockedUntil - now) / 1000);
    b.hits.push(now);
    if (b.hits.length > this.limit) {
      b.blockedUntil = now + this.blockMs;
      return Math.ceil(this.blockMs / 1000);
    }
    return 0;
  }

  reset(key: string) {
    this.buckets.delete(key);
  }

  private sweep(now: number) {
    for (const [key, b] of this.buckets)
      if (b.blockedUntil <= now && b.hits.every((t) => now - t >= this.windowMs)) this.buckets.delete(key);
    if (this.buckets.size >= MAX_KEYS) this.buckets.clear();
  }
}

/** IP klien dari header proxy tepercaya; jatuh ke 'unknown'. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown';
}
