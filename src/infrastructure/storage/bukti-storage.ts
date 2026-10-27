/**
 * Infrastructure: Storage Bukti Penyaluran
 * Sesuai Bab 3 dan Bab 10.3 (Pencegahan Unggah Berkas Berbahaya)
 *
 * Batasan Keamanan:
 * - Tipe berkas terbatas: JPEG, PNG, WebP, PDF
 * - Batas ukuran maksimal: 5 MB
 * - Hash integritas dihitung dengan SHA-256
 */

import { sha256Buffer } from '../kripto/sha256.ts';

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

/** Tanda tangan biner (magic bytes) yang wajib cocok dengan MIME yang diklaim. */
function cocokDenganMagicBytes(tipeMime: string, b: Buffer): boolean {
  switch (tipeMime) {
    case 'image/jpeg':
      return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case 'image/png':
      return (
        b.length >= 8 &&
        b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
        b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
      );
    case 'image/webp':
      return (
        b.length >= 12 &&
        b.toString('ascii', 0, 4) === 'RIFF' &&
        b.toString('ascii', 8, 12) === 'WEBP'
      );
    case 'application/pdf':
      return b.length >= 5 && b.toString('ascii', 0, 5) === '%PDF-';
    default:
      return false;
  }
}

/**
 * Sanitasi nama berkas untuk jalur penyimpanan (audit R4): buang komponen
 * direktori dan karakter di luar daftar aman agar tidak dapat dipakai untuk
 * path traversal atau menyisipkan karakter kontrol.
 */
export function sanitasiNamaBerkas(namaBerkas: string): string {
  const hanyaNama = namaBerkas.split(/[\\/]/).pop() ?? '';
  const bersih = hanyaNama
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 100);
  return bersih || 'berkas-bukti';
}

/**
 * Validasi dan pemrosesan berkas bukti penyaluran
 */
export function prosesBerkasBukti(
  namaBerkas: string,
  tipeMime: string,
  bufferKonten: Buffer
): BerkasBuktiInfo {
  if (bufferKonten.length === 0) {
    throw new Error('Berkas kosong tidak dapat diproses.');
  }

  if (bufferKonten.length > MAKS_UKURAN_BERKAS_BYTE) {
    throw new Error(`Ukuran berkas melebihi batas maksimal 5 MB (${Math.round(bufferKonten.length / 1024)} KB).`);
  }

  if (!MIME_DIIZINKAN.includes(tipeMime)) {
    throw new Error(`Tipe berkas '${tipeMime}' tidak diizinkan. Hanya menerima JPEG, PNG, WebP, dan PDF.`);
  }

  // Perbaikan audit R4: string MIME dari pemanggil tidak lagi dipercaya —
  // isi berkas wajib membuktikan tipenya lewat magic bytes.
  if (!cocokDenganMagicBytes(tipeMime, bufferKonten)) {
    throw new Error(`Isi berkas tidak cocok dengan tipe '${tipeMime}' yang diklaim (pemeriksaan magic bytes gagal).`);
  }

  const hashBuffer = sha256Buffer(bufferKonten);
  const hashHex = hashBuffer.toString('hex');
  const namaAman = sanitasiNamaBerkas(namaBerkas);

  return {
    namaBerkas,
    tipeMime,
    ukuranByte: bufferKonten.length,
    hashSha256Hex: hashHex,
    urlPenyimpanan: `/storage/bukti/${hashHex.substring(0, 16)}-${namaAman}`,
    diunggahPada: new Date().toISOString(),
  };
}
