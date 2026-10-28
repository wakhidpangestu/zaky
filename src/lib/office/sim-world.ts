/**
 * Server-side shared office for Zaky Simulator. Every change goes through `act`, which checks the
 * account's role, updates notifications and appends a hash-chained audit entry. All names and
 * amounts are invented; this never touches institution records.
 */
import { createHash } from 'node:crypto';
import {
  ASNAF,
  WITNESSES_NEEDED,
  amilShare,
  evidenceProblem,
  fundFor,
  requestProblem,
  type Actor,
  type AuditEntry,
  type Case,
  type Deposit,
  type Funds,
  type Notice,
  type Receipt,
  type Request,
  type Score,
  type SimAction,
  type SimRole,
  type SimView,
  type Transaction,
  type DashboardLayout,
  WIB,
  normalizeLayout,
} from './simulator.ts';
import { insights } from './sim-insights.ts';

export interface SimWorld {
  version: 1;
  seed: number;
  nextId: number;
  nextNotice: number;
  spawn: { deposit: number; request: number };
  funds: Funds;
  deposits: Deposit[];
  requests: Request[];
  cases: Case[];
  receipts: Receipt[];
  notices: Notice[];
  audit: AuditEntry[];
  scores: Record<string, Score>;
  /** Dashboard card order per account; optional so older saved offices still load. */
  layouts?: Record<string, DashboardLayout>;
}
export class SimError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const GENESIS = '0'.repeat(64);
const DEPOSIT_EVERY = 40_000,
  REQUEST_EVERY = 65_000,
  DEPOSIT_MAX = 4,
  REQUEST_MAX = 3;
const NAMES = [
  'Bu Aminah',
  'Pak Hasan',
  'Ustazah Laila',
  'Pak Yusuf',
  'Bu Ratna',
  'Mas Fikri',
  'Bu Khadijah',
  'Pak Darto',
  'Teh Nia',
  'Bang Ilham',
  'Bu Fatimah',
  'Haji Salim',
];
const NOT_ASNAF = ['Pedagang mampu', 'Pegawai bergaji cukup', 'Pemilik kios ramai'];
const SEED_STAFF = {
  maker: { id: 'seed-petugas', nama: 'Amil Budi' },
  witnesses: [
    { id: 'seed-saksi-1', nama: 'Saksi Dewi', unitId: 'seed-unit-3' },
    { id: 'seed-saksi-2', nama: 'Saksi Rian', unitId: 'seed-unit-4' },
  ],
  approver: 'Penyetuju Hari',
};

// Small deterministic RNG stored in the world so a seed replays the same office.
function random(w: SimWorld) {
  let t = (w.seed = (w.seed + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T>(w: SimWorld, list: readonly T[]) => list[Math.floor(random(w) * list.length)];
const between = (w: SimWorld, min: number, max: number) =>
  Math.round((min + random(w) * (max - min)) / 50000) * 50000;

/** Appends an audit entry whose hash covers the previous entry, so edits break the chain. */
export function auditHash(prevHash: string, e: Omit<AuditEntry, 'hash' | 'prevHash'>) {
  return createHash('sha256')
    .update(prevHash + JSON.stringify([e.seq, e.at, e.actor, e.role, e.action, e.ref, e.detail]))
    .digest('hex');
}
function record(
  w: SimWorld,
  at: number,
  actor: { nama: string; role: SimRole } | null,
  action: string,
  ref: string,
  detail: string,
) {
  const prevHash = w.audit.at(-1)?.hash ?? GENESIS;
  const base = {
    seq: w.audit.length + 1,
    at,
    actor: actor?.nama ?? 'Sistem simulasi',
    role: actor?.role ?? ('sistem' as const),
    action,
    ref,
    detail,
  };
  const entry: AuditEntry = { ...base, prevHash, hash: auditHash(prevHash, base) };
  w.audit.push(entry);
  return entry;
}
export function verifyChain(audit: AuditEntry[]) {
  let prev = GENESIS;
  for (const e of audit) {
    if (e.prevHash !== prev || auditHash(prev, e) !== e.hash) return e.seq;
    prev = e.hash;
  }
  return 0;
}

function notify(w: SimWorld, role: SimRole, ref: string, message: string, at: number) {
  w.notices.push({ id: w.nextNotice++, role, ref, message, at, readBy: [], done: false });
}
/** Marks a task's notification as handled once the work is done. */
function finish(w: SimWorld, ref: string) {
  for (const n of w.notices) if (n.ref === ref) n.done = true;
}

function makeDeposit(w: SimWorld, at: number): Deposit {
  const jenis = pick(w, ['Zakat mal', 'Zakat mal', 'Zakat fitrah', 'Infak'] as const);
  return {
    id: w.nextId++,
    name: pick(w, NAMES),
    jenis,
    nominal: jenis === 'Zakat fitrah' ? between(w, 50000, 200000) : between(w, 250000, 4000000),
    at,
  };
}
function makeRequest(w: SimWorld, at: number): Request {
  const eligible = random(w) < 0.7;
  return {
    id: w.nextId++,
    name: pick(w, NAMES),
    asnaf:
      eligible || random(w) < 0.5
        ? pick(
            w,
            ASNAF.filter((a) => a !== 'Amil'),
          )
        : pick(w, NOT_ASNAF),
    registered: eligible || random(w) < 0.6,
    evidence: eligible || random(w) < 0.5,
    nominal: between(w, 300000, 2500000),
    at,
  };
}
function addDeposit(w: SimWorld, at: number) {
  const d = makeDeposit(w, at);
  w.deposits.push(d);
  notify(w, 'petugas', `deposit:${d.id}`, `${d.name} menyetor ${d.jenis} di Meja Penerimaan.`, at);
}
function addRequest(w: SimWorld, at: number) {
  const r = makeRequest(w, at);
  w.requests.push(r);
  notify(w, 'petugas', `request:${r.id}`, `${r.name} mengajukan bantuan di Meja Penyaluran.`, at);
}

function code(w: SimWorld) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.split('');
  return Array.from({ length: 12 }, () => pick(w, chars)).join('');
}

/** A fresh office with 30 days of simulated history so the dashboard has something to show. */
export function createWorld(now = Date.now(), seed = now): SimWorld {
  const w: SimWorld = {
    version: 1,
    seed: seed | 0,
    nextId: 1,
    nextNotice: 1,
    spawn: { deposit: now, request: now },
    funds: { zakat: 3_000_000, infak: 500_000, amil: 0, reserved: 0, distributed: 0 },
    deposits: [],
    requests: [],
    cases: [],
    receipts: [],
    notices: [],
    audit: [],
    scores: {},
  };
  record(w, now - 31 * 864e5, null, 'kantor_dibuka', 'genesis', 'Kantor simulasi dimulai dengan saldo awal.');
  const day = 864e5;
  for (let d = 30; d >= 1; d--) {
    // Office hours 08:00–16:00 WIB on each past day.
    const past = now - d * day,
      start = past - ((past + WIB) % day) + 8 * 36e5;
    const receipts = 2 + Math.floor(random(w) * 4);
    for (let i = 0; i < receipts; i++) {
      const at = start + random(w) * 8 * 36e5,
        dep = makeDeposit(w, at),
        fund = fundFor(dep.jenis),
        amil = amilShare(dep.nominal, fund);
      w.funds[fund] += dep.nominal - amil;
      w.funds.amil += amil;
      const e = record(w, at, { nama: SEED_STAFF.maker.nama, role: 'petugas' }, 'penerimaan', `deposit:${dep.id}`, `${dep.jenis} ${dep.name} masuk pos ${fund}.`);
      w.receipts.push({ ...dep, fund, amil, by: SEED_STAFF.maker.nama, hash: e.hash });
    }
    if (random(w) < 0.6) {
      const at = start + 6 * 36e5 + random(w) * 2 * 36e5,
        r = makeRequest(w, at),
        nominal = Math.min(r.nominal, Math.max(0, w.funds.zakat - 500_000));
      if (nominal < 300_000) continue;
      w.funds.zakat -= nominal;
      w.funds.distributed += nominal;
      const asnaf = ASNAF.includes(r.asnaf) ? r.asnaf : 'Miskin';
      record(w, at - 2 * 36e5, { nama: SEED_STAFF.maker.nama, role: 'petugas' }, 'draf_penyaluran', `case:${r.id}`, `Draf ${r.name} (${asnaf}) dibuat; dana dicadangkan.`);
      SEED_STAFF.witnesses.forEach((s, k) =>
        record(w, at - 36e5 + k * 6e5, { nama: s.nama, role: 'saksi' }, 'saksi_konfirmasi', `case:${r.id}`, `Saksi ${k + 1}/${WITNESSES_NEEDED} untuk ${r.name}.`),
      );
      const e = record(w, at, { nama: SEED_STAFF.approver, role: 'penyetuju' }, 'penyaluran_terbit', `case:${r.id}`, `Penyaluran ${r.name} (${asnaf}) terbit.`);
      w.cases.push({
        id: r.id,
        name: r.name,
        asnaf,
        nominal,
        receiptNominal: nominal,
        signed: true,
        confirmedNominal: nominal,
        stage: 'terbit',
        maker: SEED_STAFF.maker,
        witnesses: SEED_STAFF.witnesses,
        approver: SEED_STAFF.approver,
        createdAt: at - 2 * 36e5,
        updatedAt: at,
        code: code(w),
        hash: e.hash,
        history: [
          { at: at - 2 * 36e5, actor: SEED_STAFF.maker.nama, role: 'petugas', action: 'Draf dibuat', ok: true },
          { at: at - 36e5, actor: 'Saksi Dewi & Saksi Rian', role: 'saksi', action: 'Dikonfirmasi dua saksi', ok: true },
          { at, actor: SEED_STAFF.approver, role: 'penyetuju', action: 'Disetujui dan terbit', ok: true },
        ],
      });
    }
  }
  addDeposit(w, now);
  addDeposit(w, now);
  addRequest(w, now);
  return w;
}

/** Visitors keep arriving while the office is open. */
export function tick(w: SimWorld, now: number) {
  let changed = false;
  while (now - w.spawn.deposit >= DEPOSIT_EVERY) {
    w.spawn.deposit += DEPOSIT_EVERY;
    if (w.deposits.length < DEPOSIT_MAX) {
      addDeposit(w, w.spawn.deposit);
      changed = true;
    }
  }
  while (now - w.spawn.request >= REQUEST_EVERY) {
    w.spawn.request += REQUEST_EVERY;
    if (w.requests.length < REQUEST_MAX) {
      addRequest(w, w.spawn.request);
      changed = true;
    }
  }
  return changed;
}

function need(actor: Actor, role: SimRole) {
  if (actor.role !== role)
    throw new SimError(403, `Tugas ini untuk ${role}. Peranmu ${actor.role}, kamu hanya bisa melihat laporannya.`);
}
function score(w: SimWorld, actor: Actor, ok: boolean) {
  const s = (w.scores[actor.id] ??= { nama: actor.nama, role: actor.role, correct: 0, wrong: 0 });
  if (ok) s.correct++;
  else s.wrong++;
}
function release(w: SimWorld, c: Case) {
  w.funds.reserved -= c.nominal;
  w.funds.zakat += c.nominal;
}
function event(c: Case, actor: Actor, action: string, ok: boolean, at: number) {
  c.history.push({ at, actor: actor.nama, role: actor.role, action, ok });
  c.updatedAt = at;
}
function openCase(w: SimWorld, id: number, stage: Case['stage']) {
  const c = w.cases.find((x) => x.id === id);
  if (!c) throw new SimError(404, 'Berkas tidak ditemukan.');
  if (c.stage !== stage) throw new SimError(409, 'Berkas ini sudah diproses petugas lain.');
  return c;
}

export function act(w: SimWorld, actor: Actor, action: SimAction, now = Date.now()) {
  const result = (ok: boolean, message: string) => {
    score(w, actor, ok);
    return { ok, message };
  };
  const who = { nama: actor.nama, role: actor.role };
  switch (action.type) {
    case 'read': {
      for (const n of w.notices)
        if (n.role === actor.role && (action.id === 'all' || n.id === action.id) && !n.readBy.includes(actor.id))
          n.readBy.push(actor.id);
      return { ok: true, message: 'Notifikasi ditandai terbaca.' };
    }
    case 'layout': {
      // A personal preference: no audit entry and no score.
      (w.layouts ??= {})[actor.id] = normalizeLayout(action.layout);
      return { ok: true, message: 'Tata letak dashboard disimpan.' };
    }
    case 'receive': {
      need(actor, 'petugas');
      const i = w.deposits.findIndex((d) => d.id === action.id);
      if (i < 0) throw new SimError(409, 'Muzakki ini sudah dilayani petugas lain.');
      const [d] = w.deposits.splice(i, 1),
        fund = fundFor(d.jenis),
        amil = amilShare(d.nominal, fund);
      // Money always lands in the correct pot; a wrong choice is recorded, not booked.
      w.funds[fund] += d.nominal - amil;
      w.funds.amil += amil;
      const ok = action.fund === fund;
      const e = record(w, now, who, 'penerimaan', `deposit:${d.id}`, `${d.jenis} ${d.name} masuk pos ${fund}${ok ? '' : ` (petugas memilih ${action.fund})`}.`);
      w.receipts.push({ ...d, fund, amil, by: actor.nama, at: now, hash: e.hash });
      finish(w, `deposit:${d.id}`);
      return result(ok, ok ? `Penerimaan ${d.name} tercatat di pos ${fund}.` : `${d.jenis} masuk pos ${fund}, bukan ${action.fund}.`);
    }
    case 'distribute': {
      need(actor, 'petugas');
      const i = w.requests.findIndex((r) => r.id === action.id);
      if (i < 0) throw new SimError(409, 'Permohonan ini sudah diproses petugas lain.');
      const [r] = w.requests.splice(i, 1),
        problem = requestProblem(r, w.funds.zakat);
      finish(w, `request:${r.id}`);
      if (action.choice === 'reject') {
        record(w, now, who, 'permohonan_ditolak', `request:${r.id}`, `Permohonan ${r.name} ditolak${problem ? `: ${problem}` : ' tanpa alasan sah'}.`);
        return result(!!problem, problem ? `Tepat ditolak: ${problem}` : `${r.name} memenuhi syarat, tetapi ditolak.`);
      }
      if (problem) {
        record(w, now, who, 'draf_tidak_sah', `request:${r.id}`, `Draf ${r.name} dibatalkan sistem: ${problem}`);
        return result(false, `Draf tidak sah: ${problem}`);
      }
      w.funds.zakat -= r.nominal;
      w.funds.reserved += r.nominal;
      const c: Case = {
        id: r.id,
        name: r.name,
        asnaf: r.asnaf,
        nominal: r.nominal,
        receiptNominal: random(w) < 0.8 ? r.nominal : r.nominal + between(w, 100000, 500000),
        signed: random(w) < 0.85,
        confirmedNominal: random(w) < 0.2 ? r.nominal + between(w, 100000, 400000) : r.nominal,
        stage: 'saksi',
        maker: { id: actor.id, nama: actor.nama },
        witnesses: [],
        createdAt: now,
        updatedAt: now,
        history: [],
      };
      event(c, actor, 'Draf dibuat, dana dicadangkan', true, now);
      w.cases.push(c);
      record(w, now, who, 'draf_penyaluran', `case:${c.id}`, `Draf ${c.name} (${c.asnaf}) dibuat; dana dicadangkan.`);
      notify(w, 'saksi', `case:${c.id}`, `Draf ${c.name} menunggu konfirmasi saksi.`, now);
      return result(true, `Draf ${r.name} dibuat dan dikirim ke saksi.`);
    }
    case 'witness': {
      need(actor, 'saksi');
      const c = openCase(w, action.id, 'saksi');
      if (c.maker.id === actor.id) throw new SimError(403, 'Pembuat draf tidak boleh menjadi saksi.');
      if (c.witnesses.some((x) => x.id === actor.id))
        throw new SimError(409, 'Kamu sudah bersaksi untuk berkas ini; tunggu saksi kedua.');
      const evidence = evidenceProblem(c);
      if (action.choice === 'reject' || evidence) {
        c.stage = 'ditolak';
        release(w, c);
        finish(w, `case:${c.id}`);
        const ok = action.choice === 'reject' ? !!evidence : false;
        event(c, actor, action.choice === 'reject' ? 'Bukti ditolak saksi' : 'Dikonfirmasi padahal bukti bermasalah; dibatalkan auditor', ok, now);
        record(w, now, who, 'saksi_menolak', `case:${c.id}`, `Penyaluran ${c.name} ditolak: ${evidence ?? 'bukti dinilai tidak sesuai'}.`);
        return result(ok, action.choice === 'reject'
          ? evidence ? `Tepat ditolak: ${evidence}` : 'Bukti penyerahan lengkap, tetapi ditolak.'
          : `Tidak boleh dikonfirmasi: ${evidence}`);
      }
      c.witnesses.push({ id: actor.id, nama: actor.nama, unitId: actor.unitId });
      event(c, actor, `Konfirmasi saksi ${c.witnesses.length}/${WITNESSES_NEEDED}`, true, now);
      record(w, now, who, 'saksi_konfirmasi', `case:${c.id}`, `Saksi ${c.witnesses.length}/${WITNESSES_NEEDED} untuk ${c.name}.`);
      const own = w.notices.find((n) => n.ref === `case:${c.id}` && n.role === 'saksi');
      if (own && !own.readBy.includes(actor.id)) own.readBy.push(actor.id);
      if (c.witnesses.length < WITNESSES_NEEDED)
        return result(true, `Konfirmasi tercatat. Menunggu saksi kedua dari unit lain.`);
      c.stage = 'persetujuan';
      finish(w, `case:${c.id}`);
      notify(w, 'penyetuju', `approve:${c.id}`, `Penyaluran ${c.name} siap disetujui.`, now);
      return result(true, `Dua saksi lengkap. Berkas ${c.name} dikirim ke penyetuju.`);
    }
    case 'approve': {
      need(actor, 'penyetuju');
      const c = openCase(w, action.id, 'persetujuan');
      const changed = c.confirmedNominal !== c.nominal;
      finish(w, `approve:${c.id}`);
      c.approver = actor.nama;
      if (action.choice === 'return' || changed) {
        c.stage = 'dikembalikan';
        release(w, c);
        const ok = action.choice === 'return' ? changed : false;
        event(c, actor, action.choice === 'return' ? 'Dikembalikan penyetuju' : 'Disetujui padahal nominal berubah; dibatalkan auditor', ok, now);
        record(w, now, who, 'penyaluran_dikembalikan', `case:${c.id}`, `Penyaluran ${c.name} dikembalikan${changed ? ': nominal berubah setelah konfirmasi' : ''}.`);
        return result(ok, action.choice === 'return'
          ? changed ? 'Tepat dikembalikan: nominal berubah setelah konfirmasi.' : 'Berkas sudah sesuai, tetapi dikembalikan.'
          : 'Disetujui padahal nominal berubah setelah konfirmasi.');
      }
      c.stage = 'terbit';
      c.code = code(w);
      w.funds.reserved -= c.nominal;
      w.funds.distributed += c.nominal;
      event(c, actor, 'Disetujui dan catatan terbit', true, now);
      c.hash = record(w, now, who, 'penyaluran_terbit', `case:${c.id}`, `Penyaluran ${c.name} terbit dengan kode ${c.code}.`).hash;
      return result(true, `Disetujui. Catatan ${c.code} terbit untuk ${c.name}.`);
    }
  }
}

export function transactions(w: Pick<SimWorld, 'receipts' | 'cases'>): Transaction[] {
  return [
    ...w.receipts.map((r) => ({ ref: `deposit:${r.id}`, kind: 'masuk' as const, name: r.name, fund: r.fund, amount: r.nominal, at: r.at, hash: r.hash })),
    ...w.cases
      .filter((c) => c.stage === 'terbit' && c.hash)
      .map((c) => ({ ref: `case:${c.id}`, kind: 'keluar' as const, name: c.name, fund: 'zakat' as const, amount: c.nominal, at: c.updatedAt, hash: c.hash! })),
  ].sort((a, b) => b.at - a.at);
}

export function viewFor(w: SimWorld, me: Actor, now = Date.now()): SimView {
  const notices = w.notices
    .filter((n) => n.role === me.role)
    .map((n) => ({ ...n, read: n.done || n.readBy.includes(me.id) }))
    .sort((a, b) => b.at - a.at);
  return {
    me,
    funds: w.funds,
    deposits: w.deposits,
    requests: w.requests,
    cases: [...w.cases].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 60),
    receipts: [...w.receipts].sort((a, b) => b.at - a.at).slice(0, 40),
    transactions: transactions(w).slice(0, 30),
    audit: w.audit.slice(-60).reverse(),
    auditTotal: w.audit.length,
    notices: notices.slice(0, 40),
    unread: notices.filter((n) => !n.read).length,
    scores: Object.values(w.scores),
    brokenAt: verifyChain(w.audit),
    layout: normalizeLayout(w.layouts?.[me.id]),
    insights: insights(w, now),
    serverTime: now,
  };
}
