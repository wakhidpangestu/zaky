import { getSession } from '@/lib/auth';
import { currentVersion, subscribe } from '@/lib/office/sim-store';

const HEARTBEAT_MS = 25_000;

/** Server-Sent Events: a small "changed" message whenever the shared office changes. */
export async function GET(request: Request) {
  if (!(await getSession())) return new Response('Masuk dulu.', { status: 401 });
  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          cleanup();
        }
      };
      send(`retry: 3000\ndata: ${JSON.stringify({ version: currentVersion() })}\n\n`);
      const unsubscribe = subscribe((version) => send(`data: ${JSON.stringify({ version })}\n\n`));
      const heartbeat = setInterval(() => send(': ping\n\n'), HEARTBEAT_MS);
      cleanup = () => {
        unsubscribe();
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
        cleanup = () => {};
      };
      request.signal.addEventListener('abort', () => cleanup());
    },
    cancel() {
      cleanup();
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'private, no-store, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
