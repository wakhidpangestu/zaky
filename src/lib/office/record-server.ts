import { createHash, timingSafeEqual } from 'node:crypto';
import { recipientToken } from './recipient-token';
import { query, getDbPool } from '../db';
import { OfficeHttpError } from './http';
import type { AuthorizedActor } from './workflow-server';
export async function officeCatalog(actor: AuthorizedActor, recipientQuery = '') {
  const ready = await query("SELECT to_regclass('public.office_evidence') AS table_name");
  if (!ready.rows[0]?.table_name)
    throw new OfficeHttpError(
      503,
      'Formulir bersama menunggu migrasi 006. Hubungi pengelola lembaga.',
    );
  const [funds, recipients, settings] = await Promise.all([
    query(
      'SELECT id,nama,saldo_tersedia::text AS available,saldo_dicadangkan::text AS reserved,total_tersalurkan::text AS delivered,total_masuk::text AS total FROM pos_dana WHERE lembaga_id=$1 ORDER BY nama',
      [actor.lembagaId],
    ),
    query(
      "SELECT id,nama_samaran AS nama,kabupaten AS destination,asnaf FROM mustahik WHERE lembaga_id=$1 AND ($2='' OR position(lower($2) in lower(nama_samaran||' '||kabupaten||' '||asnaf::text))>0) ORDER BY nama_samaran,id LIMIT 101",
      [actor.lembagaId, recipientQuery],
    ),
    query('SELECT persen_hak_amil_maks::text AS max FROM lembaga WHERE id=$1', [actor.lembagaId]),
  ]);
  return {
    actor: { id: actor.id, nama: actor.nama, peran: actor.peran },
    funds: funds.rows,
    recipients: recipients.rows.slice(0, 100),
    recipientsHasMore: recipients.rows.length > 100,
    maxAmilPercent: settings.rows[0].max,
  };
}
export async function officeRecord(actor: AuthorizedActor, id: string) {
  const c = await getDbPool().connect();
  try {
    await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const row = (
      await c.query(
        `SELECT w.id AS "workItemId",w.reference_id AS id,w.reference_type AS type,w.stage,w.status AS "workStatus",w.version,w.assigned_user_id AS "assignedUserId",office_eligible(w.id,$2) AS eligible,
   coalesce(p.kode_unik,r.kode_unik)::text AS code,coalesce(p.status::text,'recorded') AS status,coalesce(p.nominal,r.bruto)::text AS amount,
   r.hak_amil::text AS "amilAmount",r.masuk_pos::text AS "fundAmount",r.kanal AS channel,r.muzakki_nama AS "donorName",r.keterangan AS note,coalesce(p.dibuat_oleh,r.dicatat_oleh) AS "creatorId",
   f.nama AS "fundName",m.nama_samaran AS recipient,m.kabupaten AS destination,p.metode AS method,p.kedaluwarsa_pada AS "expiresAt",w.created_at AS "createdAt"
   FROM work_items w LEFT JOIN penyaluran p ON w.reference_type='penyaluran' AND p.id=w.reference_id AND p.lembaga_id=w.lembaga_id
   LEFT JOIN penerimaan r ON w.reference_type='penerimaan' AND r.id=w.reference_id AND r.lembaga_id=w.lembaga_id
   JOIN pos_dana f ON f.id=coalesce(p.pos_id,r.pos_id) AND f.lembaga_id=w.lembaga_id LEFT JOIN mustahik m ON m.id=p.mustahik_id AND m.lembaga_id=w.lembaga_id
   WHERE w.id=$1 AND w.lembaga_id=$3`,
        [id, actor.id, actor.lembagaId],
      )
    ).rows[0];
    if (!row) throw new OfficeHttpError(404, 'Catatan tidak ditemukan dalam lembaga ini.');
    const audit = (
      await c.query(
        "SELECT nomor::text,aksi,encode(hash_saat_ini,'hex') AS hash,waktu FROM audit_log WHERE lembaga_id=$1 AND entitas_id=$2 ORDER BY nomor DESC LIMIT 10",
        [actor.lembagaId, row.id],
      )
    ).rows;
    const evidence = (
      await c.query(
        `SELECT e.id,e.filename,encode(e.sha256,'hex') AS hash FROM bukti b JOIN office_evidence e ON b.berkas_path='office-evidence:'||e.id::text AND e.lembaga_id=$1 WHERE b.penyaluran_id=$2`,
        [actor.lembagaId, row.id],
      )
    ).rows;
    const witnesses = (
      await c.query(
        `SELECT a.nama,u.nama AS unit,k.hasil,k.dipakai_pada AS time FROM konfirmasi k JOIN akun a ON a.id=k.akun_saksi_id AND a.lembaga_id=$2 JOIN unit u ON u.id=k.unit_saksi AND u.lembaga_id=$2 WHERE k.penyaluran_id=$1 ORDER BY k.dipakai_pada`,
        [row.id, actor.lembagaId],
      )
    ).rows;
    let confirmationUrl: string | undefined;
    if (
      actor.peran === 'amil' &&
      row.method === 'mustahik' &&
      row.creatorId === actor.id &&
      row.status === 'menunggu_konfirmasi'
    ) {
      const pending = (
        await c.query(
          `SELECT r.request_id,k.token_hash FROM office_operation_requests r
    JOIN konfirmasi k ON k.penyaluran_id=$2 AND k.jenis='mustahik' AND k.dipakai_pada IS NULL AND k.kedaluwarsa_pada>clock_timestamp()
    WHERE r.lembaga_id=$1 AND r.actor_id=$3 AND r.kind='distribution' AND r.result->>'id'=$2::text LIMIT 1`,
          [actor.lembagaId, row.id, actor.id],
        )
      ).rows[0];
      if (pending) {
        const token = recipientToken(
          process.env.JWT_SECRET!,
          actor.lembagaId,
          actor.id,
          pending.request_id,
        );
        const hash = createHash('sha256').update(token).digest();
        if (pending.token_hash.length === hash.length && timingSafeEqual(pending.token_hash, hash))
          confirmationUrl = '/konfirmasi/' + token + '?record=' + row.id;
      }
    }
    await c.query('COMMIT');
    return {
      ...row,
      confirmationUrl,
      audit,
      evidence,
      witnesses,
      actorId: actor.id,
      canCancel:
        actor.peran === 'amil' &&
        row.type === 'penyaluran' &&
        row.status === 'menunggu_konfirmasi' &&
        row.creatorId === actor.id,
    };
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}
