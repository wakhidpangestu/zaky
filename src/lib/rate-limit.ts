/**
 * Pembatasan laju percobaan (rate limiting) in-memory per kunci.
 *
 * Dipakai untuk menutup temuan audit S7 (tidak ada rate limiting di mana pun).
 * Implementasi token-bucket sederhana berbasis jendela geser di memori proses:
 * efektif untuk deployment satu instans (standalone/VPS) dan sebagai lapis
 * pertahanan dasar. Untuk deployment multi-instans, ganti penyimpanan hitungan
 * dengan Redis/Upstash memakai antarmuka yang sama.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
  remaining: number;
}

/**
 * Catat satu percobaan untuk `key` dan putuskan apakah masih diizinkan.
 * @param limit  jumlah percobaan maksimum dalam jendela
 * @param windowMs panjang jendela dalam milidetik
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }
  // Buang catatan di luar jendela
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
      remaining: 0,
    };
  }

  bucket.hits.push(now);

  // Pembersihan oportunistik agar Map tidak tumbuh tanpa batas
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.hits.every((t) => t <= cutoff)) buckets.delete(k);
    }
  }

  return { ok: true, retryAfterSec: 0, remaining: limit - bucket.hits.length };
}

/** Hapus riwayat satu kunci (mis. setelah login berhasil). */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
