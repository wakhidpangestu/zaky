import fs from 'fs';
import path from 'path';

export interface AnggotaJaringan {
  id: string;
  kode: string;
  nama: string;
  kota: string;
  provinsi: string;
  endpoint: string;
  kunci_publik_ed25519: string;
  status: 'aktif' | 'ditangguhkan';
  bergabung_pada: string;
}

export interface DirektoriConfig {
  versi: number;
  terakhir_diperbarui: string;
  deskripsi: string;
  anggota: AnggotaJaringan[];
}

let cacheDirektori: DirektoriConfig | null = null;

/**
 * Memuat direktori anggota federasi dari direktori/anggota.json
 */
export function muatDirektoriAnggota(): DirektoriConfig {
  if (cacheDirektori) {
    return cacheDirektori;
  }

  const filePath = path.join(process.cwd(), 'direktori', 'anggota.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Berkas direktori anggota tidak ditemukan di ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  cacheDirektori = JSON.parse(content) as DirektoriConfig;
  return cacheDirektori;
}

/**
 * Mencari data anggota berdasarkan UUID atau kode lembaga
 */
export function cariAnggota(idOrKode: string): AnggotaJaringan | undefined {
  const dir = muatDirektoriAnggota();
  return dir.anggota.find(
    (a) => a.id.toLowerCase() === idOrKode.toLowerCase() || a.kode.toLowerCase() === idOrKode.toLowerCase()
  );
}

/**
 * Mengambil daftar seluruh anggota aktif selain lembaga sendiri
 */
export function getAnggotaLain(myId: string): AnggotaJaringan[] {
  const dir = muatDirektoriAnggota();
  return dir.anggota.filter((a) => a.id.toLowerCase() !== myId.toLowerCase() && a.status === 'aktif');
}
