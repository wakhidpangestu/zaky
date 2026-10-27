import crypto from 'crypto';

/**
 * Perlindungan anti-replay untuk endpoint jaringan antarlembaga (audit S2).
 *
 * - Timestamp header WAJIB ada dan tidak boleh menyimpang lebih dari 5 menit.
 * - Nonce WAJIB ada dan hanya boleh dipakai sekali (disimpan di memori proses
 *   dengan TTL; untuk federasi multi-instans gunakan penyimpanan bersama).
 * - Bila JARINGAN_SECRET diatur, header X-Zaky-Signature WAJIB berisi
 *   HMAC-SHA256(secret, `${timestamp}.${nonce}.${rawBody}`) dalam hex dan
 *   diverifikasi dengan waktu konstan. Tanpa secret (mode demo lokal),
 *   pemeriksaan tanda tangan jaringan dilewati tetapi timestamp+nonce tetap
 *   ditegakkan.
 */

const seenNonces = new Map<string, number>();
const NONCE_TTL_MS = 10 * 60 * 1000;

export function validasiTimestamp(timestampHeader: string | null): { ok: boolean; error?: string } {
  if (!timestampHeader) {
    return { ok: false, error: 'REPLAY_DETECTED: Header X-Zaky-Timestamp wajib disertakan.' };
  }
  const requestTime = new Date(timestampHeader).getTime();
  if (Number.isNaN(requestTime)) {
    return { ok: false, error: 'REPLAY_DETECTED: Format X-Zaky-Timestamp tidak valid.' };
  }
  const selisihMenit = Math.abs(Date.now() - requestTime) / (1000 * 60);
  if (selisihMenit > 5) {
    return { ok: false, error: 'REPLAY_DETECTED: Waktu permintaan kedaluwarsa (> 5 menit).' };
  }
  return { ok: true };
}

/** Daftarkan nonce; kembalikan false bila nonce sudah pernah dipakai (replay). */
export function daftarkanNonce(nonce: string | null): { ok: boolean; error?: string } {
  if (!nonce || nonce.trim().length < 8) {
    return { ok: false, error: 'REPLAY_DETECTED: Header X-Zaky-Nonce wajib disertakan (min. 8 karakter).' };
  }
  const now = Date.now();
  // Pembersihan oportunistik nonce kedaluwarsa
  if (seenNonces.size > 1000) {
    for (const [n, exp] of seenNonces) {
      if (exp <= now) seenNonces.delete(n);
    }
  }
  const existing = seenNonces.get(nonce);
  if (existing && existing > now) {
    return { ok: false, error: 'REPLAY_DETECTED: Nonce sudah pernah digunakan.' };
  }
  seenNonces.set(nonce, now + NONCE_TTL_MS);
  return { ok: true };
}

export function verifikasiSignatureJaringan(
  signatureHeader: string | null,
  timestamp: string,
  nonce: string,
  rawBody: string
): { ok: boolean; error?: string } {
  const secret = process.env.JARINGAN_SECRET;
  if (!secret) return { ok: true }; // mode demo: tidak dikonfigurasi
  if (!signatureHeader) {
    return { ok: false, error: 'INVALID_SIGNATURE: Header X-Zaky-Signature wajib disertakan.' };
  }
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${nonce}.${rawBody}`)
    .digest();
  let given: Buffer;
  try {
    given = Buffer.from(signatureHeader.trim().toLowerCase(), 'hex');
  } catch {
    return { ok: false, error: 'INVALID_SIGNATURE: Format tanda tangan jaringan tidak valid.' };
  }
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return { ok: false, error: 'INVALID_SIGNATURE: Tanda tangan jaringan (HMAC) tidak cocok.' };
  }
  return { ok: true };
}
