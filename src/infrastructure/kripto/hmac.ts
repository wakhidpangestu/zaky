import crypto from 'crypto';

/**
 * Pepper HMAC telepon (audit S6): nomor telepon adalah ruang pencarian kecil,
 * jadi pepper TIDAK boleh berupa konstanta terpublikasi di deployment nyata.
 * Urutan resolusi: argumen eksplisit -> env TELEPON_PEPPER -> (khusus mode
 * demo: ZAKY_DEMO_MODE=true atau NODE_ENV=development) pepper demo bawaan
 * dengan peringatan. Di luar mode demo tanpa env, fungsi melempar error.
 */
const DEMO_PEPPER = 'zaky-default-pepper-2026';

function resolvePepper(pepperEksplisit?: string): string {
  if (pepperEksplisit) return pepperEksplisit;
  if (process.env.TELEPON_PEPPER) return process.env.TELEPON_PEPPER;
  if (process.env.ZAKY_DEMO_MODE === 'true' || process.env.NODE_ENV === 'development') {
    return DEMO_PEPPER;
  }
  throw new Error(
    'TELEPON_PEPPER belum diatur. Atur lewat environment untuk deployment nyata, ' +
      'atau aktifkan ZAKY_DEMO_MODE=true untuk mode demo.'
  );
}

/**
 * Menghitung HMAC-SHA256 untuk penyamaran nomor telepon / data pribadi mustahik
 * sehingga pencarian dapat dilakukan tanpa menyimpan plaintext nomor telepon (UU 27/2022).
 */
export function hmacTelepon(telepon: string, pepper?: string): Buffer {
  const cleanPhone = telepon.replace(/\D/g, '');
  return crypto.createHmac('sha256', resolvePepper(pepper)).update(cleanPhone).digest();
}

/**
 * Memeriksa apakah nomor telepon cocok dengan hash HMAC tersimpan
 */
export function cocokkanHmacTelepon(
  teleponInput: string,
  storedHmac: Buffer | string,
  pepper?: string
): boolean {
  const inputHmac = hmacTelepon(teleponInput, pepper);
  const targetBuffer = typeof storedHmac === 'string' ? Buffer.from(storedHmac, 'hex') : storedHmac;

  if (inputHmac.length !== targetBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputHmac, targetBuffer);
}
