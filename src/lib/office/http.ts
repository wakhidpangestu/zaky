import { sameOrigin } from './model.ts';
export class OfficeHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export const officeJson = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
  });
export function requireOfficeOrigin(request: Request, configured: string | undefined) {
  if (!sameOrigin(configured, request.headers.get('origin')))
    throw new OfficeHttpError(403, 'Asal permintaan tidak diizinkan. Periksa APP_URL.');
}
export async function readOfficeJson(request: Request): Promise<unknown> {
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
  )
    throw new OfficeHttpError(415, 'Gunakan JSON.');
  const bytes = await readOfficeBytes(request, 8192);
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new OfficeHttpError(400, 'JSON tidak valid.');
  }
}
export async function readOfficeBytes(request: Request, limit: number): Promise<Uint8Array> {
  const reader = request.body?.getReader();
  if (!reader) throw new OfficeHttpError(400, 'Data kosong.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new OfficeHttpError(413, 'Data terlalu besar.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
const errors: Record<string, [number, string]> = {
  ACCOUNT_INACTIVE: [401, 'Akun atau lembaga sudah tidak aktif.'],
  NOT_FOUND: [404, 'Pekerjaan tidak ditemukan.'],
  VERSION_CONFLICT: [
    409,
    'Tugas sudah berubah. Antrean dimuat ulang; periksa penanggung jawab terbaru.',
  ],
  REQUEST_CONFLICT: [409, 'ID permintaan sudah dipakai untuk tindakan berbeda.'],
  ALREADY_ASSIGNED: [409, 'Tugas sudah diambil petugas lain.'],
  TERMINAL: [409, 'Proses sudah berakhir.'],
  OWNER_REQUIRED: [403, 'Hanya penanggung jawab yang dapat menyerahkan tugas.'],
  INELIGIBLE: [403, 'Akun atau unit tidak memenuhi syarat penanganan tugas ini.'],
  SESSION_OWNER: [403, 'Sesi presence dimiliki akun lain.'],
  INVALID_INPUT: [400, 'Data tindakan tidak valid.'],
  RATE_LIMIT: [429, 'Terlalu banyak permintaan. Coba lagi nanti.'],
  FORBIDDEN: [403, 'Peran ini tidak berwenang menjalankan tindakan tersebut.'],
  EVIDENCE_NOT_FOUND: [400, 'Bukti tidak ditemukan atau bukan milik akun ini.'],
};
export function officeFailure(error: unknown): Response {
  // Next.js control-flow signals (prerender bail-outs, notFound, redirects) carry a `digest`
  // and must keep propagating; application and database errors never have one.
  if (error instanceof Error && 'digest' in error) throw error;
  if (error instanceof OfficeHttpError) return officeJson({ error: error.message }, error.status);
  const key = error instanceof Error ? error.message : '';
  if (errors[key]) return officeJson({ error: errors[key][1] }, errors[key][0]);
  console.error(
    'Office workflow unavailable',
    error instanceof Error ? error.name : 'UnknownError',
  );
  return officeJson(
    { error: 'Workflow belum tersedia. Periksa koneksi database dan migrasi 005.' },
    503,
  );
}
