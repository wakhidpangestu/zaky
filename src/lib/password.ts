/**
 * Hashing kata sandi menggunakan PBKDF2 (Web Crypto API).
 * Catatan: Untuk produksi, gunakan Argon2id. PBKDF2 dipakai
 * pada versi lomba karena tidak memerlukan binding native.
 *
 * Perbaikan audit R1:
 * - Iterasi hash baru 600.000 (rekomendasi OWASP untuk PBKDF2-HMAC-SHA256).
 * - Verifikasi memvalidasi format tersimpan secara ketat; format rusak
 *   menghasilkan `false`, bukan exception.
 * - Perbandingan hasil hash memakai waktu konstan (constant-time).
 * - Tidak ada lagi jalur pintas kata sandi khusus di fungsi ini.
 */

const NEW_HASH_ITERATIONS = 600000;
const MAX_VERIFY_ITERATIONS = 2000000;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> | null {
  if (!/^(?:[0-9a-fA-F]{2})+$/.test(hex)) return null;
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Perbandingan string hex dengan waktu konstan (panjang harus sama). */
function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: NEW_HASH_ITERATIONS },
    keyMaterial,
    256
  );
  return `pbkdf2:${NEW_HASH_ITERATIONS}:${toHex(salt)}:${toHex(new Uint8Array(derivedBits))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    if (typeof stored !== 'string') return false;
    const parts = stored.split(':');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;

    const iterations = Number(parts[1]);
    if (!Number.isInteger(iterations) || iterations < 1 || iterations > MAX_VERIFY_ITERATIONS) {
      return false;
    }
    const salt = fromHex(parts[2]);
    const expectedHashHex = parts[3].toLowerCase();
    if (!salt || salt.length < 8 || !/^[0-9a-f]{64}$/.test(expectedHashHex)) {
      return false;
    }

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
      keyMaterial,
      256
    );
    const actualHashHex = toHex(new Uint8Array(derivedBits));
    return constantTimeEqualHex(actualHashHex, expectedHashHex);
  } catch {
    return false;
  }
}
