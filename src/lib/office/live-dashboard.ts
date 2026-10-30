import { getDbPool } from '../db';
import { insights } from './sim-insights.ts';
import type { SimWorld } from './sim-world.ts';
import {
  normalizeLayout,
  type AuditEntry,
  type Case,
  type Fund,
  type Notice,
  type Receipt,
  type SimRole,
  type SimView,
  type Transaction,
} from './simulator.ts';
import type { AuthorizedActor } from './workflow-server';

/** One row of "Tugas saya": open work at a stage the signed-in officer may take. */
export interface LiveQueue {
  stage: 'penerimaan' | 'saksi' | 'persetujuan' | 'penyaluran';
  label: string;
  count: number;
}
/** Recorded actions per officer over the last 30 days. */
export interface LiveTeamMember {
  nama: string;
  role: SimRole;
  actions: number;
}
/**
 * The dashboard view built from the institution's PostgreSQL records instead of the
 * simulator. It keeps the SimView shape so every card and chart renders it unchanged.
 */
export interface LiveView extends SimView {
  source: 'database';
  queue: LiveQueue[];
  team: LiveTeamMember[];
  /** Changes whenever anything shown here changes; the stream compares it. */
  revision: string;
}

const ASNAF_NAME: Record<string, string> = {
  fakir: 'Fakir',
  miskin: 'Miskin',
  amil: 'Amil',
  muallaf: 'Mualaf',
  riqab: 'Riqab',
  gharimin: 'Gharimin',
  fisabilillah: 'Fisabilillah',
  ibnu_sabil: 'Ibnu sabil',
};
const ACTION_TEXT: Record<string, string> = {
  TAMBAH_PENERIMAAN: 'Penerimaan dicatat',
  BUAT_DRAF_RESERVASI: 'Draf penyaluran dibuat, dana dicadangkan',
  KONFIRMASI_SAKSI_TERIMA: 'Saksi mengonfirmasi penyerahan',
  KONFIRMASI_SAKSI_TOLAK: 'Saksi menolak penyerahan',
  KONFIRMASI_MUSTAHIK_TERIMA: 'Mustahik mengonfirmasi penerimaan',
  KONFIRMASI_MUSTAHIK_TOLAK: 'Mustahik menolak konfirmasi',
  KEDALUWARSA_MUSTAHIK: 'Tautan mustahik kedaluwarsa',
  SETUJUI_PENYALURAN: 'Penyaluran disahkan dan tersalurkan',
  BATALKAN_DRAF: 'Draf penyaluran dibatalkan',
};
const QUEUE_LABEL: Record<LiveQueue['stage'], string> = {
  penerimaan: 'Meja Penerimaan',
  penyaluran: 'Tindak lanjut penyaluran',
  saksi: 'Konfirmasi saksi',
  persetujuan: 'Persetujuan',
};
const hex = (b: Buffer | null) => (b ? b.toString('hex') : '');
const num = (s: string | null) => Number(s ?? 0);
const ms = (d: Date | string) => new Date(d).getTime();
/** Role shown for an audit action: approvers approve, amil either record or witness. */
function roleOf(peran: string | null, aksi: string): SimRole | 'sistem' {
  if (!peran) return 'sistem';
  if (peran === 'penyetuju' || aksi === 'SETUJUI_PENYALURAN') return 'penyetuju';
  if (aksi.startsWith('KONFIRMASI_SAKSI')) return 'saksi';
  return 'petugas';
}
const fundOf = (pos: string): Fund => (/infak|sedekah/i.test(pos) ? 'infak' : 'zakat');

export async function loadLiveView(actor: AuthorizedActor): Promise<LiveView> {
  const db = await getDbPool().connect();
  const L = actor.lembagaId;
  try {
    await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const q = async <T>(sql: string, params: unknown[] = [L]) => (await db.query(sql, params)).rows as T[];

    const [funds] = await q<{ zakat: string; infak: string; reserved: string; delivered: string; amil: string }>(
      `SELECT
         coalesce(sum(saldo_tersedia) FILTER (WHERE nama !~* 'infak|sedekah'),0)::text AS zakat,
         coalesce(sum(saldo_tersedia) FILTER (WHERE nama ~* 'infak|sedekah'),0)::text AS infak,
         coalesce(sum(saldo_dicadangkan),0)::text AS reserved,
         coalesce(sum(total_tersalurkan),0)::text AS delivered,
         (SELECT coalesce(sum(hak_amil),0) FROM penerimaan WHERE lembaga_id=$1)::text AS amil
       FROM pos_dana WHERE lembaga_id=$1`,
    );

    // Last audit hash per record, so transactions show the hash that seals them.
    const receipts = await q<{
      id: string; kode: string; nama: string | null; pos: string; bruto: string; amil: string;
      by: string; at: Date; hash: Buffer | null;
    }>(
      `SELECT r.id, r.kode_unik AS kode, r.muzakki_nama AS nama, p.nama AS pos, r.bruto::text, r.hak_amil::text AS amil,
         coalesce(a.nama,'') AS by, r.dicatat_pada AS at,
         (SELECT l.hash_saat_ini FROM audit_log l WHERE l.lembaga_id=r.lembaga_id AND l.entitas_id=r.id ORDER BY l.nomor DESC LIMIT 1) AS hash
       FROM penerimaan r JOIN pos_dana p ON p.id=r.pos_id LEFT JOIN akun a ON a.id=r.dicatat_oleh
       WHERE r.lembaga_id=$1 AND r.dicatat_pada > now() - interval '400 days'
       ORDER BY r.dicatat_pada DESC LIMIT 2000`,
    );
    const distributions = await q<{
      id: string; kode: string; nama: string; asnaf: string; nominal: string; status: string;
      dibuat: Date; disahkan: Date | null; hash: Buffer | null;
    }>(
      `SELECT d.id, d.kode_unik AS kode, coalesce(m.nama_samaran,'Mustahik') AS nama, d.asnaf::text, d.nominal::text,
         d.status::text, d.dibuat_pada AS dibuat, d.penyetuju_waktu AS disahkan,
         (SELECT l.hash_saat_ini FROM audit_log l WHERE l.lembaga_id=d.lembaga_id AND l.entitas_id=d.id ORDER BY l.nomor DESC LIMIT 1) AS hash
       FROM penyaluran d LEFT JOIN mustahik m ON m.id=d.mustahik_id
       WHERE d.lembaga_id=$1 AND d.dibuat_pada > now() - interval '400 days'
       ORDER BY d.dibuat_pada DESC LIMIT 2000`,
    );
    const audit = await q<{
      nomor: string; entitas: string; entitas_id: string; aksi: string; nama: string | null; peran: string | null;
      waktu: Date; prev: Buffer; hash: Buffer; linked: boolean;
    }>(
      `SELECT l.nomor::text, l.entitas, l.entitas_id, l.aksi, a.nama, a.peran, l.waktu,
         l.hash_sebelumnya AS prev, l.hash_saat_ini AS hash,
         l.hash_sebelumnya = coalesce(lag(l.hash_saat_ini) OVER (ORDER BY l.nomor), decode(repeat('00',32),'hex')) AS linked
       FROM audit_log l LEFT JOIN akun a ON a.id=l.pelaku
       WHERE l.lembaga_id=$1 ORDER BY l.nomor DESC LIMIT 3000`,
    );
    const [{ total: auditTotal }] = await q<{ total: number }>(
      'SELECT count(*)::int AS total FROM audit_log WHERE lembaga_id=$1',
    );
    // Open work this officer is eligible for, counted per stage.
    const queueRows = await q<{ stage: LiveQueue['stage']; n: number }>(
      `SELECT w.stage, count(*)::int AS n FROM work_items w
       WHERE w.lembaga_id=$1 AND w.status='open' AND office_eligible(w.id,$2)
       GROUP BY w.stage`,
      [L, actor.id],
    );
    const team = await q<{ nama: string; peran: string; actions: number; witness: number }>(
      `SELECT a.nama, a.peran,
         count(l.nomor)::int AS actions,
         count(l.nomor) FILTER (WHERE l.aksi LIKE 'KONFIRMASI_SAKSI%')::int AS witness
       FROM akun a LEFT JOIN audit_log l ON l.pelaku=a.id AND l.lembaga_id=a.lembaga_id AND l.waktu > now() - interval '30 days'
       WHERE a.lembaga_id=$1 AND a.aktif GROUP BY a.id ORDER BY actions DESC, a.nama`,
    );
    const [rev] = await q<{ r: string }>(
      `SELECT concat_ws(':',
         (SELECT coalesce(max(nomor),0) FROM audit_log WHERE lembaga_id=$1),
         (SELECT coalesce(max(updated_at)::text,'') FROM work_items WHERE lembaga_id=$1),
         (SELECT coalesce(sum(saldo_tersedia+saldo_dicadangkan+total_tersalurkan),0) FROM pos_dana WHERE lembaga_id=$1)) AS r`,
    );
    await db.query('COMMIT');

    const now = Date.now();
    const byEntity = new Map<string, typeof audit>();
    for (const a of audit) {
      const list = byEntity.get(a.entitas_id) ?? [];
      list.push(a);
      byEntity.set(a.entitas_id, list);
    }
    const auditEntries: AuditEntry[] = audit.map((a) => ({
      seq: Number(a.nomor),
      at: ms(a.waktu),
      actor: a.nama ?? 'Sistem',
      role: roleOf(a.peran, a.aksi),
      action: a.aksi,
      ref: a.entitas_id,
      detail: ACTION_TEXT[a.aksi] ?? a.aksi.toLowerCase().replaceAll('_', ' '),
      prevHash: hex(a.prev),
      hash: hex(a.hash),
    }));
    const firstBroken = [...audit].reverse().find((a) => !a.linked);

    const receiptList: Receipt[] = receipts.map((r, i) => ({
      id: i + 1,
      name: r.nama || 'Hamba Allah',
      jenis: fundOf(r.pos) === 'infak' ? 'Infak' : 'Zakat mal',
      fund: fundOf(r.pos),
      nominal: num(r.bruto),
      amil: num(r.amil),
      by: r.by,
      at: ms(r.at),
      hash: hex(r.hash),
    }));
    // Distributions in the chart are the ones that really left the fund.
    const cases = distributions.map(
      (d, i) =>
        ({
          id: i + 1,
          name: d.nama,
          asnaf: ASNAF_NAME[d.asnaf] ?? d.asnaf,
          nominal: num(d.nominal),
          stage: d.status === 'tersalurkan' ? 'terbit' : 'saksi',
          createdAt: ms(d.dibuat),
          updatedAt: ms(d.disahkan ?? d.dibuat),
          code: d.kode,
          hash: hex(d.hash),
          history: (byEntity.get(d.id) ?? []).map((a) => ({
            at: ms(a.waktu),
            actor: a.nama ?? 'Sistem',
            role: roleOf(a.peran, a.aksi),
            action: a.aksi,
            ok: !a.aksi.endsWith('TOLAK'),
          })),
        }) as unknown as Case,
    );

    const transactions: Transaction[] = [
      ...receiptList.map((r, i) => ({
        ref: receipts[i].kode,
        kind: 'masuk' as const,
        name: r.name,
        fund: r.fund,
        amount: r.nominal,
        at: r.at,
        hash: r.hash,
      })),
      ...distributions
        .filter((d) => d.status === 'tersalurkan')
        .map((d) => ({
          ref: d.kode,
          kind: 'keluar' as const,
          name: d.nama,
          fund: 'zakat' as Fund,
          amount: num(d.nominal),
          at: ms(d.disahkan ?? d.dibuat),
          hash: hex(d.hash),
        })),
    ].sort((a, b) => b.at - a.at);

    const world = { receipts: receiptList, cases, audit: auditEntries } as unknown as SimWorld;
    const role: SimRole = actor.peran === 'penyetuju' ? 'penyetuju' : 'petugas';
    // Stages this role works on: approvers approve; amil witness and follow up their drafts.
    const stages: LiveQueue['stage'][] = role === 'penyetuju' ? ['persetujuan'] : ['saksi', 'penyaluran'];
    const queue = stages.map((stage) => ({
      stage,
      label: QUEUE_LABEL[stage],
      count: queueRows.find((r) => r.stage === stage)?.n ?? 0,
    }));

    // Notifications: open work this officer can pick up, newest first.
    const notices: (Notice & { read: boolean })[] = queue
      .filter((r) => r.count > 0)
      .map((r, i) => ({
        id: i + 1,
        role,
        ref: r.stage,
        message: `${r.count} tugas menunggu di ${r.label.toLowerCase()}.`,
        at: now,
        readBy: [],
        done: false,
        read: false,
      }));

    return {
      source: 'database',
      revision: rev.r,
      me: { id: actor.id, nama: actor.nama, unitId: actor.unitId, role },
      funds: {
        zakat: num(funds.zakat),
        infak: num(funds.infak),
        amil: num(funds.amil),
        reserved: num(funds.reserved),
        distributed: num(funds.delivered),
      },
      deposits: [],
      requests: [],
      cases,
      receipts: receiptList,
      transactions,
      audit: auditEntries.slice(0, 50),
      auditTotal,
      notices,
      unread: notices.length,
      scores: [],
      brokenAt: firstBroken ? Number(firstBroken.nomor) : 0,
      layout: normalizeLayout(null),
      insights: insights(world, now),
      serverTime: now,
      queue,
      team: team.map((t) => ({
        nama: t.nama,
        role: t.peran === 'penyetuju' ? 'penyetuju' : t.witness > t.actions / 2 ? 'saksi' : 'petugas',
        actions: t.actions,
      })),
    };
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    db.release();
  }
}

/** Cheap fingerprint of everything the dashboard shows; the stream only pushes when it moves. */
export async function liveRevision(lembagaId: string): Promise<string> {
  const db = getDbPool();
  const { rows } = await db.query(
    `SELECT concat_ws(':',
       (SELECT coalesce(max(nomor),0) FROM audit_log WHERE lembaga_id=$1),
       (SELECT coalesce(max(updated_at)::text,'') FROM work_items WHERE lembaga_id=$1),
       (SELECT coalesce(sum(saldo_tersedia+saldo_dicadangkan+total_tersalurkan),0) FROM pos_dana WHERE lembaga_id=$1)) AS r`,
    [lembagaId],
  );
  return rows[0].r as string;
}
