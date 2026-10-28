'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, ArrowRight } from 'lucide-react';
import { ROLE_LABEL } from '@/lib/office/simulator';
import { useSim } from './sim-provider';
import { when } from './sim-panels';

/** Navbar bell: live notifications for the signed-in role. */
export default function NotificationBell() {
  const { view, live, act, pulse, latest } = useSim();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const unread = view?.unread ?? 0;

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="relative" ref={box}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid size-9 place-items-center rounded-full neo-inset"
        aria-label={`Notifikasi, ${unread} belum dibaca`}
        aria-expanded={open}
      >
        {/* Re-keyed on every new arrival so the ring animation restarts. */}
        <span key={pulse} className={pulse ? 'zo-ring' : undefined}>
          <Bell size={18} />
        </span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-secondary px-1 text-[11px] font-bold text-secondary-foreground">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        <span
          className={`absolute bottom-0 right-0 size-2 rounded-full ring-2 ring-white ${live ? 'bg-primary' : 'bg-muted-foreground'}`}
          aria-hidden="true"
        />
      </button>
      <p className="sr-only" aria-live="polite">
        {latest?.message}
      </p>
      {open && (
        <div
          role="dialog"
          aria-label="Notifikasi"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(380px,88vw)] rounded-[22px] border border-border bg-card p-4 text-card-foreground shadow-xl"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <strong className="text-sm">Notifikasi</strong>
            <button
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent-foreground disabled:opacity-40"
              disabled={!unread}
              onClick={() => act({ type: 'read', id: 'all' })}
            >
              <CheckCheck size={14} /> Tandai semua terbaca
            </button>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            {view ? `Untuk ${ROLE_LABEL[view.me.role].toLowerCase()}` : 'Menghubungkan...'} ·{' '}
            {live ? 'tersambung langsung' : 'menyambung ulang'}
          </p>
          <ul className="grid max-h-[360px] gap-2 overflow-auto">
            {view?.notices.slice(0, 12).map((n) => (
              <li key={n.id}>
                <Link
                  href="/dasbor?mode=3d"
                  onClick={() => {
                    if (!n.read) void act({ type: 'read', id: n.id });
                    setOpen(false);
                  }}
                  className={`grid gap-0.5 rounded-[14px] border p-3 text-sm ${n.read ? 'border-border text-muted-foreground' : 'border-primary/40 bg-accent font-semibold text-foreground'}`}
                >
                  {n.message}
                  <small className="text-xs font-normal text-muted-foreground">
                    {when(n.at)} · {n.done ? 'Selesai' : n.read ? 'Dibaca' : 'Baru'}
                  </small>
                </Link>
              </li>
            ))}
            {view && !view.notices.length && <li className="text-sm text-muted-foreground">Belum ada notifikasi.</li>}
          </ul>
          <Link
            href="/dasbor?mode=3d"
            onClick={() => setOpen(false)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent-foreground"
          >
            Kerjakan di simulator <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}
