/**
 * Zaky Simulator: a shared training office. Names and amounts are invented by the demo server
 * (see sim-world.ts); nothing here touches institution records. This module is safe for the
 * browser: types, role rules and movement.
 */
import type { StationId } from './model.ts';

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
/**
 * Dashboard cards, in their default order. Rows on the 12-column grid:
 * saldo | aktivitas 7 + dana-masuk 5 | asnaf 7 + ritme 5 | akses |
 * transaksi 8 + tugas 4 | audit 7 + tim 5.
 */
export const DASHBOARD_CARDS = [
  'saldo',
  'aktivitas',
  'dana-masuk',
  'asnaf',
  'ritme',
  'akses',
  'transaksi',
  'tugas',
  'audit',
  'tim',
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

/** Total tasks waiting at a desk across the whole office. */
export function stationQueue(view: SimView, station: StationId): number {
  return {
    penerimaan: view.deposits.length,
    penyaluran: view.requests.length,
    saksi: view.cases.filter((c) => c.stage === 'saksi').length,
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

// ---- Movement on one open-plan office floor ----
// Three desks along the back wall face the camera (penerimaan, penyaluran, saksi);
// two in the front row face the back (persetujuan, catatan). Every desk front opens
// onto the central aisle at z = 0, so routes go desk -> aisle -> desk and never
// cut through furniture.
export interface Walker {
  player: { x: number; z: number; facing: number; moving: boolean };
  target: { x: number; z: number } | null;
}
/** Centre of each desk on the office floor. */
export const STATION_SPOTS: Record<StationId, { x: number; z: number }> = {
  penerimaan: { x: -13, z: -6 },
  penyaluran: { x: 0, z: -6 },
  saksi: { x: 13, z: -6 },
  persetujuan: { x: -7, z: 5 },
  catatan: { x: 7, z: 5 },
};
/** Desks in the front row turn round to face the aisle. */
export const FACES_BACK: ReadonlySet<StationId> = new Set<StationId>(['persetujuan', 'catatan']);
/** Where the officer stands to work a desk: just in front of it, on the aisle side. */
export const DESK_FRONT: Record<StationId, { x: number; z: number }> = Object.fromEntries(
  STATION_ORDER.map((id) => {
    const s = STATION_SPOTS[id];
    return [id, { x: s.x, z: FACES_BACK.has(id) ? s.z - 1.6 : s.z + 1.6 }];
  }),
) as Record<StationId, { x: number; z: number }>;
export const OFFICE_BOUNDS = { minX: -19.5, maxX: 19.5, minZ: -10.8, maxZ: 10.8 };
export const AISLE_Z = 0;
/** Where a shift starts: the entrance at the front of the floor. */
export const OFFICE_ENTRANCE = { x: 0, z: 9.6 };

type Rect = { x0: number; x1: number; z0: number; z1: number };
/** Furniture footprints (desk, staff chair, shelves, waiting chairs) plus shared areas. */
export const OBSTACLES: Rect[] = [
  ...STATION_ORDER.map((id) => {
    const s = STATION_SPOTS[id];
    return FACES_BACK.has(id)
      ? { x0: s.x - 3, x1: s.x + 5.9, z0: s.z - 0.9, z1: s.z + 1.8 } // desk, officer, chairs only
      : { x0: s.x - 5.9, x1: s.x + 3, z0: s.z - 4.5, z1: s.z + 0.9 };
  }),
  // the witness desk's second table ("unit berbeda") stands front-right of it
  { x0: STATION_SPOTS.saksi.x + 2.6, x1: STATION_SPOTS.saksi.x + 4.8, z0: STATION_SPOTS.saksi.z + 1, z1: STATION_SPOTS.saksi.z + 2.8 },
  { x0: -18.6, x1: -15.4, z0: 5.6, z1: 8.4 }, // meeting table
  { x0: 15.2, x1: 18.8, z0: 5.8, z1: 8.6 }, // lounge sofa and coffee table
];
const PLANTS: [number, number][] = [
  [-19, -10.3],
  [19, -10.3],
  [-19, 10.3],
  [19, 10.3],
];

export function createWalker(): Walker {
  return { player: { ...OFFICE_ENTRANCE, facing: Math.PI, moving: false }, target: null };
}

/** True outside the floor, inside furniture, or on a potted plant. */
export function blocked(x: number, z: number) {
  const b = OFFICE_BOUNDS;
  if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) return true;
  const pad = 0.3;
  if (OBSTACLES.some((r) => x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad))
    return true;
  return PLANTS.some(([px, pz]) => Math.hypot(x - px, z - pz) < 0.6);
}

/** Moves the player, sliding along furniture; `dir` need not be normalised. */
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

/** Step towards the target, using the central aisle when the straight line would hit furniture. */
export function walkToTarget(state: Walker, distance: number) {
  const t = state.target,
    p = state.player;
  if (!t) return;
  let gx = t.x,
    gz = t.z;
  // Straight path free? Sample it; otherwise go out to the aisle, along it, then in.
  const steps = Math.ceil(Math.hypot(t.x - p.x, t.z - p.z) / 0.4);
  let clear = true;
  for (let i = 1; i < steps && clear; i++)
    clear = !blocked(p.x + ((t.x - p.x) * i) / steps, p.z + ((t.z - p.z) * i) / steps);
  if (!clear) {
    if (Math.abs(p.z - AISLE_Z) > 0.1 && Math.abs(p.x - t.x) > 0.1) {
      gx = p.x;
      gz = AISLE_Z;
    } else if (Math.abs(p.x - t.x) > 0.1) {
      gx = t.x;
      gz = AISLE_Z;
    }
  }
  const d = Math.hypot(gx - p.x, gz - p.z);
  if (d < 0.08 && gx === t.x && gz === t.z) {
    state.target = null;
    p.moving = false;
    return;
  }
  const before = { x: p.x, z: p.z };
  walk(state, gx - p.x, gz - p.z, Math.min(distance, d));
  // Give up on targets behind furniture instead of pushing forever.
  if (Math.hypot(p.x - before.x, p.z - before.z) < 1e-4) {
    state.target = null;
    p.moving = false;
  }
}

/** Clamps a clicked point to the walkable floor. */
export function floorTarget(x: number, z: number) {
  const b = OFFICE_BOUNDS;
  return {
    x: Math.min(b.maxX - 0.1, Math.max(b.minX + 0.1, x)),
    z: Math.min(b.maxZ - 0.1, Math.max(b.minZ + 0.1, z)),
  };
}

export function nearStation(state: Walker): StationId | null {
  for (const id of STATION_ORDER) {
    const d = DESK_FRONT[id];
    if (Math.hypot(state.player.x - d.x, state.player.z - d.z) < 2.2) return id;
  }
  return null;
}

/** Queue slot beside a desk front for the n-th visitor, lining up towards the aisle. */
export function queueSlot(station: StationId, n: number) {
  const d = DESK_FRONT[station],
    toAisle = FACES_BACK.has(station) ? -1 : 1;
  return { x: d.x - 1.9 - (n % 2) * 0.1, z: d.z + toAisle * (0.5 + n * 0.75) };
}
