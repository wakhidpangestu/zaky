import crypto from 'crypto';

/**
 * Menghitung HMAC-SHA256 untuk penyamaran nomor telepon / data pribadi mustahik
 * sehingga pencarian dapat dilakukan tanpa menyimpan plaintext nomor telepon (UU 27/2022).
 */
export function hmacTelepon(telepon: string, pepper: string = 'zaky-default-pepper-2026'): Buffer {
  const cleanPhone = telepon.replace(/\D/g, '');
  return crypto.createHmac('sha256', pepper).update(cleanPhone).digest();
}

/**
 * Memeriksa apakah nomor telepon cocok dengan hash HMAC tersimpan
 */
export function cocokkanHmacTelepon(
  teleponInput: string,
  storedHmac: Buffer | string,
  pepper: string = 'zaky-default-pepper-2026'
): boolean {
  const inputHmac = hmacTelepon(teleponInput, pepper);
  const targetBuffer = typeof storedHmac === 'string' ? Buffer.from(storedHmac, 'hex') : storedHmac;

  if (inputHmac.length !== targetBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputHmac, targetBuffer);
}
