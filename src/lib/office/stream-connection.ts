/** Lifecycle for an authenticated snapshot stream, including explicit server interruptions. */
export function connectSnapshotStream<T>(options: {
  refresh: () => Promise<boolean>;
  open: () => {
    readyState: number;
    close(): void;
    onerror: ((event: Event) => void) | null;
    addEventListener(type: string, listener: (event: Event) => void): void;
  };
  active: () => boolean;
  state: (value: 'loading' | 'live' | 'reconnecting' | 'paused') => void;
  snapshot: (value: T) => void;
  schedule?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  cancel?: (timer: ReturnType<typeof setTimeout>) => void;
}) {
  let disposed = false;
  let generation = 0;
  let failures = 0;
  let stream: ReturnType<typeof options.open> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = options.schedule ?? setTimeout;
  const cancel = options.cancel ?? clearTimeout;
  function clear() {
    generation++;
    if (timer !== undefined) cancel(timer);
    timer = undefined;
    stream?.close();
    stream = undefined;
  }
  function retry() {
    if (disposed || timer !== undefined) return;
    if (!options.active()) {
      options.state('paused');
      return;
    }
    options.state('reconnecting');
    timer = schedule(
      () => {
        timer = undefined;
        void connect();
      },
      Math.min(1000 * 2 ** failures++, 30000),
    );
  }
  async function connect() {
    clear();
    if (disposed) return;
    if (!options.active()) {
      options.state('paused');
      return;
    }
    const current = generation;
    options.state(failures ? 'reconnecting' : 'loading');
    const ok = await options.refresh();
    if (disposed || current !== generation) return;
    if (!ok) {
      retry();
      return;
    }
    if (!options.active()) {
      options.state('paused');
      return;
    }
    try {
      const source = options.open();
      stream = source;
      const valid = () => !disposed && generation === current && stream === source;
      source.addEventListener('snapshot', (event) => {
        if (!valid()) return;
        try {
          options.snapshot(JSON.parse((event as MessageEvent).data) as T);
          failures = 0;
          options.state('live');
        } catch {
          source.close();
          stream = undefined;
          retry();
        }
      });
      source.addEventListener('unavailable', () => {
        if (!valid()) return;
        source.close();
        stream = undefined;
        retry();
      });
      source.onerror = () => {
        if (!valid()) return;
        options.state('reconnecting');
        // Native EventSource retries CONNECTING; CLOSED needs a new authenticated connection.
        if (source.readyState === 2) {
          source.close();
          stream = undefined;
          retry();
        }
      };
    } catch {
      retry();
    }
  }
  void connect();
  return {
    resume() {
      void connect();
    },
    dispose() {
      disposed = true;
      clear();
    },
  };
}
