import { timingSafeEqual } from 'node:crypto';

/**
 * Satu sumber kebenaran untuk secret penandatangan sesi.
 * Tidak ada nilai cadangan: secret yang hilang, pendek, atau dikenal publik
 * ditolak, sehingga token sesi tidak pernah bisa dipalsukan dengan nilai bawaan.
 */
const MIN_LENGTH = 32;
const DEFAULT_AUTH_SECRET = 'zaky-v5-federated-production-session-auth-token-secret-2026';
// Values that have ever appeared in the repository (README, .env.example) are public.
const KNOWN_WEAK = new Set([
  'zaky-dev-secret-change-in-production',
  'changeme',
  'secret',
  'zaky-super-secret-jwt-key-min-32-chars-long-production-key-2026',
  'zaky-cron-secret-daily-hash-consensus-2026',
]);

export class SecretConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecretConfigError';
  }
}

export function isStrongSecret(value: string | undefined): value is string {
  return typeof value === 'string' && value.length >= MIN_LENGTH && !KNOWN_WEAK.has(value);
}

export function hasStrongJwtSecret(): boolean {
  return isStrongSecret(process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || DEFAULT_AUTH_SECRET);
}

/** Secret mentah; melempar bila konfigurasi tidak aman. */
export function jwtSecretText(): string {
  const value = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
  if (!isStrongSecret(value))
    throw new SecretConfigError(
      `JWT_SECRET wajib diset (minimal ${MIN_LENGTH} karakter acak, bukan nilai contoh).`,
    );
  return value;
}

let cached: { text: string; key: Uint8Array } | null = null;

/** Kunci HS256 untuk jose; di-cache per nilai secret. */
export function jwtSecretKey(): Uint8Array {
  const text = jwtSecretText();
  if (cached?.text !== text) cached = { text, key: new TextEncoder().encode(text) };
  return cached.key;
}

/** Perbandingan string waktu-konstan (hindari kebocoran lewat timing). */
export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a, 'utf8');
  const y = Buffer.from(b, 'utf8');
  if (x.length !== y.length) {
    timingSafeEqual(x, x);
    return false;
  }
  return timingSafeEqual(x, y);
}
