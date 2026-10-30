import { getOfficeActor } from '@/lib/office/workflow-server';
import { officeRecord } from '@/lib/office/record-server';
import { officeJson, officeFailure, OfficeHttpError } from '@/lib/office/http';
import { isUuid } from '@/lib/office/workflow';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getOfficeActor(),
      { id } = await params;
    if (!isUuid(id)) throw new OfficeHttpError(400, 'ID catatan tidak valid.');
    return officeJson(await officeRecord(actor, id));
  } catch (e) {
    return officeFailure(e);
  }
}
