import { createHash } from 'node:crypto';
import { getOfficeActor } from '@/lib/office/workflow-server';
import {
  officeJson,
  officeFailure,
  OfficeHttpError,
  readOfficeBytes,
  requireOfficeOrigin,
} from '@/lib/office/http';
import { MAX_EVIDENCE_BYTES, validateEvidence } from '@/lib/office/evidence';
import { getDbPool } from '@/lib/db';
export async function POST(request: Request) {
  try {
    requireOfficeOrigin(request, process.env.APP_URL);
    const actor = await getOfficeActor();
    if (actor.peran !== 'amil')
      throw new OfficeHttpError(403, 'Hanya amil yang dapat mengunggah bukti.');
    const mime = request.headers.get('content-type')?.split(';')[0] ?? '';
    let filename: string;
    try {
      filename = decodeURIComponent(request.headers.get('x-filename') ?? '');
    } catch {
      throw new OfficeHttpError(400, 'Nama berkas tidak valid.');
    }
    if (!filename || filename.length > 180 || /[\u0000-\u001f/\\]/.test(filename))
      throw new OfficeHttpError(400, 'Nama berkas wajib 1–180 karakter tanpa path.');
    const bytes = await readOfficeBytes(request, MAX_EVIDENCE_BYTES),
      error = validateEvidence(bytes, mime);
    if (error) throw new OfficeHttpError(400, error);
    const client = await getDbPool().connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        'office-evidence:' + actor.id,
      ]);
      const n = (
        await client.query<{ n: number }>(
          "SELECT count(*)::int AS n FROM office_evidence WHERE akun_id=$1 AND created_at>clock_timestamp()-interval '60 seconds'",
          [actor.id],
        )
      ).rows[0].n;
      if (n >= 10) throw new OfficeHttpError(429, 'Maksimal 10 unggahan per menit.');
      const result = await client.query(
        "INSERT INTO office_evidence(lembaga_id,akun_id,filename,mime,bytes,sha256) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,filename,encode(sha256,'hex') AS hash",
        [
          actor.lembagaId,
          actor.id,
          filename,
          mime,
          Buffer.from(bytes),
          createHash('sha256').update(bytes).digest(),
        ],
      );
      await client.query('COMMIT');
      return officeJson(result.rows[0], 201);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    return officeFailure(e);
  }
}
