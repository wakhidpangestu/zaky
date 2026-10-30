'use client';
import { useRef, useState } from 'react';
import { ClipboardCheck, Footprints, Maximize2, Minimize2, Search, Zap } from 'lucide-react';

/** Screen-space stick vector: x right, y down, each -1..1 (0,0 at rest). */
export type Stick = { x: number; y: number };

const RADIUS = 46;

/**
 * On-screen controls for touch devices: a joystick for walking and large action
 * buttons for the same commands the keyboard has (E, Tab, O, Shift, F).
 */
export default function SimTouchControls({
  onStick,
  sprint,
  onSprint,
  onWork,
  onNextTask,
  onOverview,
  onFullscreen,
  full,
  canWork,
}: {
  onStick: (s: Stick) => void;
  sprint: boolean;
  onSprint: () => void;
  onWork: () => void;
  onNextTask: () => void;
  onOverview: () => void;
  onFullscreen: () => void;
  full: boolean;
  canWork: boolean;
}) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [pointer, setPointer] = useState<number | null>(null);

  function move(clientX: number, clientY: number) {
    const r = base.current!.getBoundingClientRect();
    let x = clientX - (r.left + r.width / 2),
      y = clientY - (r.top + r.height / 2);
    const d = Math.hypot(x, y);
    if (d > RADIUS) {
      x = (x / d) * RADIUS;
      y = (y / d) * RADIUS;
    }
    setKnob({ x, y });
    // A small dead zone keeps a resting thumb from drifting the officer.
    const m = Math.min(1, d / RADIUS);
    onStick(m < 0.15 ? { x: 0, y: 0 } : { x: x / RADIUS, y: y / RADIUS });
  }
  function release() {
    setPointer(null);
    setKnob({ x: 0, y: 0 });
    onStick({ x: 0, y: 0 });
  }

  return (
    <div className="zo-touch" aria-label="Kontrol sentuh simulator">
      <div
        ref={base}
        className="zo-stick"
        role="application"
        aria-label="Joystick: geser untuk berjalan"
        onPointerDown={(e) => {
          setPointer(e.pointerId);
          e.currentTarget.setPointerCapture(e.pointerId);
          move(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => pointer === e.pointerId && move(e.clientX, e.clientY)}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
      >
        <span className="zo-stick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>
      <div className="zo-touch-actions">
        <button className="zo-touch-btn primary" disabled={!canWork} onClick={onWork}>
          <ClipboardCheck size={20} aria-hidden="true" />
          <span>Kerjakan</span>
        </button>
        <button className="zo-touch-btn" onClick={onNextTask}>
          <Footprints size={18} aria-hidden="true" />
          <span>Cari tugas</span>
        </button>
        <button className="zo-touch-btn" onClick={onOverview}>
          <Search size={18} aria-hidden="true" />
          <span>Kantor</span>
        </button>
        <button className={'zo-touch-btn' + (sprint ? ' on' : '')} aria-pressed={sprint} onClick={onSprint}>
          <Zap size={18} aria-hidden="true" />
          <span>Lari</span>
        </button>
        <button className="zo-touch-btn" onClick={onFullscreen} aria-label={full ? 'Keluar layar penuh' : 'Layar penuh'}>
          {full ? <Minimize2 size={18} aria-hidden="true" /> : <Maximize2 size={18} aria-hidden="true" />}
          <span>{full ? 'Keluar' : 'Penuh'}</span>
        </button>
      </div>
    </div>
  );
}
