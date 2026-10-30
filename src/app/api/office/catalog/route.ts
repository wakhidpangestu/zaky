import { getOfficeActor } from '@/lib/office/workflow-server';
import { officeCatalog } from '@/lib/office/record-server';
import { officeJson, officeFailure } from '@/lib/office/http';
export async function GET(request: Request) {
  try {
    return officeJson(
      await officeCatalog(
        await getOfficeActor(),
        new URL(request.url).searchParams.get('q')?.trim().slice(0, 100) ?? '',
      ),
    );
  } catch (e) {
    return officeFailure(e);
  }
}
