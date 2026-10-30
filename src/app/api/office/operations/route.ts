import { recipientToken } from '@/lib/office/recipient-token';
import { createHash } from 'node:crypto';
import { getOfficeActor } from '@/lib/office/workflow-server';
import {
  officeJson,
  officeFailure,
  OfficeHttpError,
  readOfficeJson,
  requireOfficeOrigin,
} from '@/lib/office/http';
import { parseOperation, type OperationResult } from '@/lib/office/operations';
import { query } from '@/lib/db';
import { jwtSecretText } from '@/lib/secret';
export async function POST(request: Request) {
  try {
    requireOfficeOrigin(request, process.env.APP_URL);
    const actor = await getOfficeActor(),
      input = parseOperation(await readOfficeJson(request));
    if (!input)
      throw new OfficeHttpError(
        400,
        'Isian operasi tidak valid. Periksa nominal dan pilihan Anda.',
      );
    const { requestId, ...payload } = input;
    const token =
      input.kind === 'distribution' && input.method === 'mustahik'
        ? recipientToken(jwtSecretText(), actor.lembagaId, actor.id, requestId)
        : null;
    const result = (
      await query<{ result: OperationResult }>(
        'SELECT office_record_operation($1,$2,$3,$4) AS result',
        [
          actor.id,
          requestId,
          JSON.stringify(payload),
          token ? createHash('sha256').update(token).digest() : null,
        ],
      )
    ).rows[0].result;
    if (token) result.confirmationUrl = '/konfirmasi/' + token + '?record=' + result.id;
    return officeJson(result);
  } catch (e) {
    if (e instanceof OfficeHttpError) return officeFailure(e);
    if (
      e instanceof Error &&
      /SALDO|BALANCE|HAK_AMIL|TOKEN_|METODE|Asnaf|Mustahik|Nominal|Pos dana|status saat ini/i.test(
        e.message,
      )
    )
      return officeJson(
        {
          error:
            'Prasyarat transaksi belum terpenuhi. Periksa saldo, batas hak amil, metode, atau status terkini.',
        },
        409,
      );
    return officeFailure(e);
  }
}
