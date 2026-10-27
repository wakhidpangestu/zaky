import { getOfficeActor } from '@/lib/office/workflow-server';
import { officeFailure, OfficeHttpError } from '@/lib/office/http';
import { isUuid } from '@/lib/office/workflow';
import { query } from '@/lib/db';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getOfficeActor(),
      { id } = await params;
    if (!isUuid(id)) throw new OfficeHttpError(400, 'ID bukti tidak valid.');
    const row = (
      await query<{ filename: string; mime: string; bytes: Buffer }>(
        'SELECT filename,mime,bytes FROM office_evidence WHERE id=$1 AND lembaga_id=$2',
        [id, actor.lembagaId],
      )
    ).rows[0];
    if (!row) throw new OfficeHttpError(404, 'Bukti tidak ditemukan.');
    return new Response(new Uint8Array(row.bytes), {
      headers: {
        'Content-Type': row.mime,
        'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(row.filename),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        Vary: 'Cookie',
      },
    });
  } catch (e) {
    return officeFailure(e);
  }
}
