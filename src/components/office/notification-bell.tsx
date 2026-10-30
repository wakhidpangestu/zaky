'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, ArrowRight } from 'lucide-react';
import { ROLE_LABEL } from '@/lib/office/simulator';
import { useDashboardData } from './live-provider';
import { when } from './format';

/** Navbar bell: live notifications for the signed-in role. */
export default function NotificationBell() {
  const { view, live, act, pulse, latest, source } = useDashboardData();
  const workHref = source === 'database' ? '/pekerjaan' : '/dasbor?mode=3d';
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const unread = view?.unread ?? 0;
  // Profile preference "Tampilkan jumlah notifikasi" (on unless switched off).
  const showCount = useSyncExternalStore(
    (notify) => {
      window.addEventListener('zaky_profile_updated', notify);
      window.addEventListener('storage', notify);
      return () => {
        window.removeEventListener('zaky_profile_updated', notify);
        window.removeEventListener('storage', notify);
      };
    },
    () => {
      try {
        return localStorage.getItem('zaky_pref_notif') !== 'false';
      } catch {
        return true;
      }
    },
    () => true,
  );

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
        {unread > 0 && showCount ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-secondary px-1 text-xs font-bold text-secondary-foreground">
            {unread > 99 ? '99+' : unread}
          </span>
        ) : (
          <span
            className={`absolute bottom-0 right-0 size-2 rounded-full ring-2 ring-white ${live ? 'bg-primary' : 'bg-muted-foreground'}`}
            aria-hidden="true"
          />
        )}
      </button>
      <p className="sr-only" aria-live="polite">
        {latest?.message}
      </p>
      {open && (
        <div
          role="dialog"
          aria-label="Notifikasi"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(380px,88vw)] rounded-[20px] border border-border bg-card p-3 text-card-foreground shadow-[0_24px_50px_-20px_rgba(8,60,34,0.45)]"
        >
          <div className="flex items-center justify-between gap-2 px-1 pt-1">
            <strong className="text-[15px] font-bold">Notifikasi</strong>
            <button
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent disabled:opacity-40"
              disabled={!unread}
              onClick={() => act({ type: 'read', id: 'all' })}
            >
              <CheckCheck size={14} /> Tandai semua terbaca
            </button>
          </div>
          <p className="mb-3 flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
            <span className={`size-1.5 shrink-0 rounded-full ${live ? 'bg-primary' : 'bg-muted-foreground'}`} aria-hidden="true" />
            {view ? `Untuk ${ROLE_LABEL[view.me.role].toLowerCase()}` : 'Menghubungkan...'} ·{' '}
            {live ? 'tersambung langsung' : 'menyambung ulang'}
          </p>
          <ul className="grid max-h-[360px] gap-2 overflow-auto">
            {view?.notices.slice(0, 12).map((n) => (
              <li key={n.id}>
                <Link
                  href={workHref}
                  onClick={() => {
                    if (!n.read) void act({ type: 'read', id: n.id });
                    setOpen(false);
                  }}
                  className={`grid gap-0.5 rounded-[12px] border p-3 text-sm ${n.read ? 'border-border text-muted-foreground' : 'border-primary/40 bg-accent font-semibold text-foreground'}`}
                >
                  {n.message}
                  <small className="text-xs font-normal text-muted-foreground">
                    {when(n.at)} · {n.done ? 'Selesai' : n.read ? 'Dibaca' : 'Baru'}
                  </small>
                </Link>
              </li>
            ))}
            {view && !view.notices.length && (
              <li className="px-3 py-6 text-center">
                <span className="mx-auto mb-2 grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
                  <Bell size={18} />
                </span>
                <p className="text-sm font-medium text-foreground">Belum ada notifikasi</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Notifikasi baru akan muncul di sini.</p>
              </li>
            )}
          </ul>
          <div className="mt-2 border-t border-border px-1 pt-2">
            <Link
              href={workHref}
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 rounded-lg px-1 py-1 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent"
            >
              {source === 'database' ? 'Buka antrean pekerjaan' : 'Kerjakan di simulator'} <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
