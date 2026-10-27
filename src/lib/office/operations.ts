import { z } from 'zod';
// PostgreSQL accepts canonical UUIDs without imposing an RFC version/variant.
const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const money = z
  .string()
  .regex(/^(0|[1-9]\d{0,15})(\.\d{1,2})?$/)
  .refine((v) => Number(v) > 0);
const percent = z
  .string()
  .regex(/^\d{1,3}(\.\d{1,2})?$/)
  .refine((v) => Number(v) <= 100);
const base = { requestId: uuid };
const action = { ...base, itemId: uuid, version: z.number().int().min(1).max(2147483647) };
const schema = z.discriminatedUnion('kind', [
  z
    .object({
      ...base,
      kind: z.literal('receipt'),
      posId: uuid,
      gross: money,
      amilPercent: percent,
      channel: z.string().trim().min(1).max(100),
      donorType: z.enum(['anonim', 'terdaftar']).optional(),
      donorName: z.string().trim().max(160).optional(),
      note: z.string().trim().max(500).optional(),
    })
    .strict(),
  z
    .object({
      ...base,
      kind: z.literal('distribution'),
      posId: uuid,
      mustahikId: uuid,
      amount: money,
      method: z.enum(['saksi', 'mustahik']),
      evidenceId: uuid,
    })
    .strict(),
  z.object({ ...action, kind: z.literal('witness'), accept: z.boolean() }).strict(),
  z.object({ ...action, kind: z.literal('approve') }).strict(),
  z.object({ ...action, kind: z.literal('cancel') }).strict(),
]);
export type OperationInput = z.infer<typeof schema>;
export interface OperationResult {
  id: string;
  type: 'penerimaan' | 'penyaluran';
  code: string;
  status: string;
  workItemId: string;
  confirmationUrl?: string;
  createdAt?: string;
  expiresAt?: string;
}
export interface OfficeCatalog {
  recipientsHasMore: boolean;
  actor: { id: string; nama: string; peran: string };
  maxAmilPercent: string;
  funds: {
    id: string;
    nama: string;
    available: string;
    reserved: string;
    delivered: string;
    total: string;
  }[];
  recipients: { id: string; nama: string; destination: string; asnaf: string }[];
}
export function parseOperation(input: unknown): OperationInput | null {
  const r = schema.safeParse(input);
  if (!r.success) return null;
  const v = r.data;
  if (v.kind === 'receipt' && v.donorType === 'terdaftar' && !v.donorName) return null;
  return v;
}
export function formatMoney(input: string): string {
  if (!/^\d+(\.\d{1,2})?$/.test(input)) return '—';
  const [whole, part = ''] = input.split('.');
  return (
    'Rp ' +
    whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.') +
    (part && Number(part) ? ',' + part.padEnd(2, '0') : '')
  );
}
export function buildCalendar({
  code,
  title,
  deadline,
  url,
}: {
  code: string;
  title: string;
  deadline: string;
  url: string;
}): string {
  const date = new Date(deadline);
  if (!Number.isFinite(date.getTime())) throw new Error('Tenggat tidak valid.');
  const esc = (v: string) =>
    v.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
  const stamp = date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z/, 'Z');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Zaky//Tindak lanjut//ID',
    'BEGIN:VEVENT',
    'UID:' + esc(code) + '@zaky',
    'DTSTAMP:' + stamp,
    'DTSTART:' + stamp,
    'SUMMARY:' + esc(title),
    'URL:' + esc(url),
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
