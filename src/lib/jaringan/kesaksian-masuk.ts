import { cariAnggota } from '../../infrastructure/jaringan/direktori.ts';
import {
  verifikasiTandaTanganKesaksian,
  type KesaksianLengkap,
} from '../../infrastructure/jaringan/kesaksian.ts';

/**
 * Menerima kesaksian dari instans lembaga lain (Bab 8.2, 10.3, FR-42 s/d FR-45).
 *
 * Kesaksian disimpan hanya bila tanda tangannya sah dan lembaga yang disaksikan sudah
 * menerbitkan hash harian di server ini. Kesaksian yang hash-nya BERBEDA tetap disimpan:
 * itu bukti bahwa lembaga lain melihat sejarah yang tidak sama, dan papan silang
 * menampilkannya sebagai "tidak cocok". Kunci utama (saksi, lembaga, tanggal) membuat
 * setiap kesaksian hanya bisa tercatat sekali, sehingga replay tertolak di semua instans.
 */
export const MAX_SKEW_MS = 5 * 60_000; // Bab 10.3: ditolak jika > 5 menit

type Query = (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;

export interface HasilKesaksian {
  status: number;
  body: Record<string, unknown>;
}

const gagal = (status: number, error: string): HasilKesaksian => ({ status, body: { error } });

export async function terimaKesaksian(
  q: Query,
  kesaksian: KesaksianLengkap,
  now = Date.now(),
): Promise<HasilKesaksian> {
  // 1. Waktu yang IKUT DITANDATANGANI (diamati_pada) harus segar.
  if (Math.abs(now - new Date(kesaksian.diamati_pada).getTime()) > MAX_SKEW_MS)
    return gagal(400, 'REPLAY_DETECTED: Waktu kesaksian di luar jendela 5 menit.');

  // 2. Tidak boleh bersaksi untuk diri sendiri.
  if (kesaksian.saksi_lembaga_id.toLowerCase() === kesaksian.lembaga_id.toLowerCase())
    return gagal(422, 'CHECK_VIOLATION: Lembaga tidak dapat menjadi saksi atas dirinya sendiri.');

  // 3. Saksi harus anggota aktif di direktori federasi.
  const saksi = cariAnggota(kesaksian.saksi_lembaga_id);
  if (!saksi || saksi.status !== 'aktif')
    return gagal(403, 'Lembaga saksi tidak dikenal atau tidak aktif dalam direktori anggota.');

  // 4. Tanda tangan Ed25519 atas payload JCS.
  if (!verifikasiTandaTanganKesaksian(kesaksian, saksi.kunci_publik_ed25519))
    return gagal(401, 'INVALID_SIGNATURE: Tanda tangan Ed25519 saksi tidak valid.');

  // 5. Yang disaksikan harus hash harian yang benar-benar diterbitkan di server ini.
  const terbit = (
    await q('SELECT hash_kepala FROM hash_harian WHERE lembaga_id=$1 AND tanggal=$2', [
      kesaksian.lembaga_id,
      kesaksian.tanggal,
    ])
  ).rows[0] as { hash_kepala: Uint8Array } | undefined;
  if (!terbit)
    return gagal(404, 'Hash harian lembaga untuk tanggal tersebut belum diterbitkan di server ini.');
  const hashDisaksikan = kesaksian.hash_disaksikan.toLowerCase();
  const cocok = Buffer.from(terbit.hash_kepala).toString('hex') === hashDisaksikan;

  // 6. Simpan sekali. Konflik kunci utama = kesaksian untuk hari itu sudah tercatat.
  const tersimpan = (
    await q(
      `INSERT INTO kesaksian (saksi_lembaga_id, lembaga_id, tanggal, hash_disaksikan, tanda_tangan_saksi, diamati_pada)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING RETURNING saksi_lembaga_id`,
      [
        saksi.id,
        kesaksian.lembaga_id,
        kesaksian.tanggal,
        Buffer.from(hashDisaksikan, 'hex'),
        Buffer.from(kesaksian.tanda_tangan_saksi, 'hex'),
        kesaksian.diamati_pada,
      ],
    )
  ).rows[0];
  if (!tersimpan)
    return gagal(409, 'REPLAY_DETECTED: Kesaksian lembaga ini untuk tanggal tersebut sudah tercatat.');

  return {
    status: 201,
    body: {
      success: true,
      cocok,
      pesan: cocok
        ? `Kesaksian dari ${saksi.nama} untuk ${kesaksian.tanggal} tercatat dan cocok dengan hash yang diterbitkan.`
        : `Kesaksian dari ${saksi.nama} tercatat, tetapi hash-nya BERBEDA dari yang diterbitkan. Papan silang akan menandainya.`,
      saksi_lembaga_id: saksi.id,
      lembaga_id: kesaksian.lembaga_id,
      tanggal: kesaksian.tanggal,
      tercatat_pada: new Date(now).toISOString(),
    },
  };
}
