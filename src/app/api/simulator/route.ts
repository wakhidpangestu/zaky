import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { sameOrigin } from '@/lib/office/model';
import { OfficeHttpError, officeJson, readOfficeJson } from '@/lib/office/http';
import { DASHBOARD_CARDS, PELAYANAN_UNIT, simRole, type Actor, type SimAction, type SimRole } from '@/lib/office/simulator';
import { act, viewFor, SimError } from '@/lib/office/sim-world';
import { withWorld } from '@/lib/office/sim-store';

const action = z.discriminatedUnion('type', [
  z.object({ type: z.literal('receive'), id: z.number().int(), fund: z.enum(['zakat', 'infak']) }),
  z.object({ type: z.literal('distribute'), id: z.number().int(), choice: z.enum(['draft', 'reject']) }),
  z.object({ type: z.literal('witness'), id: z.number().int(), choice: z.enum(['confirm', 'reject']) }),
  z.object({ type: z.literal('approve'), id: z.number().int(), choice: z.enum(['approve', 'return']) }),
  z.object({ type: z.literal('read'), id: z.union([z.number().int(), z.literal('all')]) }),
  z.object({
    type: z.literal('layout'),
    layout: z.object({
      order: z.array(z.enum(DASHBOARD_CARDS)).max(DASHBOARD_CARDS.length * 2),
      hidden: z.array(z.enum(DASHBOARD_CARDS)).max(DASHBOARD_CARDS.length * 2),
    }),
  }),
]);

async function actor(request?: Request): Promise<Actor> {
  const s = await getSession();
  if (!s) throw new OfficeHttpError(401, 'Masuk dulu untuk membuka simulator.');
  let role: SimRole = simRole(s);
  let id = s.userId;
  let nama = s.nama;
  let unitId = s.unitId;

  const roleHeader = request?.headers.get('x-sim-role');
  const witnessHeader = request?.headers.get('x-sim-witness');

  if (roleHeader === 'petugas' || roleHeader === 'saksi' || roleHeader === 'penyetuju') {
    role = roleHeader;
    if (role === 'saksi') {
      const wNum = witnessHeader === '2' ? '2' : '1';
      id = `${s.userId}-saksi-${wNum}`;
      nama = s.nama.includes('Saksi') ? `${s.nama} (${wNum})` : `${s.nama} (Saksi ${wNum})`;
      unitId = `u-saksi-unit-${wNum}`;
    } else if (role === 'penyetuju') {
      id = `${s.userId}-penyetuju`;
      nama = s.nama.includes('Penyetuju') ? s.nama : `${s.nama} (Penyetuju)`;
    } else if (role === 'petugas') {
      id = `${s.userId}-petugas`;
      nama = s.nama.includes('Amil') || s.nama.includes('Petugas') ? s.nama : `${s.nama} (Petugas)`;
      unitId = PELAYANAN_UNIT;
    }
  }

  return { id, nama, unitId, role };
}

function failure(error: unknown) {
  if (error instanceof SimError || error instanceof OfficeHttpError)
    return officeJson({ error: error.message }, error.status);
  console.error('Zaky Simulator failed', error);
  return officeJson({ error: 'Simulator sedang bermasalah. Coba lagi.' }, 500);
}

export async function GET() {
  try {
    const me = await actor();
    return officeJson(await withWorld((w, now) => ({ value: viewFor(w, me, now), changed: false })));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(process.env.APP_URL ?? new URL(request.url).origin, request.headers.get('origin')))
      throw new OfficeHttpError(403, 'Asal permintaan tidak diizinkan.');
    const me = await actor(request);
    const parsed = action.safeParse(await readOfficeJson(request));
    if (!parsed.success) throw new OfficeHttpError(400, 'Tindakan simulator tidak valid.');
    return officeJson(
      await withWorld((w, now) => {
        const result = act(w, me, parsed.data as SimAction, now);
        return { value: { result, view: viewFor(w, me, now) }, changed: true };
      }),
    );
  } catch (error) {
    return failure(error);
  }
}
