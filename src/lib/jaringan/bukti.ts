import { cariAnggota } from '../../infrastructure/jaringan/direktori.ts';
import type { BuktiPublik } from './verifikasi-bukti.ts';

/**
 * Menyusun paket bukti untuk satu kode catatan, agar siapa pun dapat menghitung ulang
 * rantai audit di perangkatnya sendiri (lihat verifikasi-bukti.ts).
 *
 * Rantai audit di-hash dari teks json_build_object(...)::text PostgreSQL, jadi yang dikirim
 * adalah teks payload persis per entri. Agar catatan terikat pada hash harian yang
 * ditandatangani, paket memuat seluruh entri dari entri pertama catatan sampai kepala rantai
 * hari itu: hash berantai tidak bisa diperiksa tanpa payload setiap entri di antaranya.
 * Entri lain hanya berisi status, nominal, dan saldo, bukan identitas muzaki atau mustahik.
 */
type Query = (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;

export const MAKS_ENTRI_BUKTI = 5000;
const JAM = 3_600_000;

const hex = (v: unknown) => Buffer.from(v as Uint8Array).toString('hex');
/** Tanggal WIB (YYYY-MM-DD) sebuah waktu. */
const tanggalWib = (t: Date) => new Date(t.getTime() + 7 * JAM).toISOString().slice(0, 10);
/** Awal hari WIB berikutnya: saat buku tanggal itu ditutup. */
const tutupBuku = (tanggal: string) => Date.parse(`${tanggal}T00:00:00+07:00`) + 24 * JAM;

// Rumus yang identik dengan append_audit_log() dan hitung_ulang_rantai().
const PAYLOAD_SQL = `json_build_object(
  'aksi', aksi, 'entitas', entitas, 'entitas_id', entitas_id, 'lembaga_id', lembaga_id,
  'nomor', nomor, 'pelaku', pelaku, 'sebelum', sebelum, 'sesudah', sesudah,
  'waktu', to_char(waktu AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))::text`;

export class BuktiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function susunBukti(
  q: Query,
  kode: string,
  now = Date.now(),
  /** Menerbitkan hash harian bila belum ada (idempoten), dipanggil hanya untuk hari yang sudah tutup buku. */
  terbitkan?: (tanggal: string) => Promise<void>,
): Promise<BuktiPublik> {
  const catatan = (
    await q(
      `SELECT id, lembaga_id, 'penyaluran' AS jenis FROM penyaluran WHERE kode_unik=$1
       UNION ALL SELECT id, lembaga_id, 'penerimaan' FROM penerimaan WHERE kode_unik=$1 LIMIT 1`,
      [kode],
    )
  ).rows[0] as { id: string; lembaga_id: string; jenis: 'penyaluran' | 'penerimaan' } | undefined;
  if (!catatan) throw new BuktiError(404, 'Kode tidak ditemukan dalam catatan tersimpan.');

  const milik = (
    await q('SELECT nomor, waktu FROM audit_log WHERE lembaga_id=$1 AND entitas_id=$2 ORDER BY nomor', [
      catatan.lembaga_id,
      catatan.id,
    ])
  ).rows as { nomor: string | number; waktu: Date }[];
  if (!milik.length) throw new BuktiError(404, 'Catatan ini belum memiliki entri audit.');
  const nomorCatatan = milik.map((m) => Number(m.nomor));
  const tanggal = tanggalWib(new Date(milik[milik.length - 1].waktu));

  const penerbit = cariAnggota(catatan.lembaga_id);
  if (terbitkan && penerbit && tutupBuku(tanggal) <= now) await terbitkan(tanggal);
  const harian =
    tutupBuku(tanggal) <= now && penerbit
      ? ((
          await q(
            'SELECT tanggal::text AS tanggal, payload_jcs, tanda_tangan FROM hash_harian WHERE lembaga_id=$1 AND tanggal=$2',
            [catatan.lembaga_id, tanggal],
          )
        ).rows[0] as { tanggal: string; payload_jcs: Uint8Array; tanda_tangan: Uint8Array } | undefined)
      : undefined;

  // Dengan hash harian: rentang utuh sampai kepala. Tanpa itu: entri catatan saja.
  const sampai = harian
    ? (JSON.parse(Buffer.from(harian.payload_jcs).toString('utf8')) as { jumlah_entri: number }).jumlah_entri
    : null;
  if (sampai !== null && sampai - nomorCatatan[0] + 1 > MAKS_ENTRI_BUKTI)
    throw new BuktiError(413, 'Rentang bukti terlalu panjang untuk diunduh sekaligus.');
  const entri = (
    sampai !== null
      ? await q(
          `SELECT nomor, ${PAYLOAD_SQL} AS payload, hash_sebelumnya, hash_saat_ini FROM audit_log
           WHERE lembaga_id=$1 AND nomor BETWEEN $2 AND $3 ORDER BY nomor`,
          [catatan.lembaga_id, nomorCatatan[0], sampai],
        )
      : await q(
          `SELECT nomor, ${PAYLOAD_SQL} AS payload, hash_sebelumnya, hash_saat_ini FROM audit_log
           WHERE lembaga_id=$1 AND nomor = ANY($2::bigint[]) ORDER BY nomor`,
          [catatan.lembaga_id, nomorCatatan],
        )
  ).rows.map((r) => ({
    nomor: Number(r.nomor),
    payload: r.payload as string,
    hash_sebelumnya: hex(r.hash_sebelumnya),
    hash_saat_ini: hex(r.hash_saat_ini),
  }));

  const kesaksian = harian
    ? (
        (
          await q(
            `SELECT saksi_lembaga_id::text AS saksi_lembaga_id, hash_disaksikan, tanda_tangan_saksi, diamati_pada
             FROM kesaksian WHERE lembaga_id=$1 AND tanggal=$2 ORDER BY diamati_pada`,
            [catatan.lembaga_id, tanggal],
          )
        ).rows as { saksi_lembaga_id: string; hash_disaksikan: Uint8Array; tanda_tangan_saksi: Uint8Array; diamati_pada: Date }[]
      ).flatMap((k) => {
        const saksi = cariAnggota(k.saksi_lembaga_id);
        return saksi
          ? [
              {
                saksi_lembaga_id: saksi.id,
                nama: saksi.nama,
                kunci_publik: saksi.kunci_publik_ed25519,
                hash_disaksikan: hex(k.hash_disaksikan),
                diamati_pada: new Date(k.diamati_pada).toISOString(),
                tanda_tangan: hex(k.tanda_tangan_saksi),
              },
            ]
          : [];
      })
    : [];

  return {
    versi: 1,
    kode,
    jenis: catatan.jenis,
    catatan_id: catatan.id,
    lembaga_id: catatan.lembaga_id,
    nomor_catatan: nomorCatatan,
    entri,
    hash_harian:
      harian && penerbit
        ? {
            tanggal: harian.tanggal,
            payload_jcs: Buffer.from(harian.payload_jcs).toString('utf8'),
            tanda_tangan: hex(harian.tanda_tangan),
            kunci_publik: penerbit.kunci_publik_ed25519,
          }
        : null,
    kesaksian,
    keterangan: harian
      ? null
      : tutupBuku(tanggal) > now
        ? `Buku tanggal ${tanggal} belum ditutup. Hash harian terbit setelah pukul 00.00 WIB berikutnya.`
        : `Hash harian tanggal ${tanggal} belum diterbitkan untuk lembaga ini.`,
  };
}

export { tanggalWib };
