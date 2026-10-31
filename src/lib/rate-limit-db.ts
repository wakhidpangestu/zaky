import { createHash } from 'node:crypto';
import { query } from './db';
import { RateLimiter } from './rate-limit';

/**
 * Pembatas laju yang dibagi semua instans server lewat PostgreSQL (migrasi 010).
 * Bila basis data tidak dapat dihubungi, jatuh ke pembatas memori per instans
 * agar layanan tetap terlindungi minimal, bukan terbuka tanpa batas.
 */
export class SharedRateLimiter {
  private readonly fallback: RateLimiter;
  private readonly name: string;
  private readonly limit: number;
  private readonly windowSeconds: number;
  private readonly blockSeconds: number;

  constructor(name: string, limit: number, windowMs: number, blockMs: number = windowMs) {
    this.name = name;
    this.limit = limit;
    this.windowSeconds = Math.ceil(windowMs / 1000);
    this.blockSeconds = Math.ceil(blockMs / 1000);
    this.fallback = new RateLimiter(limit, windowMs, blockMs);
  }

  private digest(key: string): Buffer {
    return createHash('sha256').update(this.name + ':' + key).digest();
  }

  /** Catat satu percobaan; mengembalikan detik penguncian bila batas terlampaui. */
  async hit(key: string): Promise<number> {
    try {
      const { rows } = await query<{ tunggu: number }>('SELECT rate_limit_hit($1,$2,$3,$4) AS tunggu', [
        this.digest(key),
        this.limit,
        this.windowSeconds,
        this.blockSeconds,
      ]);
      return rows[0].tunggu;
    } catch (error) {
      warnFallback(error);
      return this.fallback.hit(key);
    }
  }

  /** Sisa detik penguncian, atau 0 bila boleh lanjut. */
  async retryAfter(key: string): Promise<number> {
    try {
      const { rows } = await query<{ tunggu: number }>('SELECT rate_limit_sisa($1) AS tunggu', [this.digest(key)]);
      return rows[0].tunggu;
    } catch (error) {
      warnFallback(error);
      return this.fallback.retryAfter(key);
    }
  }

  async reset(key: string): Promise<void> {
    this.fallback.reset(key);
    try {
      await query('SELECT rate_limit_reset($1)', [this.digest(key)]);
    } catch (error) {
      warnFallback(error);
    }
  }
}

let warned = false;
function warnFallback(error: unknown) {
  if (warned) return;
  warned = true;
  console.warn(
    '[zaky] Pembatas laju bersama tidak tersedia (migrasi 010?); memakai pembatas memori per instans.',
    error instanceof Error ? error.message : error,
  );
}
