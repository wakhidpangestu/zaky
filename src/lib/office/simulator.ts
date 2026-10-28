/**
 * Zaky Simulator: a shared training office. Names and amounts are invented by the demo server
 * (see sim-world.ts); nothing here touches institution records. This module is safe for the
 * browser: types, role rules and movement.
 */
import type { StationId } from './model.ts';
import { ROOM_SPACING } from './journey.ts';

export const STATION_ORDER: StationId[] = [
  'penerimaan',
  'penyaluran',
  'saksi',
  'persetujuan',
  'catatan',
];
export const ASNAF = [
  'Fakir',
  'Miskin',
  'Amil',
  'Mualaf',
  'Riqab',
  'Gharimin',
  'Fisabilillah',
  'Ibnu sabil',
];
export const AMIL_LIMIT = { zakat: 12.5, infak: 20 } as const;
export const WITNESSES_NEEDED = 2;
export const PELAYANAN_UNIT = 'u1111111-1111-1111-1111-111111111111';

export type Fund = 'zakat' | 'infak';
export type SimRole = 'petugas' | 'saksi' | 'penyetuju' | 'pengamat';
export const ROLE_LABEL: Record<SimRole, string> = {
  petugas: 'Petugas pelayanan',
  saksi: 'Saksi independen',
  penyetuju: 'Penyetuju',
  pengamat: 'Pengamat',
};
/** Which role works at each desk. The record screen is a report everyone can read. */
export const STATION_ROLE: Record<StationId, SimRole | null> = {
  penerimaan: 'petugas',
  penyaluran: 'petugas',
  saksi: 'saksi',
  persetujuan: 'penyetuju',
  catatan: null,
};

/** Demo mapping: the service unit receives and drafts; other amil units witness. */
export function simRole(user: { peran: string; unitId?: string }): SimRole {
  if (user.peran === 'penyetuju') return 'penyetuju';
  if (user.peran === 'amil') return user.unitId === PELAYANAN_UNIT ? 'petugas' : 'saksi';
  return 'pengamat';
}

export interface Actor {
  id: string;
  nama: string;
  unitId: string;
  role: SimRole;
}
export interface Deposit {
  id: number;
  name: string;
  jenis: 'Zakat mal' | 'Zakat fitrah' | 'Infak';
  nominal: number;
  at: number;
}
export interface Request {
  id: number;
  name: string;
  asnaf: string;
  registered: boolean;
  evidence: boolean;
  nominal: number;
  at: number;
}
export type CaseStage = 'saksi' | 'persetujuan' | 'terbit' | 'ditolak' | 'dikembalikan';
export interface CaseEvent {
  at: number;
  actor: string;
  role: SimRole;
  action: string;
  ok: boolean;
}
export interface Case {
  id: number;
  name: string;
  asnaf: string;
  nominal: number;
  receiptNominal: number;
  signed: boolean;
  confirmedNominal: number;
  stage: CaseStage;
  maker: { id: string; nama: string };
  witnesses: { id: string; nama: string; unitId: string }[];
  approver?: string;
  createdAt: number;
  updatedAt: number;
  code?: string;
  hash?: string;
  history: CaseEvent[];
}
export interface Receipt {
  id: number;
  name: string;
  jenis: Deposit['jenis'];
  fund: Fund;
  nominal: number;
  amil: number;
  by: string;
  at: number;
  hash: string;
}
export interface Notice {
  id: number;
  role: SimRole;
  ref: string;
  message: string;
  at: number;
  readBy: string[];
  done: boolean;
}
export interface AuditEntry {
  seq: number;
  at: number;
  actor: string;
  role: SimRole | 'sistem';
  action: string;
  ref: string;
  detail: string;
  prevHash: string;
  hash: string;
}
export interface Transaction {
  ref: string;
  kind: 'masuk' | 'keluar';
  name: string;
  fund: Fund;
  amount: number;
  at: number;
  hash: string;
}
export interface Funds {
  zakat: number;
  infak: number;
  amil: number;
  reserved: number;
  distributed: number;
}
export interface Score {
  nama: string;
  role: SimRole;
  correct: number;
  wrong: number;
}
/** What one signed-in account receives from the server. */
export interface SimView {
  me: Actor;
  funds: Funds;
  deposits: Deposit[];
  requests: Request[];
  cases: Case[];
  receipts: Receipt[];
  transactions: Transaction[];
  audit: AuditEntry[];
  auditTotal: number;
  notices: (Notice & { read: boolean })[];
  unread: number;
  scores: Score[];
  /** 0 when every audit hash links to the previous one, else the first broken entry. */
  brokenAt: number;
  layout: DashboardLayout;
  insights: Insights;
  serverTime: number;
}
/** Dashboard figures, computed on the server from the whole office history. */
export interface Insights {
  daily: { day: number; masuk: number; keluar: number }[];
  hourly: { masuk: number[][]; keluar: number[][] };
  activity: { week: number; prevWeek: number };
  asnaf: { name: string; values: [number, number, number] }[];
  periods: { label: string; keluar: number; prev: number; masuk: number; infak: number; zakat: number }[];
  weekday: { masuk: number[]; keluar: number[] };
  roles: Record<'petugas' | 'saksi' | 'penyetuju', number>;
  counts: { masuk: number; keluar: number; amil: number };
}
/** Hours and weekdays are reported in WIB. */
export const WIB = 7 * 36e5;
/** Dashboard cards, in their default order. */
export const DASHBOARD_CARDS = [
  'saldo',
  'dana-masuk',
  'aktivitas',
  'tugas',
  'transaksi',
  'asnaf',
  'ritme',
  'audit',
  'tim',
  'akses',
] as const;
export type CardId = (typeof DASHBOARD_CARDS)[number];
export interface DashboardLayout {
  order: CardId[];
  hidden: CardId[];
}
export type SimAction =
  | { type: 'receive'; id: number; fund: Fund }
  | { type: 'distribute'; id: number; choice: 'draft' | 'reject' }
  | { type: 'witness'; id: number; choice: 'confirm' | 'reject' }
  | { type: 'approve'; id: number; choice: 'approve' | 'return' }
  | { type: 'read'; id: number | 'all' }
  | { type: 'layout'; layout: DashboardLayout };

/** Keeps known cards only, each once, and appends cards added after the layout was saved. */
export function normalizeLayout(layout: DashboardLayout | null | undefined): DashboardLayout {
  const known = new Set<string>(DASHBOARD_CARDS);
  const order = [...new Set((layout?.order ?? []).filter((c) => known.has(c)))];
  for (const c of DASHBOARD_CARDS) if (!order.includes(c)) order.push(c);
  return { order, hidden: [...new Set((layout?.hidden ?? []).filter((c) => known.has(c)))] };
}

export function fundFor(jenis: Deposit['jenis']): Fund {
  return jenis === 'Infak' ? 'infak' : 'zakat';
}
export function amilShare(nominal: number, fund: Fund) {
  return Math.floor((nominal * AMIL_LIMIT[fund]) / 100);
}
export function requestProblem(r: Request, saldoZakat: number) {
  if (!ASNAF.includes(r.asnaf)) return `${r.asnaf} tidak termasuk delapan asnaf.`;
  if (!r.registered) return `${r.name} belum terdaftar sebagai mustahik.`;
  if (!r.evidence) return 'Berkas bukti belum dilampirkan.';
  if (r.nominal > saldoZakat) return 'Saldo pos zakat tidak cukup.';
  return null;
}
export function evidenceProblem(c: Pick<Case, 'nominal' | 'receiptNominal' | 'signed'>) {
  if (c.receiptNominal !== c.nominal) return 'Nominal tanda terima berbeda dengan draf.';
  if (!c.signed) return 'Tanda terima belum ditandatangani penerima.';
  return null;
}

/** Work waiting at a desk for this account (zero for desks of other roles). */
export function myQueue(view: SimView, station: StationId) {
  if (STATION_ROLE[station] !== view.me.role) return 0;
  return {
    penerimaan: view.deposits.length,
    penyaluran: view.requests.length,
    saksi: view.cases.filter(
      (c) => c.stage === 'saksi' && !c.witnesses.some((w) => w.id === view.me.id),
    ).length,
    persetujuan: view.cases.filter((c) => c.stage === 'persetujuan').length,
    catatan: 0,
  }[station];
}
/** Everything that has happened at a desk, for the shared reports. */
export function deskReport(view: SimView, station: StationId) {
  switch (station) {
    case 'penerimaan':
      return view.receipts;
    case 'penyaluran':
      return view.cases;
    case 'saksi':
      return view.cases.filter((c) => c.witnesses.length > 0 || c.stage !== 'saksi');
    case 'persetujuan':
      return view.cases.filter((c) => c.approver);
    case 'catatan':
      return view.cases.filter((c) => c.stage === 'terbit');
  }
}

// ---- Movement inside the five rooms (x along rooms, z from desk to front). ----
export interface Walker {
  player: { x: number; z: number; facing: number; moving: boolean };
  target: { x: number; z: number } | null;
}
export const DESK_FRONT: Record<StationId, { x: number; z: number }> = Object.fromEntries(
  STATION_ORDER.map((id, i) => [id, { x: i * ROOM_SPACING, z: 0.6 }]),
) as Record<StationId, { x: number; z: number }>;
const BOUNDS = { minX: -6.2, maxX: 4 * ROOM_SPACING + 6.2, minZ: -0.15, maxZ: 4.7 };
const DOOR = { minZ: 2.3, maxZ: 3.8 },
  DOOR_LANE = 3.05;

export function createWalker(): Walker {
  return { player: { x: -4.5, z: 3, facing: Math.PI, moving: false }, target: null };
}

/** True where the walls between rooms stand; the side door is the only way through. */
export function blocked(x: number, z: number) {
  if (x < BOUNDS.minX || x > BOUNDS.maxX || z < BOUNDS.minZ || z > BOUNDS.maxZ) return true;
  for (let k = 0; k <= 4; k++) {
    if (k && Math.abs(x - (k * ROOM_SPACING - 6.95)) < 0.45 && !(z > DOOR.minZ && z < DOOR.maxZ))
      return true;
    // Potted plant near each room's front-left corner.
    if (Math.hypot(x - (k * ROOM_SPACING - 5), z - 3.5) < 0.38) return true;
  }
  return false;
}

/** Moves the player, sliding along walls; `dir` need not be normalised. */
export function walk(state: Walker, dx: number, dz: number, distance: number) {
  const len = Math.hypot(dx, dz);
  const p = state.player;
  if (!len || !(distance > 0)) {
    p.moving = false;
    return;
  }
  const sx = (dx / len) * distance,
    sz = (dz / len) * distance;
  if (!blocked(p.x + sx, p.z)) p.x += sx;
  if (!blocked(p.x, p.z + sz)) p.z += sz;
  p.facing = Math.atan2(sx, sz);
  p.moving = true;
}

/** Step towards the click target, routing through the side door when changing rooms. */
export function walkToTarget(state: Walker, distance: number) {
  const t = state.target,
    p = state.player;
  if (!t) return;
  let gx = t.x,
    gz = t.z;
  const room = (x: number) => Math.round(x / ROOM_SPACING);
  if (room(p.x) !== room(t.x)) {
    // Line up with the doorways first, then walk straight through them.
    gz = DOOR_LANE;
    gx = Math.abs(p.z - DOOR_LANE) > 0.1 ? p.x : t.x;
  }
  const d = Math.hypot(gx - p.x, gz - p.z);
  if (d < 0.08 && gx === t.x && gz === t.z) {
    state.target = null;
    p.moving = false;
    return;
  }
  const before = { x: p.x, z: p.z };
  walk(state, gx - p.x, gz - p.z, Math.min(distance, d));
  // Give up on targets behind furniture or walls instead of pushing forever.
  if (Math.hypot(p.x - before.x, p.z - before.z) < 1e-4) {
    state.target = null;
    p.moving = false;
  }
}

/** Clamps a clicked point to the walkable floor. */
export function floorTarget(x: number, z: number) {
  return {
    x: Math.min(BOUNDS.maxX - 0.1, Math.max(BOUNDS.minX + 0.1, x)),
    z: Math.min(BOUNDS.maxZ - 0.1, Math.max(BOUNDS.minZ + 0.1, z)),
  };
}

export function nearStation(state: Walker): StationId | null {
  for (const id of STATION_ORDER) {
    const d = DESK_FRONT[id];
    if (Math.hypot(state.player.x - d.x, state.player.z - d.z) < 2.2) return id;
  }
  return null;
}

/** Queue slot in front of a desk for the n-th visitor. */
export function queueSlot(station: StationId, n: number) {
  const d = DESK_FRONT[station];
  return { x: d.x - 1.7 - (n % 2) * 0.1, z: d.z + 0.5 + n * 0.85 };
}
