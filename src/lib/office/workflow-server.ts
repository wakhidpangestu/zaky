import { getSession } from '../auth';
import { getDbPool, query } from '../db';
import { OfficeHttpError } from './http';
import { hasStrongJwtSecret } from '../secret';
import {
  eligibleForWork,
  isUuid,
  type WorkflowActor,
  type WorkItem,
  type WorkflowSnapshot,
  type TeamMember,
  type Presence,
  type AssignmentInput,
} from './workflow';

export interface AuthorizedActor extends WorkflowActor {
  expiresAt: number;
}
export function requireEnabled() {
  if (
    process.env.OFFICE_WORKFLOW_ENABLED === 'false' ||
    process.env.OFFICE_WORKFLOW_DEMO_ACK === 'false'
  )
    throw new OfficeHttpError(
      503,
      'Workflow bersama dinonaktifkan.',
    );
}
export async function reloadActor(actor: AuthorizedActor): Promise<AuthorizedActor> {
  requireEnabled();
  if (Date.now() >= actor.expiresAt)
    throw new OfficeHttpError(401, 'Sesi kedaluwarsa. Masuk ulang.');
  const row = (
    await query<WorkflowActor>(
      'SELECT a.id,a.lembaga_id AS "lembagaId",a.unit_id AS "unitId",a.peran,a.nama FROM akun a JOIN lembaga l ON l.id=a.lembaga_id JOIN unit u ON u.id=a.unit_id AND u.lembaga_id=a.lembaga_id WHERE a.id=$1 AND a.lembaga_id=$2 AND a.aktif AND l.aktif',
      [actor.id, actor.lembagaId],
    )
  ).rows[0];
  if (!row) throw new OfficeHttpError(401, 'Akun aktif dalam lembaga ini tidak ditemukan.');
  return { ...row, expiresAt: actor.expiresAt };
}
export async function getOfficeActor(): Promise<AuthorizedActor> {
  requireEnabled();
  const session = await getSession();
  const exp = (session as typeof session & { exp?: number })?.exp;
  if (!session || !isUuid(session.userId) || !isUuid(session.lembagaId) || typeof exp !== 'number')
    throw new OfficeHttpError(401, 'Sesi tidak valid. Masuk ulang.');
  return reloadActor({
    id: session.userId,
    lembagaId: session.lembagaId,
    unitId: '',
    peran: '',
    nama: '',
    expiresAt: exp * 1000,
  });
}
export async function loadWorkflowSnapshot(actor: AuthorizedActor): Promise<WorkflowSnapshot> {
  const client = await getDbPool().connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const items = (
      await client.query<WorkItem>(
        `
      SELECT w.id,w.lembaga_id AS "lembagaId",w.reference_type AS "referenceType",w.reference_id AS "referenceId",
        coalesce(p.kode_unik,r.kode_unik)::text AS code,w.stage,w.status,w.version,w.assigned_role AS "assignedRole",w.assigned_user_id AS "assignedUserId",
        coalesce(p.dibuat_oleh,r.dicatat_oleh) AS "creatorId",coalesce(p.dibuat_unit,creator.unit_id) AS "creatorUnitId",
        coalesce(p.status::text,'recorded') AS "domainStatus",coalesce(p.metode,'') AS method,coalesce(m.kabupaten,'') AS destination,
        coalesce(p.nominal,r.bruto)::text AS amount,w.updated_at AS "updatedAt",
        ARRAY(SELECT k.akun_saksi_id FROM konfirmasi k WHERE k.penyaluran_id=p.id AND k.jenis='saksi') AS "witnessIds",
        ARRAY(SELECT k.unit_saksi FROM konfirmasi k WHERE k.penyaluran_id=p.id AND k.jenis='saksi') AS "witnessUnitIds"
      FROM work_items w
      LEFT JOIN penyaluran p ON w.reference_type='penyaluran' AND p.id=w.reference_id AND p.lembaga_id=w.lembaga_id
      LEFT JOIN penerimaan r ON w.reference_type='penerimaan' AND r.id=w.reference_id AND r.lembaga_id=w.lembaga_id
      LEFT JOIN akun creator ON creator.id=coalesce(p.dibuat_oleh,r.dicatat_oleh)
      LEFT JOIN mustahik m ON m.id=p.mustahik_id AND m.lembaga_id=w.lembaga_id
      WHERE w.lembaga_id=$1 AND (p.id IS NOT NULL OR r.id IS NOT NULL)
      ORDER BY (w.status='open') DESC,w.updated_at DESC,w.id LIMIT 200`,
        [actor.lembagaId],
      )
    ).rows;
    const members = (
      await client.query<TeamMember>(
        `SELECT a.id,a.lembaga_id AS "lembagaId",a.unit_id AS "unitId",a.peran,a.nama,u.nama AS "unitName"
      FROM akun a JOIN unit u ON u.id=a.unit_id AND u.lembaga_id=a.lembaga_id WHERE a.lembaga_id=$1 AND a.aktif ORDER BY a.nama LIMIT 500`,
        [actor.lembagaId],
      )
    ).rows;
    const presence = (
      await client.query<Presence>(
        `SELECT DISTINCT ON (a.id) a.id AS "userId",a.nama,p.station,p.last_seen_at AS "lastSeenAt"
      FROM office_presence p JOIN akun a ON a.id=p.akun_id AND a.lembaga_id=p.lembaga_id
      WHERE p.lembaga_id=$1 AND p.expires_at>clock_timestamp() AND a.aktif ORDER BY a.id,p.last_seen_at DESC`,
        [actor.lembagaId],
      )
    ).rows;
    // Eligibility comes from SQL too: includes current expiry and source prerequisites.
    const eligibility = (
      await client.query<{ itemId: string; userId: string }>(
        `SELECT w.id AS "itemId",a.id AS "userId" FROM work_items w JOIN akun a ON a.lembaga_id=w.lembaga_id
      WHERE w.id=ANY($1::uuid[]) AND a.lembaga_id=$2 AND office_eligible(w.id,a.id)`,
        [items.map((w) => w.id), actor.lembagaId],
      )
    ).rows;
    const eligibleByItem = new Map<string, Set<string>>();
    for (const entry of eligibility) {
      if (!eligibleByItem.has(entry.itemId)) eligibleByItem.set(entry.itemId, new Set());
      eligibleByItem.get(entry.itemId)!.add(entry.userId);
    }
    for (const item of items)
      item.eligibleUserIds = members
        .filter((m) => eligibleForWork(item, m) && eligibleByItem.get(item.id)?.has(m.id))
        .map((m) => m.id);
    const funds = (
      await client.query<{
        id: string;
        nama: string;
        available: string;
        reserved: string;
        delivered: string;
        total: string;
      }>(
        'SELECT id,nama,saldo_tersedia::text AS available,saldo_dicadangkan::text AS reserved,total_tersalurkan::text AS delivered,total_masuk::text AS total FROM pos_dana WHERE lembaga_id=$1 ORDER BY nama',
        [actor.lembagaId],
      )
    ).rows;
    const totals = (
      await client.query<{ available: string; reserved: string; delivered: string; total: string }>(
        'SELECT coalesce(sum(saldo_tersedia),0)::text AS available,coalesce(sum(saldo_dicadangkan),0)::text AS reserved,coalesce(sum(total_tersalurkan),0)::text AS delivered,coalesce(sum(total_masuk),0)::text AS total FROM pos_dana WHERE lembaga_id=$1',
        [actor.lembagaId],
      )
    ).rows[0];
    const receiptCount = (
      await client.query<{ n: number }>(
        'SELECT count(*)::int AS n FROM penerimaan WHERE lembaga_id=$1',
        [actor.lembagaId],
      )
    ).rows[0].n;
    await client.query('COMMIT');
    const publicActor: WorkflowActor = {
      id: actor.id,
      lembagaId: actor.lembagaId,
      unitId: actor.unitId,
      peran: actor.peran,
      nama: actor.nama,
    };
    return {
      financial: { funds, totals, receiptCount },
      actor: publicActor,
      items,
      members,
      presence,
      serverTime: new Date().toISOString(),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
export async function assignWork(actor: AuthorizedActor, input: AssignmentInput) {
  return (
    await query<{ result: unknown }>('SELECT office_assign_work($1,$2,$3,$4,$5,$6,$7) AS result', [
      input.itemId,
      actor.id,
      input.version,
      input.requestId,
      input.action,
      input.targetUserId,
      input.reason,
    ])
  ).rows[0].result;
}
