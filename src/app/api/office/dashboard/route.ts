import { getOfficeActor } from '@/lib/office/workflow-server';
import { officeFailure, officeJson } from '@/lib/office/http';
import { loadLiveView } from '@/lib/office/live-dashboard';

/** Dashboard figures and charts for the signed-in officer, read from PostgreSQL. */
export async function GET() {
  try {
    return officeJson(await loadLiveView(await getOfficeActor()));
  } catch (error) {
    return officeFailure(error);
  }
}
