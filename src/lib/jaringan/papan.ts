import { query } from '../db';
import { jcsBuffer } from '../../infrastructure/kripto/jcs.ts';
import { verifyEd25519 } from '../../infrastructure/kripto/ed25519.ts';
import { cariAnggota } from '../../infrastructure/jaringan/direktori.ts';
import { LEMBAGA, kunciLembaga, tandaTangani, type KodeLembaga } from './kunci.ts';

/**
 * Papan silang from real records.
 *
 * 1. Lembaga A closes each WIB day by publishing the head of its audit chain, signed (Ed25519, JCS).
 * 2. Lembaga B and C verify that signature, recompute the chain on their own, and sign a
 *    testimony only when the result matches.
 * 3. The board recomputes the chain again now and compares it with what was witnessed.
 */

const A = LEMBAGA.A.id;
const SAKSI: KodeLembaga[] = ['B', 'C'];
const KUNCI_ID = 'ed25519-v1';
const MENIT = 60_000;

export type StatusPapan = 'terkonfirmasi' | 'belum_cukup_saksi' | 'tidak_cocok' | 'belum_diterbitkan';
export interface KesaksianPapan {
  kode: KodeLembaga;
  nama: string;
  hashDisaksikan: string;
  diamatiPada: string;
  tandaTanganValid: boolean;
  cocok: boolean;
}
export interface PapanSilang {
  tanggal: string;
  kunciDemo: boolean;
  anggota: { kode: KodeLembaga; nama: string; kota: string; kunciPublik: string }[];
  status: StatusPapan;
  terbit: {
    hashKepala: string;
    jumlahEntri: number;
    diterbitkanPada: string;
    tandaTanganValid: boolean;
  } | null;
  hitungUlang: { hash: string; jumlah: number; rusakDi: number | null; diubahNomor: number | null } | null;
  saksi: KesaksianPapan[];
}

/** Start of the next WIB day for a YYYY-MM-DD date: the moment that day's book closes. */
const tutupBuku = (tanggal: string) => new Date(Date.parse(`${tanggal}T00:00:00+07:00`) + 24 * 60 * MENIT);

/** The last `n` WIB days whose books are already closed, newest first. */
export function tanggalTertutup(n = 3, now = Date.now()): string[] {
  const hariIniWib = new Date(now + 7 * 60 * MENIT).toISOString().slice(0, 10);
  const out: string[] = [];
  for (let i = 1; i <= n; i++)
    out.push(new Date(Date.parse(hariIniWib) - i * 24 * 60 * MENIT).toISOString().slice(0, 10));
  return out;
}

const kunciPublik = (kode: KodeLembaga) => cariAnggota(LEMBAGA[kode].id)?.kunci_publik_ed25519 ?? '';
const payloadKesaksian = (kode: KodeLembaga, tanggal: string, hash: string, diamati: string) => ({
  saksi_lembaga_id: LEMBAGA[kode].id,
  lembaga_id: A,
  tanggal,
  hash_disaksikan: hash,
  diamati_pada: diamati,
});

async function hitungUlang(sampai: number, ubah: number | null = null) {
  const { rows } = await query<{ hash: Buffer; jumlah: string; rusak_di: string | null }>(
    'SELECT hash, jumlah, rusak_di FROM hitung_ulang_rantai($1, $2, $3)',
    [A, sampai, ubah],
  );
  return {
    hash: rows[0].hash.toString('hex'),
    jumlah: Number(rows[0].jumlah),
    rusakDi: rows[0].rusak_di === null ? null : Number(rows[0].rusak_di),
  };
}

/**
 * Publishes Lembaga A's daily hash for a closed day and lets B and C witness it.
 * Idempotent: rows already in hash_harian / kesaksian are never rewritten.
 */
export async function terbitkanDanSaksikan(tanggal: string, now = Date.now()) {
  const tutup = tutupBuku(tanggal);
  if (tutup.getTime() > now) return;
  const kepala = (
    await query<{ nomor: string; hash_saat_ini: Buffer }>(
      'SELECT nomor, hash_saat_ini FROM audit_log WHERE lembaga_id=$1 AND waktu < $2 ORDER BY nomor DESC LIMIT 1',
      [A, tutup],
    )
  ).rows[0];
  if (!kepala) return;

  const nomor = Number(kepala.nomor);
  const hashKepala = kepala.hash_saat_ini.toString('hex');
  const payload = jcsBuffer({ hash_kepala: hashKepala, jumlah_entri: nomor, lembaga_id: A, tanggal, versi: 1 });
  const diterbitkan = new Date(tutup.getTime() + MENIT);
  await query(
    `INSERT INTO hash_harian (lembaga_id, tanggal, payload_jcs, hash_kepala, tanda_tangan, kunci_id, diterbitkan_pada)
     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
    [A, tanggal, payload, kepala.hash_saat_ini, tandaTangani('A', payload), KUNCI_ID, diterbitkan],
  );

  // Use what is actually stored: a witness signs the published record, not our local variables.
  const terbit = (
    await query<{ payload_jcs: Buffer; tanda_tangan: Buffer; hash_kepala: Buffer; diterbitkan_pada: Date }>(
      'SELECT payload_jcs, tanda_tangan, hash_kepala, diterbitkan_pada FROM hash_harian WHERE lembaga_id=$1 AND tanggal=$2',
      [A, tanggal],
    )
  ).rows[0];
  if (!verifyEd25519(terbit.payload_jcs, terbit.tanda_tangan, kunciPublik('A'))) return;
  const diterbitkanHash = terbit.hash_kepala.toString('hex');
  const ulang = await hitungUlang(nomor);
  if (ulang.hash !== diterbitkanHash) return; // a witness refuses to sign a chain that does not recompute

  for (const [i, kode] of SAKSI.entries()) {
    const diamati = new Date(terbit.diterbitkan_pada.getTime() + (3 + i) * MENIT).toISOString();
    const isi = payloadKesaksian(kode, tanggal, diterbitkanHash, diamati);
    await query(
      `INSERT INTO kesaksian (saksi_lembaga_id, lembaga_id, tanggal, hash_disaksikan, tanda_tangan_saksi, diamati_pada)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
      [LEMBAGA[kode].id, A, tanggal, terbit.hash_kepala, tandaTangani(kode, jcsBuffer(isi)), diamati],
    );
  }
}

/**
 * The board for one day. With `simulasi`, one audit row is altered in memory only
 * (never in the table) before recomputing, to show that the change cannot hide.
 */
export async function papanSilang(tanggal: string, simulasi = false): Promise<PapanSilang> {
  await terbitkanDanSaksikan(tanggal);
  const anggota = (['A', 'B', 'C'] as const).map((kode) => ({
    kode,
    nama: LEMBAGA[kode].nama,
    kota: LEMBAGA[kode].kota,
    kunciPublik: kunciPublik(kode),
  }));
  const kunciDemo = (['A', 'B', 'C'] as const).some((k) => kunciLembaga(k).demo);
  const base = { tanggal, kunciDemo, anggota };

  const row = (
    await query<{ payload_jcs: Buffer; tanda_tangan: Buffer; hash_kepala: Buffer; diterbitkan_pada: Date }>(
      'SELECT payload_jcs, tanda_tangan, hash_kepala, diterbitkan_pada FROM hash_harian WHERE lembaga_id=$1 AND tanggal=$2',
      [A, tanggal],
    )
  ).rows[0];
  if (!row) return { ...base, status: 'belum_diterbitkan', terbit: null, hitungUlang: null, saksi: [] };

  const isi = JSON.parse(row.payload_jcs.toString('utf8')) as { jumlah_entri: number };
  const hashKepala = row.hash_kepala.toString('hex');
  const terbit = {
    hashKepala,
    jumlahEntri: isi.jumlah_entri,
    diterbitkanPada: row.diterbitkan_pada.toISOString(),
    tandaTanganValid: verifyEd25519(row.payload_jcs, row.tanda_tangan, kunciPublik('A')),
  };
  const diubahNomor = simulasi ? Math.max(1, Math.ceil(isi.jumlah_entri / 2)) : null;
  const ulang = { ...(await hitungUlang(isi.jumlah_entri, diubahNomor)), diubahNomor };

  const { rows } = await query<{ saksi_lembaga_id: string; hash_disaksikan: Buffer; tanda_tangan_saksi: Buffer; diamati_pada: Date }>(
    'SELECT saksi_lembaga_id, hash_disaksikan, tanda_tangan_saksi, diamati_pada FROM kesaksian WHERE lembaga_id=$1 AND tanggal=$2 ORDER BY diamati_pada',
    [A, tanggal],
  );
  const saksi: KesaksianPapan[] = rows.flatMap((r) => {
    const kode = SAKSI.find((k) => LEMBAGA[k].id === r.saksi_lembaga_id);
    if (!kode) return [];
    const hash = r.hash_disaksikan.toString('hex'),
      diamati = r.diamati_pada.toISOString();
    return [
      {
        kode,
        nama: LEMBAGA[kode].nama,
        hashDisaksikan: hash,
        diamatiPada: diamati,
        tandaTanganValid: verifyEd25519(
          jcsBuffer(payloadKesaksian(kode, tanggal, hash, diamati)),
          r.tanda_tangan_saksi,
          kunciPublik(kode),
        ),
        cocok: hash === ulang.hash,
      },
    ];
  });

  const status: StatusPapan =
    !terbit.tandaTanganValid || ulang.hash !== hashKepala
      ? 'tidak_cocok'
      : saksi.filter((s) => s.tandaTanganValid && s.cocok).length >= 2
        ? 'terkonfirmasi'
        : 'belum_cukup_saksi';
  return { ...base, status, terbit, hitungUlang: ulang, saksi };
}
