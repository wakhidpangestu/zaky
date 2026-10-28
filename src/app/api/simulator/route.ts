import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { sameOrigin } from '@/lib/office/model';
import { OfficeHttpError, officeJson, readOfficeJson } from '@/lib/office/http';
import { DASHBOARD_CARDS, simRole, type Actor, type SimAction } from '@/lib/office/simulator';
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

// The demo login carries the role; nothing from the browser decides who may act.
async function actor(): Promise<Actor> {
  const s = await getSession();
  if (!s) throw new OfficeHttpError(401, 'Masuk dulu untuk membuka simulator.');
  return { id: s.userId, nama: s.nama, unitId: s.unitId, role: simRole(s) };
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
    const me = await actor();
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
