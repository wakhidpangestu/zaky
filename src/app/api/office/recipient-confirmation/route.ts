import { createHash } from 'node:crypto';
import { query } from '@/lib/db';
import { requireEnabled } from '@/lib/office/workflow-server';
import {
  OfficeHttpError,
  officeJson,
  officeFailure,
  readOfficeJson,
  requireOfficeOrigin,
} from '@/lib/office/http';
import { isUuid } from '@/lib/office/workflow';
function check(token: unknown, id: unknown) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token) || !isUuid(id))
    throw new OfficeHttpError(404, 'Tautan konfirmasi tidak valid.');
  return createHash('sha256').update(token).digest();
}
export async function GET(request: Request) {
  try {
    requireEnabled();
    const u = new URL(request.url),
      id = u.searchParams.get('record'),
      hash = check(u.searchParams.get('token'), id);
    const row = (
      await query(
        `SELECT p.id,p.kode_unik::text AS code,p.nominal::text AS amount,p.status,p.kedaluwarsa_pada AS "expiresAt",k.hasil AS decision FROM penyaluran p JOIN konfirmasi k ON k.penyaluran_id=p.id AND k.jenis='mustahik' WHERE p.id=$1 AND k.token_hash=$2`,
        [id, hash],
      )
    ).rows[0];
    if (!row) throw new OfficeHttpError(404, 'Tautan konfirmasi tidak valid.');
    return officeJson(row);
  } catch (e) {
    return officeFailure(e);
  }
}
export async function POST(request: Request) {
  try {
    requireEnabled();
    requireOfficeOrigin(request, process.env.APP_URL);
    const body = await readOfficeJson(request);
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw new OfficeHttpError(400, 'Data konfirmasi tidak valid.');
    const r = body as Record<string, unknown>,
      hash = check(r.token, r.record);
    if (
      typeof r.accept !== 'boolean' ||
      (r.reason !== undefined && (typeof r.reason !== 'string' || r.reason.length > 500))
    )
      throw new OfficeHttpError(400, 'Keputusan tidak valid.');
    const row = (
      await query('SELECT office_confirm_recipient($1,$2,$3,$4) AS status', [
        r.record,
        hash,
        r.accept,
        r.reason ?? null,
      ])
    ).rows[0];
    return officeJson(row);
  } catch (e) {
    if (e instanceof Error && /TOKEN_|STATUS_|kedaluwarsa/i.test(e.message))
      return officeJson(
        {
          error:
            'Tautan tidak berlaku atau konfirmasi sudah diproses. Muat ulang untuk melihat status.',
        },
        409,
      );
    return officeFailure(e);
  }
}
