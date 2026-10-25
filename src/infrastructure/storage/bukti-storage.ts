/**
 * Infrastructure: Storage Bukti Penyaluran
 * Sesuai Bab 3 dan Bab 10.3 (Pencegahan Unggah Berkas Berbahaya)
 *
 * Batasan Keamanan:
 * - Tipe berkas terbatas: JPEG, PNG, WebP, PDF
 * - Batas ukuran maksimal: 5 MB
 * - Hash integritas dihitung dengan SHA-256
 */

import { sha256Buffer } from '../kripto/sha256';

export const MAKS_UKURAN_BERKAS_BYTE = 5 * 1024 * 1024; // 5 MB
export const MIME_DIIZINKAN = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export interface BerkasBuktiInfo {
  namaBerkas: string;
  tipeMime: string;
  ukuranByte: number;
  hashSha256Hex: string;
  urlPenyimpanan: string;
  diunggahPada: string;
}

/**
 * Validasi dan pemrosesan berkas bukti penyaluran
 */
export function prosesBerkasBukti(
  namaBerkas: string,
  tipeMime: string,
  bufferKonten: Buffer
): BerkasBuktiInfo {
  if (bufferKonten.length > MAKS_UKURAN_BERKAS_BYTE) {
    throw new Error(`Ukuran berkas melebihi batas maksimal 5 MB (${Math.round(bufferKonten.length / 1024)} KB).`);
  }

  if (!MIME_DIIZINKAN.includes(tipeMime)) {
    throw new Error(`Tipe berkas '${tipeMime}' tidak diizinkan. Hanya menerima JPEG, PNG, WebP, dan PDF.`);
  }

  const hashBuffer = sha256Buffer(bufferKonten);
  const hashHex = hashBuffer.toString('hex');

  return {
    namaBerkas,
    tipeMime,
    ukuranByte: bufferKonten.length,
    hashSha256Hex: hashHex,
    urlPenyimpanan: `/storage/bukti/${hashHex.substring(0, 16)}-${namaBerkas}`,
    diunggahPada: new Date().toISOString(),
  };
}
