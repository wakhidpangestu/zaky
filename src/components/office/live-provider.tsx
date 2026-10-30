'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { LiveView } from '@/lib/office/live-dashboard';
import { normalizeLayout, type Notice, type SimAction } from '@/lib/office/simulator';
import { Ctx as SimCtx, type Result, type SimContext } from './sim-provider';

interface LiveContext extends SimContext {
  view: LiveView | null;
  /** false when the database dashboard is not available (e.g. workflow disabled). */
  available: boolean;
}
const LiveCtx = createContext<LiveContext | null>(null);
const FALLBACK_POLL_MS = 10_000;
const store = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // private mode: keep the change for this session only
    }
  },
};

/**
 * Realtime dashboard data from PostgreSQL. The server sends the database revision every
 * two seconds; the full view is refetched only when it changes, so every chart follows
 * new receipts, witnesses and approvals without a reload.
 */
export function LiveProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<LiveView | null>(null),
    [error, setError] = useState(''),
    [available, setAvailable] = useState(true),
    [live, setLive] = useState(false),
    [pulse, setPulse] = useState(0),
    [latest, setLatest] = useState<Notice | null>(null),
    [prefs, setPrefs] = useState(0);
  const revision = useRef(''),
    loading = useRef<Promise<void> | null>(null),
    again = useRef(false),
    seenUnread = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    if (loading.current) {
      again.current = true;
      return loading.current;
    }
    loading.current = (async () => {
      do {
        again.current = false;
        try {
          const res = await fetch('/api/office/dashboard', { cache: 'no-store' });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) {
            // 503: the database workflow is off; the board falls back to the simulator.
            if (res.status === 503) setAvailable(false);
            throw new Error(body.error ?? 'Data lembaga belum dapat dimuat.');
          }
          revision.current = (body as LiveView).revision;
          setRaw(body as LiveView);
          setAvailable(true);
          setError('');
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Data lembaga belum dapat dimuat.');
        }
      } while (again.current);
    })();
    try {
      await loading.current;
    } finally {
      loading.current = null;
    }
  }, []);

  useEffect(() => {
    let source: EventSource | null = null;
    const connect = () => {
      source = new EventSource('/api/office/dashboard/stream');
      source.onopen = () => setLive(true);
      source.addEventListener('snapshot', (e) => {
        try {
          const next = JSON.parse((e as MessageEvent).data).revision as string;
          if (next !== revision.current) void refresh();
        } catch {
          // ignore malformed events
        }
      });
      source.addEventListener('unavailable', () => {
        setLive(false);
        source?.close();
        // the server closed the feed after a database error; try again shortly
        window.setTimeout(connect, 5000);
      });
      source.onerror = () => setLive(false);
    };
    connect();
    void refresh();
    const poll = window.setInterval(() => {
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

  // Per-officer preferences (card layout, read notices) live in this browser.
  const view = useMemo(() => {
    if (!raw) return null;
    void prefs;
    const key = raw.me.id;
    let layout = raw.layout;
    try {
      const saved = store.get('zaky_live_layout:' + key);
      if (saved) layout = normalizeLayout(JSON.parse(saved));
    } catch {
      // keep the default layout
    }
    const read = new Set((store.get('zaky_live_read:' + key) ?? '').split('|'));
    const notices = raw.notices.map((n) => ({ ...n, read: read.has(n.message) }));
    return { ...raw, layout, notices, unread: notices.filter((n) => !n.read).length };
  }, [raw, prefs]);

  useEffect(() => {
    if (!view) return;
    // The first load sets the baseline; new pending work later rings the bell.
    if (seenUnread.current !== null && view.unread > seenUnread.current) {
      setPulse((p) => p + 1);
      setLatest(view.notices.find((n) => !n.read) ?? null);
    }
    seenUnread.current = view.unread;
  }, [view]);

  const act = useCallback(
    async (action: SimAction): Promise<Result> => {
      if (!raw) return { ok: false, message: 'Data belum dimuat.' };
      const key = raw.me.id;
      if (action.type === 'layout') {
        store.set('zaky_live_layout:' + key, JSON.stringify(action.layout));
        setPrefs((n) => n + 1);
        return { ok: true, message: 'Tata letak disimpan.' };
      }
      if (action.type === 'read') {
        const read = new Set((store.get('zaky_live_read:' + key) ?? '').split('|').filter(Boolean));
        for (const n of raw.notices) if (action.id === 'all' || n.id === action.id) read.add(n.message);
        store.set('zaky_live_read:' + key, [...read].join('|'));
        setPrefs((n) => n + 1);
        return { ok: true, message: 'Ditandai terbaca.' };
      }
      return { ok: false, message: 'Tindakan ini dilakukan dari halaman kerja.' };
    },
    [raw],
  );

  return (
    <LiveCtx.Provider value={{ view, error, live, pulse, latest, act, refresh, available }}>
      {children}
    </LiveCtx.Provider>
  );
}

/**
 * Dashboard data: the institution's database when available, otherwise the simulator
 * (e.g. when the workflow is switched off), so the board always renders something true.
 */
export function useDashboardData(): SimContext & { source: 'database' | 'simulator' } {
  const liveCtx = useContext(LiveCtx);
  const simCtx = useContext(SimCtx);
  if (liveCtx && liveCtx.available) return { ...liveCtx, source: 'database' };
  if (!simCtx) throw new Error('useDashboardData harus dipakai di dalam SimProvider.');
  return { ...simCtx, source: 'simulator' };
}
