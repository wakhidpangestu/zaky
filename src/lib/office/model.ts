/** Read-only view model. Never use this projection as server authorization. */
export type ViewMode = 'standard' | '3d';
export type StationId = 'penerimaan' | 'saksi' | 'persetujuan' | 'penyaluran' | 'catatan';
export interface OfficeUser { userId?: string; lembagaId?: string; nama: string; email?: string; peran: string; unitName?: string }
export interface Station { id: StationId; title: string; role: string; path: string; description: string; position: [number, number, number] }
export const STATIONS: Station[] = [
  { id:'penerimaan', title:'Meja Penerimaan', role:'Amil pelayanan', path:'/penerimaan/buat', description:'Catat muzakki dan zakat masuk menggunakan formulir asli.', position:[-5,0,-2.8] },
  { id:'saksi', title:'Meja Saksi', role:'Amil lintas unit', path:'/penyaluran', description:'Periksa konfirmasi yang membutuhkan dua saksi independen.', position:[0,0,-2.8] },
  { id:'persetujuan', title:'Meja Persetujuan', role:'Penyetuju', path:'/persetujuan', description:'Tinjau penyaluran yang sudah dikonfirmasi.', position:[5,0,-2.8] },
  { id:'penyaluran', title:'Meja Penyaluran', role:'Amil penyalur', path:'/penyaluran/buat', description:'Siapkan draf, tujuan, nominal, penerima, dan bukti.', position:[4,0,2.5] },
  { id:'catatan', title:'Layar Catatan', role:'Pencatatan dan pemantauan', path:'/penyaluran', description:'Lihat riwayat, verifikasi kode, dan papan silang.', position:[-4.5,0,2.5] },
];
export const WORK_TOOLS = [
  {label:'Penerimaan',path:'/penerimaan'}, {label:'Penyaluran',path:'/penyaluran'},
  {label:'Persetujuan',path:'/persetujuan'}, {label:'Papan silang',path:'/silang'},
  {label:'Verifikasi kode',path:'/verifikasi'}, {label:'Profil',path:'/profil'}, {label:'Dokumentasi',path:'/docs'},
];
export const STATUS_LABELS: Record<string,string> = {
  dibuat:'Draf', menunggu_konfirmasi:'Menunggu konfirmasi', dikonfirmasi:'Menunggu persetujuan',
  disetujui:'Disetujui - periksa kelanjutan', tersalurkan:'Tersalurkan',
  ditolak_penerima:'Ditolak penerima', dibatalkan:'Dibatalkan', kedaluwarsa:'Kedaluwarsa',
};
export interface OfficeTask {
  id: string; code: string; station: StationId; status: string; label: string; destination: string;
  amount: number; done: boolean; terminal: boolean; method: string; creator: string; creatorUnit: string;
  witnessNames: string[]; witnessUnits: string[]; path: string;
}
const terminalStates = new Set(['tersalurkan','ditolak_penerima','dibatalkan','kedaluwarsa']);
const str = (v: unknown): string => typeof v === 'string' ? v : '';
export function parseMode(v: unknown): ViewMode | null { return v === 'standard' || v === '3d' ? v : null; }
export function demoUnit(id: string): string | undefined {
  // Display adapter only: legacy session IDs differ from the SQL seed UUIDs.
  return ({
    'u1111111-1111-1111-1111-111111111111':'Unit Pelayanan',
    'u2222222-2222-2222-2222-222222222222':'Unit Keuangan',
    'u3333333-3333-3333-3333-333333333333':'Unit Penyaluran',
    'u4444444-4444-4444-4444-444444444444':'Unit Pengawasan',
  } as Record<string,string>)[id];
}
export function projectTasks(input: unknown): OfficeTask[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  return input.flatMap((value): OfficeTask[] => {
    if (!value || typeof value !== 'object') return [];
    const r = value as Record<string,unknown>;
    const id = str(r.id), code = str(r.kodeUnik), status = str(r.status);
    if (!['mustahik','saksi'].includes(str(r.metode)) || !id || seen.has(id) ||
      !/^[A-Z0-9]{12}$/.test(code) || !Object.hasOwn(STATUS_LABELS,status) ||
      typeof r.nominal !== 'number' || !Number.isFinite(r.nominal) || r.nominal <= 0) return [];
    seen.add(id);
    const terminal = terminalStates.has(status);
    const station: StationId = terminal ? 'catatan' : status === 'dikonfirmasi' ? 'persetujuan' :
      (status === 'menunggu_konfirmasi' || status === 'dibuat') && r.metode === 'saksi' ? 'saksi' : 'penyaluran';
    return [{ id, code, status, station, label:STATUS_LABELS[status], destination:str(r.kabupaten), amount:r.nominal,
      done:status === 'tersalurkan', terminal, method:str(r.metode), creator:str(r.dibuatOleh), creatorUnit:str(r.dibuatUnit),
      witnessNames:[str(r.saksi1Nama),str(r.saksi2Nama)].filter(Boolean),
      witnessUnits:[str(r.saksi1Unit),str(r.saksi2Unit)].filter(Boolean),
      path:station === 'persetujuan' ? '/persetujuan' : '/penyaluran' }];
  });
}
/** Task visibility, not permission. Browser-demo handlers are not production RBAC. */
export function assignedTo(t: OfficeTask, u: OfficeUser): boolean {
  if (t.terminal || !u.nama) return false;
  if (t.station === 'saksi' || t.station === 'persetujuan') {
    if (!u.unitName || !t.creatorUnit || u.unitName === t.creatorUnit || u.nama === t.creator ||
      t.witnessNames.includes(u.nama) || t.witnessUnits.includes(u.unitName)) return false;
    return t.station === 'saksi' ? u.peran === 'amil' && t.witnessNames.length < 2 : u.peran === 'penyetuju';
  }
  return t.status === 'dibuat' && t.creator === u.nama && u.peran === 'amil';
}
export function taskProgress(status: string): number {
  return ({dibuat:20,menunggu_konfirmasi:40,dikonfirmasi:70,disetujui:85,tersalurkan:100} as Record<string,number>)[status] ?? 0;
}
export function isAllowedWorkPath(path: string): boolean {
  return [...WORK_TOOLS.map(t=>t.path),'/penerimaan/buat','/penyaluran/buat'].includes(path);
}
export function parseChatInput(value: unknown): {text:string;clientId:string} | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const r=value as Record<string,unknown>;
  if (typeof r.text!=='string' || typeof r.clientId!=='string') return null;
  const text=r.text.trim();
  if (!text || text.length>1000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(r.clientId)) return null;
  return {text,clientId:r.clientId};
}
export function sameOrigin(configured: string | undefined, actual: string | null): boolean {
  if (!configured || !actual) return false;
  try { const a=new URL(configured),b=new URL(actual); return ['https:','http:'].includes(a.protocol) && a.origin===b.origin && b.origin===actual; }
  catch { return false; }
}
