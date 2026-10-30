'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Footprints,
  Maximize2,
  Monitor,
  ShieldCheck,
  Keyboard,
  HelpCircle,
  Radio,
  X,
} from 'lucide-react';
import { STATIONS, type StationId, type OfficeUser } from '@/lib/office/model';
import {
  DESK_FRONT,
  STATION_ORDER,
  createWalker,
  floorTarget,
  nearStation,
  walk,
  walkToTarget,
  type SimView,
  type Walker,
} from '@/lib/office/simulator';
import SimScene from './sim-scene';
import { useDashboardData } from './live-provider';
import { useOfficeWorkflow } from './use-office-workflow';
import { rupiah } from './format';
import SimDesk, { deskQueue } from './sim-desk';
import WorkWizard from '@/components/workflow/work-wizard';
import SimTouchControls, { type Stick } from './sim-touch';
import './sim-mobile.css';

const WALK_SPEED = 5;
const SPRINT_SPEED = 9.5;

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

function ShortcutHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="zo-shortcut-overlay" role="dialog" aria-modal="true" aria-label="Bantuan Pintasan Keyboard">
      <div className="zo-shortcut-card">
        <header className="zo-shortcut-header">
          <div className="zo-shortcut-title">
            <Keyboard size={22} className="text-emerald-500" />
            <div>
              <h3>Pintasan Keyboard Zaky Simulator</h3>
              <p>Kerjakan tugas nyata lembaga tanpa menyentuh mouse.</p>
            </div>
          </div>
          <button className="zo-icon" onClick={onClose} aria-label="Tutup ([Esc])">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="zo-shortcut-grid">
          <div className="zo-shortcut-group">
            <h4>Eksplorasi &amp; Gerak</h4>
            <ul>
              <li>
                <span>Jalan di Ruang Kantor</span>
                <div className="zo-kbd-group">
                  <kbd className="zo-kbd">W</kbd>
                  <kbd className="zo-kbd">A</kbd>
                  <kbd className="zo-kbd">S</kbd>
                  <kbd className="zo-kbd">D</kbd> atau <kbd className="zo-kbd">↑</kbd><kbd className="zo-kbd">←</kbd><kbd className="zo-kbd">↓</kbd><kbd className="zo-kbd">→</kbd>
                </div>
              </li>
              <li>
                <span>Lari Cepat (Sprint)</span>
                <div className="zo-kbd-group">
                  <kbd className="zo-kbd">Tahan Shift</kbd>
                </div>
              </li>
              <li>
                <span>Pindah Meja Langsung</span>
                <div className="zo-kbd-group">
                  <kbd className="zo-kbd">1</kbd> s/d <kbd className="zo-kbd">5</kbd>
                </div>
              </li>
              <li>
                <span>Cari Meja Bertugas Berikutnya</span>
                <div className="zo-kbd-group">
                  <kbd className="zo-kbd">Tab</kbd>
                </div>
              </li>
              <li>
                <span>Zoom Kamera Kantor</span>
                <div className="zo-kbd-group">
                  <kbd className="zo-kbd">+</kbd> / <kbd className="zo-kbd">-</kbd> atau Scroll
                </div>
              </li>
              <li>
                <span>Lihat Seluruh Kantor / Ikuti Petugas</span>
                <div className="zo-kbd-group">
                  <kbd className="zo-kbd">O</kbd>
                </div>
              </li>
              <li>
                <span>Layar Penuh</span>
                <div className="zo-kbd-group">
                  <kbd className="zo-kbd">F</kbd>
                </div>
              </li>
            </ul>
          </div>

          <div className="zo-shortcut-group">
            <h4>Bekerja di Meja</h4>
            <ul>
              <li>
                <span>Buka / Kerjakan Meja</span>
                <div className="zo-kbd-group">
                  <kbd className="zo-kbd">E</kbd> / <kbd className="zo-kbd">Space</kbd> / <kbd className="zo-kbd">Enter</kbd>
                </div>
              </li>
              <li>
                <span>Pindah antar tombol di meja</span>
                <div className="zo-kbd-group">
                  <kbd className="zo-kbd">Tab</kbd> lalu <kbd className="zo-kbd">Enter</kbd>
                </div>
              </li>
              <li>
                <span>Tutup Meja / Bantuan</span>
                <div className="zo-kbd-group">
                  <kbd className="zo-kbd">Escape</kbd>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <footer className="zo-shortcut-footer">
          <span>Tekan <kbd className="zo-kbd">?</kbd> atau <kbd className="zo-kbd">H</kbd> kapan saja untuk membuka bantuan ini.</span>
          <button className="zo-btn" onClick={onClose}>
            Mengerti, Lanjutkan Bekerja
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function SimulatorView({ onExit }: { user: OfficeUser; onExit: () => void }) {
  // Real institution data: dashboard figures and the live work queue from PostgreSQL.
  const { view, error } = useDashboardData();
  const workflow = useOfficeWorkflow();
  const actorId = workflow.snapshot?.actor.id ?? '';
  const [walkerInit] = useState(createWalker);
  const walker = useRef<Walker>(walkerInit),
    viewRef = useRef<SimView | null>(null),
    keys = useRef(new Set<string>()),
    pending = useRef<StationId | null>(null),
    since = useRef(0),
    root = useRef<HTMLDivElement>(null),
    stick = useRef<Stick>({ x: 0, y: 0 }),
    touchSprint = useRef(false);

  const [near, setNear] = useState<StationId | null>(null),
    [panel, setPanel] = useState<StationId | null>(null),
    [toast, setToast] = useState<Toast | null>(null),
    [wizard, setWizard] = useState<'receipt' | 'distribution' | null>(null),
    [failed, setFailed] = useState(false),
    [isFull, setIsFull] = useState(false),
    [isSprinting, setIsSprinting] = useState(false),
    [showHelp, setShowHelp] = useState(false),
    // Touch devices get on-screen controls; iPhone Safari has no element full screen,
    // so the office covers the viewport itself ("pseudo" full screen).
    [touch, setTouch] = useState(false),
    [pseudoFull, setPseudoFull] = useState(false),
    [portrait, setPortrait] = useState(false),
    [rotateHint, setRotateHint] = useState(true);
  const full = isFull || pseudoFull;

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)'),
      tall = window.matchMedia('(orientation: portrait)');
    const narrow = window.matchMedia('(max-width: 760px)');
    const sync = () => {
      setTouch(coarse.matches || narrow.matches);
      setPortrait(tall.matches);
    };
    sync();
    coarse.addEventListener('change', sync);
    narrow.addEventListener('change', sync);
    tall.addEventListener('change', sync);
    return () => {
      coarse.removeEventListener('change', sync);
      narrow.removeEventListener('change', sync);
      tall.removeEventListener('change', sync);
    };
  }, []);
  useEffect(() => {
    // Lock page scrolling behind the office while it covers the screen.
    document.documentElement.classList.toggle('zo-sim-locked', pseudoFull);
    return () => document.documentElement.classList.remove('zo-sim-locked');
  }, [pseudoFull]);

  useEffect(() => {
    const sync = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const panelRef = useRef(panel);
  useEffect(() => {
    panelRef.current = panel;
  }, [panel]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // Work waiting for this officer at each desk; read inside the frame loop through a ref.
  const queueAt = useCallback(
    (station: StationId) => (workflow.snapshot ? deskQueue(workflow.snapshot.items, actorId, station) : 0),
    [workflow.snapshot, actorId],
  );
  const queueRef = useRef(queueAt);
  useEffect(() => {
    queueRef.current = queueAt;
  }, [queueAt]);

  // Teammates see which desk this officer stands at.
  const { setStation } = workflow;
  useEffect(() => {
    setStation(panel ?? near);
  }, [setStation, panel, near]);

  const say = useCallback((t: Toast) => {
    setToast(t);
    window.setTimeout(() => setToast((x) => (x === t ? null : x)), 3600);
  }, []);

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

  // Tab cycling to find next station with waiting tasks
  const cycleToTaskStation = useCallback(() => {
    const currentNear = nearStation(walker.current);
    const currentIdx = currentNear ? STATION_ORDER.indexOf(currentNear) : -1;

    // First try: station with tasks > 0
    for (let step = 1; step <= STATION_ORDER.length; step++) {
      const idx = (currentIdx + step) % STATION_ORDER.length;
      const candidate = STATION_ORDER[idx];
      if (queueRef.current(candidate) > 0) {
        goTo(candidate);
        return;
      }
    }
    // Fallback: next station in sequence
    const nextIdx = (currentIdx + 1) % STATION_ORDER.length;
    goTo(STATION_ORDER[nextIdx]);
  }, [goTo]);

  const onFrame = useCallback(
    (seconds: number) => {
      const g = walker.current;
      const sprinting = keys.current.has('shift') || touchSprint.current;
      const speed = sprinting ? SPRINT_SPEED : WALK_SPEED;
      setIsSprinting(sprinting);

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
        // Joystick: screen up/right map onto the same isometric directions as W/D.
        const st = stick.current;
        if (st.x || st.y) {
          dx += KEYS.w[0] * -st.y + KEYS.d[0] * st.x;
          dz += KEYS.w[1] * -st.y + KEYS.d[1] * st.x;
        }
        if (dx || dz) {
          g.target = null;
          pending.current = null;
          walk(g, dx, dz, speed * seconds);
        } else if (g.target) {
          walkToTarget(g, speed * seconds);
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

      // Help modal toggle
      if (k === '?' || (k === 'h' && !panelRef.current)) {
        if (!within(e, 'input, textarea, select')) {
          e.preventDefault();
          setShowHelp((h) => !h);
          return;
        }
      }

      // Close panels / modals
      if (k === 'escape') {
        if (showHelp) {
          setShowHelp(false);
          return;
        }
        if (!panelRef.current) setPseudoFull(false);
        setPanel(null);
        return;
      }

      if (within(e, 'input, textarea, select')) return;

      // While a desk is open its own buttons and fields take the keyboard
      if (panelRef.current) return;

      // Shift key for sprint
      if (e.shiftKey || k === 'shift') {
        keys.current.add('shift');
      }

      // Movement keys
      if (KEYS[k]) {
        keys.current.add(k);
        e.preventDefault();
        return;
      }

      // Fast travel to stations 1-5
      const stationNum = parseInt(k, 10);
      if (stationNum >= 1 && stationNum <= 5) {
        e.preventDefault();
        goTo(STATION_ORDER[stationNum - 1]);
        return;
      }

      // Tab key: auto-walk to next task station
      if (k === 'tab') {
        e.preventDefault();
        cycleToTaskStation();
        return;
      }

      // F: full-screen office ([O] for the whole-floor view is handled by the scene)
      if (k === 'f') {
        e.preventDefault();
        void fullscreen();
        return;
      }

      // Interact with desk when near
      if (k === 'e' || ((k === 'enter' || k === ' ') && !within(e, 'button, a, summary'))) {
        e.preventDefault();
        open(nearStation(walker.current));
      }
    };

    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys.current.delete(k);
      if (k === 'shift' || !e.shiftKey) {
        keys.current.delete('shift');
      }
    };

    const clear = () => keys.current.clear();

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, [cycleToTaskStation, goTo, open, showHelp]);

  async function fullscreen() {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (o: 'landscape') => Promise<void>;
      unlock?: () => void;
    };
    if (document.fullscreenElement || pseudoFull) {
      orientation?.unlock?.();
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      setPseudoFull(false);
      return;
    }
    try {
      if (!root.current?.requestFullscreen) throw new Error('unsupported');
      await root.current.requestFullscreen({ navigationUI: 'hide' });
      // Android Chrome can turn the phone sideways for us; elsewhere this simply fails.
      await orientation?.lock?.('landscape').catch(() => {});
    } catch {
      // iPhone Safari: no element full screen and no orientation lock.
      setPseudoFull(true);
    }
    setRotateHint(true);
  }

  const myTasks = STATION_ORDER.reduce((sum, s) => sum + queueAt(s), 0);
  const roleLabel = workflow.snapshot?.actor.peran === 'penyetuju' ? 'Penyetuju' : 'Amil';

  return (
    <div
      className={'zo-office zo-sim' + (full ? ' is-full' : '') + (pseudoFull ? ' is-pseudo-full' : '') + (touch ? ' is-touch' : '')}
      ref={root}
    >
      <p className="zo-demo">
        <Radio size={14} className="inline mr-1 text-emerald-600" />
        <strong>Kantor nyata, data realtime.</strong> Setiap tindakan di meja tercatat di buku lembaga,
        sama seperti mode standar.
      </p>

      <div className="zo-room-bar">
        <div>
          <div className="flex items-center gap-2">
            <strong>Zaky Simulator</strong>
            <span className="zo-sim-badge-mode">Langsung</span>
          </div>
          <span>
            {workflow.snapshot
              ? `${workflow.snapshot.actor.nama} · ${roleLabel}`
              : 'Menghubungkan ke kantor lembaga...'}
          </span>
        </div>
        <div className="zo-room-controls">
          <button
            className="zo-btn zo-btn-secondary"
            onClick={() => setShowHelp(true)}
            title="Bantuan Pintasan Keyboard (?)"
          >
            <Keyboard size={16} /> Pintasan <kbd className="zo-kbd">?</kbd>
          </button>
          <button className="zo-icon" aria-label="Ganti layar penuh" onClick={fullscreen}>
            <Maximize2 size={18} />
          </button>
          {isFull && (
            <button className="zo-btn zo-btn-secondary" onClick={onExit}>
              <Monitor size={16} /> Standar
            </button>
          )}
        </div>
      </div>

      <div className="zo-sim-hud">
        <div>
          <small>Peran Anda</small>
          <strong className="zo-sim-role">{roleLabel}</strong>
        </div>
        <div>
          <small>Tugas untuk Anda</small>
          <strong className="text-emerald-600">{myTasks} tugas</strong>
        </div>
        <div>
          <small>Pos Zakat</small>
          <strong>{view ? rupiah(view.funds.zakat) : '—'}</strong>
        </div>
        <div>
          <small>Pos Infak</small>
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
        <section className="zo-room" aria-label="Kantor lembaga">
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
                <b>{title(near)}</b>
                {queueAt(near) > 0 && <> · {queueAt(near)} untuk Anda</>}
              </span>
              <button className="zo-btn" onClick={() => open(near)}>
                Kerjakan Meja <kbd className="zo-kbd">E</kbd> / <kbd className="zo-kbd">Space</kbd>
              </button>
            </div>
          )}

          {panel && (
            <SimDesk
              key={panel}
              station={panel}
              workflow={workflow}
              view={view}
              onClose={() => setPanel(null)}
              onWizard={setWizard}
            />
          )}

          {wizard && (
            <WorkWizard
              initial={wizard}
              onClose={() => setWizard(null)}
              onSaved={() => {
                void workflow.refresh();
                say({ ok: true, message: 'Tersimpan di buku lembaga.' });
              }}
            />
          )}

          {showHelp && <ShortcutHelpModal onClose={() => setShowHelp(false)} />}

          {toast && (
            <p className={'zo-sim-toast' + (toast.ok ? '' : ' bad')} role="status">
              {toast.message}
            </p>
          )}

          {touch && !panel && !failed && (
            <SimTouchControls
              onStick={(s) => (stick.current = s)}
              sprint={isSprinting}
              onSprint={() => (touchSprint.current = !touchSprint.current)}
              onWork={() => open(nearStation(walker.current))}
              onNextTask={cycleToTaskStation}
              onOverview={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o' }))}
              onFullscreen={() => void fullscreen()}
              full={full}
              canWork={!!near}
            />
          )}

          {full && touch && portrait && rotateHint && (
            <div className="zo-rotate" role="status">
              <span aria-hidden="true">⟳</span>
              <p>
                Putar ponsel ke posisi <b>landscape</b> agar seluruh kantor terlihat.
              </p>
              <button className="zo-btn zo-btn-secondary" onClick={() => setRotateHint(false)}>
                Tetap tegak
              </button>
            </div>
          )}

          {/* Permanent Bottom Keyboard Dock */}
          <div className="zo-sim-bottom-bar" role="toolbar" aria-label="Panduan Kontrol Keyboard">
            <div className="zo-sim-bottom-keys">
              <span className="zo-sim-key-chip">
                <span className="zo-sim-key-badges">
                  <kbd className="zo-kbd">W</kbd>
                  <kbd className="zo-kbd">A</kbd>
                  <kbd className="zo-kbd">S</kbd>
                  <kbd className="zo-kbd">D</kbd>
                </span>
                <span className="zo-sim-key-label">Jalan</span>
              </span>

              <span className={`zo-sim-key-chip ${isSprinting ? 'active' : ''}`}>
                <kbd className="zo-kbd">Shift</kbd>
                <span className="zo-sim-key-label">{isSprinting ? 'Lari (Aktif)' : 'Lari'}</span>
              </span>

              <span className="zo-sim-key-chip">
                <span className="zo-sim-key-badges">
                  <kbd className="zo-kbd">1</kbd>–<kbd className="zo-kbd">5</kbd>
                </span>
                <span className="zo-sim-key-label">Meja Cepat</span>
              </span>

              <span className="zo-sim-key-chip">
                <kbd className="zo-kbd">Tab</kbd>
                <span className="zo-sim-key-label">Cari Tugas</span>
              </span>

              <span className="zo-sim-key-chip">
                <kbd className="zo-kbd">E</kbd> / <kbd className="zo-kbd">Space</kbd>
                <span className="zo-sim-key-label">Bekerja</span>
              </span>

              <span className="zo-sim-key-chip">
                <kbd className="zo-kbd">O</kbd>
                <span className="zo-sim-key-label">Seluruh Kantor</span>
              </span>

              <button
                className="zo-sim-key-chip zo-sim-key-btn"
                onClick={() => setShowHelp(true)}
              >
                <kbd className="zo-kbd">?</kbd>
                <span className="zo-sim-key-label">Bantuan</span>
              </button>
            </div>
          </div>
        </section>

        <aside className="zo-sidebar">
          <div className="zo-sidebar-body">
            <div className="flex items-center justify-between">
              <p className="zo-eyebrow">MEJA LAYANAN KANTOR</p>
              <span className="text-xs font-semibold text-emerald-600">{myTasks} untuk Anda</span>
            </div>
            <h2>Tugas &amp; Laporan</h2>
            <ul className="zo-sim-desks">
              {STATION_ORDER.map((id, i) => {
                const count = queueAt(id);
                return (
                  <li key={id} aria-current={near === id ? 'location' : undefined}>
                    <span className="zo-station-num">
                      <kbd className="zo-kbd">{i + 1}</kbd>
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong>{title(id)}</strong>
                        {count > 0 && <span className="zo-sim-badge-count">{count}</span>}
                      </div>
                      <small>
                        {count > 0
                          ? `${count} berkas menunggu Anda`
                          : STATIONS.find((s) => s.id === id)!.description}
                      </small>
                    </div>
                    <button className="zo-btn zo-btn-secondary" onClick={() => goTo(id)}>
                      <Footprints size={14} /> Ke meja
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between">
              <p className="zo-eyebrow">JEJAK AUDIT</p>
              <span className="text-xs font-mono text-muted-foreground">{view?.auditTotal ?? 0} entri</span>
            </div>
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
              <ShieldCheck size={14} /> Setiap entri memuat hash entri sebelumnya (kriptografis).
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
