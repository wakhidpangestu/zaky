import { query } from './db';
import { terbitkanDanSaksikan } from './jaringan/papan.ts';

/** Everything printed on a public proof document. Only public fields; no names of people. */
export interface DokumenCetak {
  kode: string;
  tipe: 'penerimaan' | 'penyaluran';
  lembaga: string;
  status: string;
  tahap: string;
  nominal: number;
  pos: string;
  dibuatPada: string;
  // receipts
  hakAmil: number | null;
  masukPos: number | null;
  kanal: string | null;
  muzakki: string | null;
  // distributions
  asnaf: string | null;
  wilayah: string | null;
  metode: string | null;
  disetujuiPada: string | null;
  saksi: { unit: string; hasil: string; waktu: string }[];
  audit: { nomor: number; aksi: string; waktu: string; hash: string }[];
  jaringan: { tanggal: string; saksi: number } | null;
}

const CODE = /^(ZK|RC)[A-Z0-9]{10}$/;

export async function muatDokumen(kodeMentah: string): Promise<DokumenCetak | null> {
  const kode = kodeMentah.trim().toUpperCase();
  if (!CODE.test(kode)) return null;
  const row = (
    await query<{
      id: string;
      lembaga_id: string;
      tipe: 'penerimaan' | 'penyaluran';
      stage: string;
      status: string;
      nominal: string;
      hak_amil: string | null;
      masuk_pos: string | null;
      kanal: string | null;
      muzakki_tipe: string | null;
      pos: string;
      asnaf: string | null;
      wilayah: string | null;
      metode: string | null;
      dibuat_pada: Date;
      disetujui_pada: Date | null;
      lembaga: string;
    }>(
      `SELECT w.reference_id AS id, w.lembaga_id, w.reference_type AS tipe, w.stage,
              coalesce(p.status::text, 'recorded') AS status,
              coalesce(p.nominal, r.bruto)::text AS nominal,
              r.hak_amil::text AS hak_amil, r.masuk_pos::text AS masuk_pos, r.kanal, r.muzakki_tipe::text AS muzakki_tipe,
              f.nama AS pos, p.asnaf::text AS asnaf, m.kabupaten AS wilayah, p.metode::text AS metode,
              coalesce(p.dibuat_pada, r.dicatat_pada) AS dibuat_pada, p.penyetuju_waktu AS disetujui_pada,
              l.nama AS lembaga
       FROM work_items w
       LEFT JOIN penyaluran p ON w.reference_type = 'penyaluran' AND p.id = w.reference_id AND p.lembaga_id = w.lembaga_id
       LEFT JOIN penerimaan r ON w.reference_type = 'penerimaan' AND r.id = w.reference_id AND r.lembaga_id = w.lembaga_id
       LEFT JOIN mustahik m ON m.id = p.mustahik_id
       JOIN pos_dana f ON f.id = coalesce(p.pos_id, r.pos_id) AND f.lembaga_id = w.lembaga_id
       JOIN lembaga l ON l.id = w.lembaga_id AND l.aktif
       WHERE coalesce(p.kode_unik, r.kode_unik) = $1
       LIMIT 1`,
      [kode],
    )
  ).rows[0];
  if (!row) return null;

  const [saksi, audit] = await Promise.all([
    query<{ jenis: string; unit: string | null; hasil: string; waktu: Date }>(
      `SELECT k.jenis::text AS jenis, u.nama AS unit, k.hasil::text AS hasil, k.dipakai_pada AS waktu
       FROM konfirmasi k LEFT JOIN unit u ON u.id = k.unit_saksi
       WHERE k.penyaluran_id = $1 AND k.dipakai_pada IS NOT NULL ORDER BY k.dipakai_pada`,
      [row.id],
    ),
    query<{ nomor: string; aksi: string; waktu: Date; hash: string }>(
      `SELECT nomor, aksi, waktu, encode(hash_saat_ini, 'hex') AS hash
       FROM audit_log WHERE entitas_id = $1 AND lembaga_id = $2 ORDER BY nomor`,
      [row.id, row.lembaga_id],
    ),
  ]);

  // The first daily hash that already contains this record's last audit entry.
  let jaringan: DokumenCetak['jaringan'] = null;
  const terakhir = audit.rows.at(-1);
  if (terakhir) {
    // Close the record's own day (WIB) so its daily hash exists, then find the first one containing it.
    await terbitkanDanSaksikan(new Date(terakhir.waktu.getTime() + 7 * 3600_000).toISOString().slice(0, 10));
    const h = (
      await query<{ tanggal: string; saksi: string }>(
        `SELECT to_char(h.tanggal, 'YYYY-MM-DD') AS tanggal,
                (SELECT count(*) FROM kesaksian k WHERE k.lembaga_id = h.lembaga_id AND k.tanggal = h.tanggal)::text AS saksi
         FROM hash_harian h
         WHERE h.lembaga_id = $1 AND (convert_from(h.payload_jcs, 'UTF8')::jsonb ->> 'jumlah_entri')::bigint >= $2
         ORDER BY h.tanggal LIMIT 1`,
        [row.lembaga_id, terakhir.nomor],
      )
    ).rows[0];
    if (h) jaringan = { tanggal: h.tanggal, saksi: Number(h.saksi) };
  }

  const num = (s: string | null) => (s === null ? null : Number(s));
  return {
    kode,
    tipe: row.tipe,
    lembaga: row.lembaga,
    status: row.status,
    tahap: row.stage,
    nominal: Number(row.nominal),
    pos: row.pos,
    dibuatPada: row.dibuat_pada.toISOString(),
    hakAmil: num(row.hak_amil),
    masukPos: num(row.masuk_pos),
    kanal: row.kanal,
    muzakki: row.muzakki_tipe,
    asnaf: row.asnaf,
    wilayah: row.wilayah,
    metode: row.metode,
    disetujuiPada: row.disetujui_pada?.toISOString() ?? null,
    saksi: saksi.rows.map((s) => ({
      unit: s.jenis === 'mustahik' ? 'Konfirmasi mustahik' : (s.unit ?? 'Unit lain'),
      hasil: s.hasil, waktu: s.waktu.toISOString() })),
    audit: audit.rows.map((a) => ({ nomor: Number(a.nomor), aksi: a.aksi, waktu: a.waktu.toISOString(), hash: a.hash })),
    jaringan,
  };
}

const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

/** Indonesian words for a whole number, e.g. 1250000 -> "satu juta dua ratus lima puluh ribu". */
export function terbilang(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n < 12) return SATUAN[n];
  if (n < 20) return terbilang(n - 10) + ' belas';
  if (n < 100) return (terbilang(Math.floor(n / 10)) + ' puluh ' + terbilang(n % 10)).trim();
  if (n < 200) return ('seratus ' + terbilang(n - 100)).trim();
  if (n < 1000) return (terbilang(Math.floor(n / 100)) + ' ratus ' + terbilang(n % 100)).trim();
  if (n < 2000) return ('seribu ' + terbilang(n - 1000)).trim();
  if (n < 1e6) return (terbilang(Math.floor(n / 1000)) + ' ribu ' + terbilang(n % 1000)).trim();
  if (n < 1e9) return (terbilang(Math.floor(n / 1e6)) + ' juta ' + terbilang(n % 1e6)).trim();
  if (n < 1e12) return (terbilang(Math.floor(n / 1e9)) + ' miliar ' + terbilang(n % 1e9)).trim();
  return (terbilang(Math.floor(n / 1e12)) + ' triliun ' + terbilang(n % 1e12)).trim();
}
