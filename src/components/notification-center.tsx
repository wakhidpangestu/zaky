'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'penyaluran' | 'konfirmasi' | 'kesaksian' | 'peringatan';
  read: boolean;
  link?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Konfirmasi Penerima Diterima',
    message: 'Mustahik S*** telah menekan "Saya menerima" melalui tautan SMS token 72 jam (ZK7H3Q9PLM2A).',
    time: '2 menit yang lalu',
    type: 'konfirmasi',
    read: false,
    link: '/penyaluran',
  },
  {
    id: 'notif-2',
    title: 'Kesaksian Antarlembaga Tersimpan',
    message: 'Lembaga Zakat B telah memvalidasi tanda tangan Ed25519 dan menyimpan salinan hash harian.',
    time: '8 menit yang lalu',
    type: 'kesaksian',
    read: false,
    link: '/silang',
  },
  {
    id: 'notif-3',
    title: 'Draf Penyaluran Baru Dibuat',
    message: 'Amil Budi mereservasi Rp 800.000 dari Pos Zakat Maal. Saldo dicadangkan terkunci di database.',
    time: '25 menit yang lalu',
    type: 'penyaluran',
    read: true,
    link: '/penyaluran',
  },
  {
    id: 'notif-4',
    title: 'Persetujuan Sah Selesai',
    message: 'Penyetuju Hari (Unit Keuangan) menyetujui penyaluran ZK4B8V2KNT9X. Dana resmi tersalurkan.',
    time: '1 jam yang lalu',
    type: 'penyaluran',
    read: true,
    link: '/penyaluran',
  },
];

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState({ right: 20, top: 84 });

  // Ukur posisi header shell agar tepi kanan panel rata PERSIS dengan tepi
  // kanan header/konten di semua lebar layar (termasuk offset sidebar kapsul
  // di desktop) - bukan menempel tepi viewport dan bukan menebak container.
  const measurePanelPos = () => {
    const header = triggerRef.current?.closest('header');
    if (!header) return;
    const r = header.getBoundingClientRect();
    setPanelPos({
      right: Math.max(12, Math.round(window.innerWidth - r.right)),
      top: Math.round(r.bottom + 8),
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    measurePanelPos();
    window.addEventListener('resize', measurePanelPos);
    return () => window.removeEventListener('resize', measurePanelPos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'semua' | 'belum_dibaca'>('semua');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filteredNotifs =
    filter === 'belum_dibaca'
      ? notifications.filter((n) => !n.read)
      : notifications;

  // Tutup panel dengan animasi slide keluar, baru unmount setelah animasi selesai
  const closePanel = () => {
    setIsClosing(true);
    window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 180);
  };

  // Tutup panel dengan tombol Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <div className="relative" ref={triggerRef}>
      {/* Bell Trigger Button with Neomorphic Convex Style */}
      <button
        onClick={() => (isOpen ? closePanel() : setIsOpen(true))}
        className="relative p-2.5 rounded-xl neo-convex text-neutral-700 hover:text-primary-700 transition-all cursor-pointer border border-white/90"
        aria-label="Notifikasi Realtime"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panel Notifikasi: portal ke body agar selalu di atas semua layer halaman
          (termasuk HUD game), tampil sebagai sheet tetap di bawah header shell */}
      {isOpen &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className={`fixed inset-0 z-[80] bg-neutral-900/30 backdrop-blur-[1px] ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'}`}
              onClick={closePanel}
            />

            <div
              role="dialog"
              aria-label="Notifikasi Realtime"
              style={{
                top: panelPos.top,
                right: panelPos.right,
                maxHeight: `calc(100dvh - ${panelPos.top + 16}px)`,
              }}
              className={`fixed z-[90] w-[min(24rem,calc(100vw-1.5rem))] flex flex-col bg-surface rounded-2xl border border-neutral-300 shadow-2xl overflow-hidden ${isClosing ? 'animate-out fade-out slide-out-to-top-2' : 'animate-in fade-in slide-in-from-top-2'}`}
            >
              {/* Header */}
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between gap-2 bg-neutral-50/50 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Bell size={16} className="text-primary-700 shrink-0" />
                  <h3 className="font-bold text-sm text-neutral-900 whitespace-nowrap">Notifikasi Realtime</h3>
                  {unreadCount > 0 && (
                    <span className="hidden min-[420px]:inline-flex text-[10px] font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-primary-700 hover:underline font-semibold cursor-pointer whitespace-nowrap"
                    >
                      Tandai dibaca
                    </button>
                  )}
                  <button
                    onClick={closePanel}
                    aria-label="Tutup notifikasi"
                    className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

            {/* Filter Tabs */}
            <div className="px-4 py-2 border-b border-neutral-100 flex items-center gap-2 text-xs shrink-0">
              <button
                onClick={() => setFilter('semua')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filter === 'semua'
                    ? 'bg-neutral-900 text-white font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Semua ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('belum_dibaca')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filter === 'belum_dibaca'
                    ? 'bg-neutral-900 text-white font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Belum Dibaca ({unreadCount})
              </button>
            </div>

              {/* Notification List */}
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-neutral-100 text-xs">
              {filteredNotifs.length === 0 ? (
                <div className="p-8 text-center text-neutral-500">
                  <CheckCircle2 size={24} className="mx-auto text-neutral-300 mb-2" />
                  <p>Tidak ada notifikasi saat ini.</p>
                </div>
              ) : (
                filteredNotifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 hover:bg-neutral-50/80 transition-colors cursor-pointer flex gap-3 ${
                      !n.read ? 'bg-primary-100/10' : ''
                    }`}
                  >
                    <div className="pt-0.5">
                      {n.type === 'konfirmasi' && (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <CheckCircle2 size={14} />
                        </div>
                      )}
                      {n.type === 'kesaksian' && (
                        <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center">
                          <ShieldCheck size={14} />
                        </div>
                      )}
                      {n.type === 'penyaluran' && (
                        <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                          <ArrowUpRight size={14} />
                        </div>
                      )}
                      {n.type === 'peringatan' && (
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                          <AlertTriangle size={14} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${!n.read ? 'text-neutral-900' : 'text-neutral-700'}`}>
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-primary-700 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-neutral-600 leading-relaxed text-[11px]">{n.message}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-neutral-400 text-[10px] font-mono">{n.time}</span>
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={closePanel}
                            className="text-primary-700 font-semibold hover:underline text-[10px] flex items-center gap-0.5"
                          >
                            <span>Buka</span>
                            <ArrowUpRight size={10} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

              {/* Footer */}
              <div className="p-3 bg-neutral-50 border-t border-neutral-100 text-center shrink-0">
                <span className="text-[10px] text-neutral-500">
                  Pembaruan realtime dari PostgreSQL Audit Log & Jaringan P2P
                </span>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
