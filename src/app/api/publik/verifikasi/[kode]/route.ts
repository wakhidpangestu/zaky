import { query } from '@/lib/db';
import { requireEnabled } from '@/lib/office/workflow-server';
import { officeJson, officeFailure, OfficeHttpError } from '@/lib/office/http';
export async function GET(_: Request, { params }: { params: Promise<{ kode: string }> }) {
  try {
    requireEnabled();
    const { kode } = await params;
    const code = kode.trim().toUpperCase();
    if (!/^(ZK|RC)[A-Z0-9]{10}$/.test(code))
      throw new OfficeHttpError(400, 'Kode harus 12 karakter dan berasal dari catatan Zaky.');
    const row = (
      await query(
        `SELECT w.reference_id AS id,w.reference_type AS type,w.stage,coalesce(p.kode_unik,r.kode_unik)::text AS kode_unik,coalesce(p.status::text,'recorded') AS status,coalesce(p.nominal,r.bruto)::text AS nominal,f.nama AS pos_dana,p.asnaf,
  (SELECT encode(a.hash_saat_ini,'hex') FROM audit_log a WHERE a.entitas_id=w.reference_id AND a.lembaga_id=w.lembaga_id ORDER BY a.nomor DESC LIMIT 1) AS hash_transaksi
  FROM work_items w LEFT JOIN penyaluran p ON w.reference_type='penyaluran' AND p.id=w.reference_id AND p.lembaga_id=w.lembaga_id
  LEFT JOIN penerimaan r ON w.reference_type='penerimaan' AND r.id=w.reference_id AND r.lembaga_id=w.lembaga_id
  JOIN pos_dana f ON f.id=coalesce(p.pos_id,r.pos_id) AND f.lembaga_id=w.lembaga_id
  JOIN lembaga l ON l.id=w.lembaga_id AND l.aktif WHERE coalesce(p.kode_unik,r.kode_unik)=$1 LIMIT 1`,
        [code],
      )
    ).rows[0];
    if (!row)
      throw new OfficeHttpError(
        404,
        'Kode tidak ditemukan dalam catatan tersimpan. Periksa kembali kode dari lembaga.',
      );
    return officeJson({
      valid: true,
      ...row,
      bukti_kriptografis: {
        hash_transaksi: row.hash_transaksi,
        algoritma: 'SHA-256',
        status_saksi_silang:
          'Lihat dokumen saksi silang yang diterbitkan; tidak disimpulkan dari status transaksi.',
      },
    });
  } catch (e) {
    return officeFailure(e);
  }
}
