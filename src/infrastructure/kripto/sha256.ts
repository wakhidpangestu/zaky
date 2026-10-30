import crypto from 'crypto';

/**
 * Menghitung digest SHA-256 dalam bentuk Buffer (32 bytes)
 */
export function sha256Buffer(data: string | Buffer): Buffer {
  return crypto.createHash('sha256').update(data).digest();
}

/**
 * Menghitung digest SHA-256 dalam bentuk string Hexadesimal
 */
export function sha256Hex(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Menghasilkan token acak 32-byte kriptografis (mis. untuk token konfirmasi mustahik)
 */
export function generateRandomToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}
