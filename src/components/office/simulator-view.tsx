'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Footprints, Maximize2, Monitor, ShieldCheck } from 'lucide-react';
import { STATIONS, type StationId, type OfficeUser } from '@/lib/office/model';
import {
  DESK_FRONT,
  ROLE_LABEL,
  STATION_ORDER,
  STATION_ROLE,
  createWalker,
  floorTarget,
  myQueue,
  nearStation,
  walk,
  walkToTarget,
  type SimAction,
  type SimView,
  type Walker,
} from '@/lib/office/simulator';
import SimScene from './sim-scene';
import { useSim } from './sim-provider';
import StationPanel, { rupiah } from './sim-panels';

const SPEED = 5;
// Screen-relative directions for the isometric camera.
const KEYS: Record<string, [number, number]> = {
  w: [-0.59, -0.81],
  arrowup: [-0.59, -0.81],
  s: [0.59, 0.81],
  arrowdown: [0.59, 0.81],
  a: [-0.81, 0.59],
  arrowleft: [-0.81, 0.59],
  d: [0.81, -0.59],
  arrowright: [0.81, -0.59],
};
const title = (id: StationId) => STATIONS.find((s) => s.id === id)!.title;
type Toast = { ok: boolean; message: string };

export default function SimulatorView({ onExit }: { user: OfficeUser; onExit: () => void }) {
  // The office itself comes from the shared live connection (see SimProvider).
  const { view, error, act: send } = useSim();
  const [walkerInit] = useState(createWalker);
  const walker = useRef<Walker>(walkerInit),
    viewRef = useRef<SimView | null>(null),
    keys = useRef(new Set<string>()),
    pending = useRef<StationId | null>(null),
    since = useRef(0),
    root = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState<StationId | null>(null),
    [panel, setPanel] = useState<StationId | null>(null),
    [toast, setToast] = useState<Toast | null>(null),
    [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false);
  const panelRef = useRef(panel);
  useEffect(() => {
    panelRef.current = panel;
  }, [panel]);
  // The 3D scene reads the latest office every frame without re-rendering.
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const say = useCallback((t: Toast) => {
    setToast(t);
    window.setTimeout(() => setToast((x) => (x === t ? null : x)), 3600);
  }, []);

  async function act(action: SimAction) {
    setBusy(true);
    const result = await send(action);
    setBusy(false);
    if (action.type !== 'read' || !result.ok) say(result);
  }

  const open = useCallback((station: StationId | null) => {
    if (!station) return;
    walker.current.target = null;
    setPanel(station);
  }, []);
  const goTo = useCallback(
    (station: StationId) => {
      if (nearStation(walker.current) === station) return open(station);
      walker.current.target = { ...DESK_FRONT[station] };
      pending.current = station;
      setPanel(null);
    },
    [open],
  );

  const onFrame = useCallback(
    (seconds: number) => {
      const g = walker.current;
      if (!panelRef.current) {
        let dx = 0,
          dz = 0;
        for (const k of keys.current) {
          const d = KEYS[k];
          if (d) {
            dx += d[0];
            dz += d[1];
          }
        }
        if (dx || dz) {
          g.target = null;
          pending.current = null;
          walk(g, dx, dz, SPEED * seconds);
        } else if (g.target) {
          walkToTarget(g, SPEED * seconds);
          if (!g.target && pending.current) {
            const station = pending.current;
            pending.current = null;
            if (nearStation(g) === station) open(station);
          }
        } else g.player.moving = false;
      } else g.player.moving = false;
      since.current += seconds;
      if (since.current > 0.15) {
        since.current = 0;
        const n = nearStation(g);
        setNear((old) => (old === n ? old : n));
      }
    },
    [open],
  );

  useEffect(() => {
    const within = (e: KeyboardEvent, selector: string) =>
      e.target instanceof HTMLElement && !!e.target.closest(selector);
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'escape') {
        setPanel(null);
        return;
      }
      if (within(e, 'input, textarea, select') || panelRef.current) return;
      if (KEYS[k]) {
        keys.current.add(k);
        e.preventDefault();
      } else if (k === 'e' || ((k === 'enter' || k === ' ') && !within(e, 'button, a, summary'))) {
        e.preventDefault();
        open(nearStation(walker.current));
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const clear = () => keys.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, [open]);

  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {
      say({ ok: false, message: 'Layar penuh tidak tersedia di browser ini.' });
    }
  }

  const role = view?.me.role,
    tasks = view ? STATION_ORDER.reduce((n, s) => n + myQueue(view, s), 0) : 0;
  return (
    <div className="zo-office zo-sim" ref={root}>
      <p className="zo-demo">
        Kantor simulasi bersama: semua akun melihat antrean dan laporan yang sama. Nama dan nominal
        rekaan, tidak mengubah catatan lembaga.
      </p>
      <div className="zo-room-bar">
        <div>
          <strong>Zaky Simulator</strong>
          <span>
            {view ? `${view.me.nama} · ${ROLE_LABEL[view.me.role]}` : 'Menghubungkan ke kantor bersama...'}
          </span>
        </div>
        <div className="zo-room-controls">
          <button className="zo-icon" aria-label="Ganti layar penuh" onClick={fullscreen}>
            <Maximize2 size={18} />
          </button>
          <button className="zo-btn zo-btn-secondary" onClick={onExit}>
            <Monitor size={16} /> Standar
          </button>
        </div>
      </div>
      <div className="zo-sim-hud">
        <div>
          <small>Peran saya</small>
          <strong className="zo-sim-role">{role ? ROLE_LABEL[role] : '—'}</strong>
        </div>
        <div>
          <small>Tugas menunggu</small>
          <strong>{tasks}</strong>
        </div>
        <div>
          <small>Pos zakat</small>
          <strong>{view ? rupiah(view.funds.zakat) : '—'}</strong>
        </div>
        <div>
          <small>Pos infak</small>
          <strong>{view ? rupiah(view.funds.infak) : '—'}</strong>
        </div>
        <div>
          <small>Dicadangkan</small>
          <strong>{view ? rupiah(view.funds.reserved) : '—'}</strong>
        </div>
        <div>
          <small>Tersalurkan</small>
          <strong>{view ? rupiah(view.funds.distributed) : '—'}</strong>
        </div>
      </div>
      {error && (
        <p className="zo-notice" role="alert">
          {error}
        </p>
      )}
      <div className="zo-office-grid">
        <section className="zo-room" aria-label="Kantor simulasi">
          {failed ? (
            <div className="zo-webgl-fallback" role="alert">
              <h2>Grafis 3D tidak tersedia</h2>
              <p>Gunakan daftar meja di samping; tugas dan laporan tetap bisa dibuka.</p>
            </div>
          ) : (
            <SimScene
              walker={walker}
              view={viewRef}
              onFrame={onFrame}
              onFloor={(x, z) => {
                if (panelRef.current) return;
                walker.current.target = floorTarget(x, z);
                pending.current = null;
              }}
              onDesk={goTo}
              onError={() => setFailed(true)}
            />
          )}
          {view && !panel && near && (
            <div className="zo-sim-prompt">
              <span>
                {title(near)} ·{' '}
                {STATION_ROLE[near] === view.me.role ? `${myQueue(view, near)} tugas` : 'lihat laporan'}
              </span>
              <button className="zo-btn" onClick={() => open(near)}>
                {STATION_ROLE[near] === view.me.role ? 'Kerjakan' : 'Buka laporan'} <kbd>E</kbd>
              </button>
            </div>
          )}
          {panel && view && (
            <StationPanel key={panel} view={view} station={panel} busy={busy} onAct={act} onClose={() => setPanel(null)} />
          )}
          {toast && (
            <p className={'zo-sim-toast' + (toast.ok ? '' : ' bad')} role="status">
              {toast.message}
            </p>
          )}
        </section>
        <aside className="zo-sidebar">
          <div className="zo-sidebar-body">
            <p className="zo-eyebrow">MEJA LAYANAN</p>
            <h2>Tugas &amp; laporan</h2>
            <ul className="zo-sim-desks">
              {STATION_ORDER.map((id, i) => {
                const mine = view && STATION_ROLE[id] === view.me.role;
                return (
                  <li key={id} aria-current={near === id ? 'location' : undefined}>
                    <span className="zo-station-num">{i + 1}</span>
                    <div>
                      <strong>{title(id)}</strong>
                      <small>
                        {mine ? `${myQueue(view, id)} tugas untukmu` : STATION_ROLE[id] ? `Laporan ${ROLE_LABEL[STATION_ROLE[id]!].toLowerCase()}` : 'Laporan bersama'}
                      </small>
                    </div>
                    <button className="zo-btn zo-btn-secondary" onClick={() => goTo(id)}>
                      <Footprints size={14} /> Ke meja
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="zo-eyebrow">
              JEJAK AUDIT · {view?.auditTotal ?? 0} ENTRI
            </p>
            <ol className="zo-sim-log">
              {view?.audit.slice(0, 8).map((a) => (
                <li key={a.seq}>
                  <span>{a.detail}</span>
                  <small>
                    #{a.seq} · {a.actor} · <code>{a.hash.slice(0, 10)}</code>
                  </small>
                </li>
              ))}
            </ol>
            <p className="zo-sim-chain">
              <ShieldCheck size={14} /> Setiap entri memuat hash entri sebelumnya.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
