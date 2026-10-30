'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Notice, SimAction, SimRole, SimView } from '@/lib/office/simulator';

export type Result = { ok: boolean; message: string };
export interface SimContext {
  view: SimView | null;
  error: string;
  /** Increments whenever an unread notification arrives that this tab had not seen. */
  pulse: number;
  latest: Notice | null;
  /** True while the live stream is connected; otherwise data is refreshed by polling. */
  live: boolean;
  act: (action: SimAction, role?: SimRole, witnessNum?: number) => Promise<Result>;
  refresh: () => Promise<void>;
}
export const Ctx = createContext<SimContext | null>(null);
const FALLBACK_POLL_MS = 15_000;

/** One shared connection to the office for the navbar, dashboard and simulator. */
export function SimProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<SimView | null>(null),
    [error, setError] = useState(''),
    [live, setLive] = useState(false),
    [pulse, setPulse] = useState(0),
    [latest, setLatest] = useState<Notice | null>(null);
  const loading = useRef<Promise<void> | null>(null),
    again = useRef(false),
    seenTop = useRef<number | null>(null);

  const accept = useCallback((v: SimView) => {
    const top = v.notices.find((n) => !n.read);
    // The first load only sets the baseline; later arrivals ring the bell.
    if (top && seenTop.current !== null && top.id > seenTop.current) {
      setPulse((p) => p + 1);
      setLatest(top);
    }
    seenTop.current = Math.max(seenTop.current ?? 0, top?.id ?? 0);
    setView(v);
  }, []);

  const refresh = useCallback(async () => {
    // Coalesce bursts of change events into at most one extra request.
    if (loading.current) {
      again.current = true;
      return loading.current;
    }
    loading.current = (async () => {
      do {
        again.current = false;
        try {
          const res = await fetch('/api/simulator', { cache: 'no-store' });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body.error ?? 'Data kantor belum dapat dimuat.');
          accept(body as SimView);
          setError('');
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Data kantor belum dapat dimuat.');
        }
      } while (again.current);
    })();
    try {
      await loading.current;
    } finally {
      loading.current = null;
    }
  }, [accept]);

  const act = useCallback(async (action: SimAction, role?: SimRole, witnessNum?: number): Promise<Result> => {
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (role) headers['x-sim-role'] = role;
      if (witnessNum) headers['x-sim-witness'] = String(witnessNum);
      const res = await fetch('/api/simulator', {
        method: 'POST',
        headers,
        body: JSON.stringify(action),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, message: body.error ?? 'Tindakan gagal.' };
      accept(body.view);
      return body.result;
    } catch {
      return { ok: false, message: 'Koneksi ke kantor terputus. Coba lagi.' };
    }
  }, [accept]);

  useEffect(() => {
    let source: EventSource | null = null,
      poll = 0;
    const connect = () => {
      source = new EventSource('/api/simulator/stream');
      source.onopen = () => setLive(true);
      source.onmessage = () => void refresh();
      // EventSource reconnects by itself; meanwhile fall back to polling.
      source.onerror = () => setLive(false);
    };
    connect();
    refresh();
    poll = window.setInterval(() => {
      if (source?.readyState !== EventSource.OPEN && !document.hidden) void refresh();
    }, FALLBACK_POLL_MS);
    const visible = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener('visibilitychange', visible);
    return () => {
      source?.close();
      clearInterval(poll);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [refresh]);

  return (
    <Ctx.Provider value={{ view, error, live, pulse, latest, act, refresh }}>{children}</Ctx.Provider>
  );
}

export function useSim() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSim harus dipakai di dalam SimProvider.');
  return ctx;
}
