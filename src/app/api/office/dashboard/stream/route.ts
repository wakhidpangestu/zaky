import { getOfficeActor, reloadActor } from '@/lib/office/workflow-server';
import { officeFailure } from '@/lib/office/http';
import { snapshotStream } from '@/lib/office/snapshot-stream';
import { liveRevision } from '@/lib/office/live-dashboard';

/**
 * Change feed for the dashboard: every 2 s it sends the database revision; the browser
 * refetches /api/office/dashboard only when the revision moves.
 */
export async function GET(request: Request) {
  try {
    let actor = await getOfficeActor();
    return new Response(
      snapshotStream({
        signal: request.signal,
        intervalMs: 2000,
        read: async () => {
          actor = await reloadActor(actor);
          return { revision: await liveRevision(actor.lembagaId) };
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'private, no-store, no-transform',
          Vary: 'Cookie',
          'X-Accel-Buffering': 'no',
        },
      },
    );
  } catch (error) {
    return officeFailure(error);
  }
}
