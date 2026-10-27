'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  PieChart,
  HandCoins,
  HeartHandshake,
  Network,
  SearchCheck,
  UserCog,
  LogOut,
  ShieldCheck,
  Radio,
  CheckCircle2,
  Menu,
  X,
  Copy,
  Check,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { logout } from '@/app/actions/auth';
import ZakyLogo from '@/components/zaky-logo';
import NotificationCenter from '@/components/notification-center';

interface NavItem {
  href: string;
  label: string;
  badge?: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  {
    href: '/dasbor',
    label: 'Pos Dana',
    description: 'Ringkasan 4 Angka & Visualisasi 3D',
    icon: PieChart,
  },
  {
    href: '/penerimaan',
    label: 'Penerimaan Zakat',
    description: 'Pencatatan Masuk & Hak Amil',
    icon: HandCoins,
  },
  {
    href: '/penyaluran',
    label: 'Penyaluran',
    description: 'Reservasi Saldo & Konfirmasi',
    icon: HeartHandshake,
  },
  {
    href: '/silang',
    label: 'Papan Silang',
    badge: 'P2P',
    description: 'Konsensus Kriptografis Antarlembaga',
    icon: Network,
  },
  {
    href: '/verifikasi',
    label: 'Verifikasi Publik',
    description: 'Portal Bukti & Hash SHA-256',
    icon: SearchCheck,
  },
];

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
    nama: string;
    peran: string;
    email: string;
  };
}

export default function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Segarkan data server (sesi, gate, fragmen server) saat pengguna kembali ke
  // tab/jendela ini, dibatasi maksimal sekali per 10 detik agar tidak boros.
  // Data store lokal disegarkan terpisah oleh useStoreSync di tiap halaman.
  useEffect(() => {
    let last = 0;
    const maybeRefresh = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - last < 10000) return;
      last = now;
      router.refresh();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') maybeRefresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', maybeRefresh);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', maybeRefresh);
    };
  }, [router]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [userName, setUserName] = useState(user.nama);
  const [editName, setEditName] = useState(user.nama);
  const [savedToast, setSavedToast] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    setUserName(user.nama);
    setEditName(user.nama);

    try {
      const saved = localStorage.getItem(`zaky_user_nama_${user.email}`);
      if (saved) {
        setUserName(saved);
        setEditName(saved);
      }
    } catch {
      // ignore
    }

    const handleProfileUpdate = () => {
      try {
        const saved = localStorage.getItem(`zaky_user_nama_${user.email}`);
        if (saved) {
          setUserName(saved);
          setEditName(saved);
        } else {
          setUserName(user.nama);
          setEditName(user.nama);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('zaky_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('zaky_profile_updated', handleProfileUpdate);
  }, [user.nama, user.email]);

  // Close profile modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileModalOpen(false);
    };
    if (profileModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profileModalOpen]);

  const peranLabel: Record<string, string> = {
    amil: 'Amil Pelaksana',
    penyetuju: 'Penyetuju Unit',
    admin: 'Administrator',
  };

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#EFF4F1] flex font-sans text-[#14201D]">
      {/* ============================================================
          DESKTOP FLOATING CAPSULE SIDEBAR
          Vertically Centered (top-1/2 -translate-y-1/2), Icon-Only,
          Full Rounded Pill, Neomorphism Dual Shadow with Hover Tooltips
          100% Precise Sizing (All buttons strictly w-12 h-12 / 48px)
          ============================================================ */}
      <aside
        className="hidden lg:flex fixed left-5 top-1/2 -translate-y-1/2 z-40 flex-col items-center py-4 px-2.5 bg-white/95 backdrop-blur-xl rounded-full border border-neutral-900/10 shadow-[0_18px_36px_-12px_rgba(20,32,29,0.28),0_2px_6px_rgba(20,32,29,0.06)] select-none"
        aria-label="Sidebar Capsule Neomorphism Vertically Centered"
      >
        {/* TOP: Brand Logo Capsule Button (Exact w-12 h-12) */}
        <Link
          href="/dasbor"
          className="relative group w-12 h-12 rounded-full neo-convex flex items-center justify-center text-primary-700 transition-all hover:scale-105 cursor-pointer border border-white/90"
          title="Zaky — Beranda Dasbor"
        >
          <ZakyLogo size={24} />

          {/* Hover Tooltip Brand */}
          <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3.5 py-2 rounded-2xl neo-convex shadow-xl border border-white/95 pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs text-[#0E1F1B]">Zaky</span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 inline-block" />
              <span className="text-[9px] font-extrabold text-primary-700 bg-primary-100 px-1.5 py-0.2 rounded-md">
                v4.0
              </span>
            </div>
            <span className="text-[10px] text-[#485E59] font-medium block mt-0.5">
              Lembaga Zakat A • Simpul Aktif
            </span>
          </div>
        </Link>

        {/* Separator Inset — Uniform Margins */}
        <div className="w-6 h-px bg-white/70 my-3 neo-inset" />

        {/* MIDDLE: Modern Navigation Icons (Strict w-12 h-12, gap-3) */}
        <nav className="flex flex-col items-center gap-3 my-0.5" aria-label="Menu Ikon Utama">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dasbor'
                ? pathname === '/dasbor'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative group w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? 'neo-active-pill text-white shadow-md shadow-primary-900/30 scale-105'
                      : 'neo-convex neo-convex-hover text-primary-700 hover:text-primary-800 border border-white/80'
                  }
                `}
                aria-label={item.label}
              >
                <Icon size={20} />

                {/* Badge Dot for P2P / Active indicator */}
                {item.badge && !isActive && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-accent-500 ring-2 ring-[#EEF5F2]" />
                )}

                {/* Neomorphic Hover Tooltip Flying to the Right */}
                <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3.5 py-2.5 rounded-2xl neo-convex shadow-xl border border-white/95 pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-[#0E1F1B]">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-accent-500 text-neutral-900 font-mono">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#485E59] font-medium block mt-0.5">
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Separator Inset — Uniform Margins */}
        <div className="w-6 h-px bg-white/70 my-3 neo-inset" />

        {/* BOTTOM: User Avatar Pill & Logout Button (Strict w-12 h-12, gap-3) */}
        <div className="flex flex-col items-center gap-3">
          {/* User Profile Avatar Button — Opens Preview Modal with Blur */}
          <button
            type="button"
            onClick={() => {
              setEditName(userName);
              setSavedToast(false);
              setProfileModalOpen(true);
            }}
            className="relative group w-12 h-12 rounded-full bg-gradient-to-tr from-primary-700 to-emerald-600 text-white flex items-center justify-center text-xs font-extrabold shadow-md shadow-primary-900/15 transition-all hover:scale-105 cursor-pointer ring-2 ring-white/90"
            title="Pratinjau Profil & Otoritas Amil"
          >
            {initials}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white" />

            {/* Hover Tooltip Profile */}
            <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3.5 py-2.5 rounded-2xl neo-convex shadow-xl border border-white/95 pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap text-left">
              <p className="font-extrabold text-xs text-[#0E1F1B]">{userName}</p>
              <p className="text-[10px] text-primary-700 font-bold mt-0.5">
                {peranLabel[user.peran] || user.peran} • Klik untuk Pratinjau Profil
              </p>
            </div>
          </button>

          {/* Logout Button — Uniform Strict w-12 h-12 */}
          <form action={logout}>
            <button
              type="submit"
              className="relative group w-12 h-12 rounded-full neo-convex hover:shadow-[inset_2px_2px_4px_rgba(155,28,28,0.2)] hover:text-red-700 text-neutral-500 flex items-center justify-center transition-all cursor-pointer border border-white/90"
              title="Keluar dari Akun"
            >
              <LogOut size={18} />

              <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3.5 py-2 rounded-xl neo-convex shadow-lg border border-white/95 pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap text-left">
                <span className="font-bold text-[11px] text-red-700">Keluar Akun</span>
              </div>
            </button>
          </form>
        </div>
      </aside>

      {/* ============================================================
          MOBILE SLIDE-OVER DRAWER
          ============================================================ */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer container */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full m-3 p-5 neo-floating-capsule z-50 animate-in slide-in-from-left duration-250 justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/5">
                <div className="flex items-center gap-2">
                  <ZakyLogo size={24} className="text-primary-700" />
                  <span className="font-bold text-sm text-[#0E1F1B]">Zaky Menu</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl neo-convex text-neutral-600"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/dasbor'
                      ? pathname === '/dasbor'
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                        isActive
                          ? 'neo-active-pill text-white'
                          : 'neo-convex text-[#0E1F1B]'
                      }`}
                    >
                      <Icon size={18} />
                      <div>
                        <span className="font-bold text-xs block leading-tight">{item.label}</span>
                        <span className={`text-[10px] block mt-0.5 ${isActive ? 'text-white/80' : 'text-neutral-500'}`}>
                          {item.description}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-black/5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setEditName(userName);
                  setSavedToast(false);
                  setProfileModalOpen(true);
                }}
                className="flex items-center gap-2.5 text-left cursor-pointer hover:opacity-85 transition-opacity"
              >
                <div className="w-9 h-9 rounded-full bg-primary-700 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white">
                  {initials}
                </div>
                <div>
                  <p className="font-bold text-xs text-[#0E1F1B]">{userName}</p>
                  <p className="text-[10px] text-primary-700 font-semibold">Klik untuk Pratinjau Profil</p>
                </div>
              </button>

              <form action={logout}>
                <button
                  type="submit"
                  className="w-9 h-9 rounded-xl neo-convex text-red-700 flex items-center justify-center cursor-pointer"
                  title="Keluar"
                >
                  <LogOut size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MAIN CONTENT AREA (Offset by capsule sidebar width + gutters)
          ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-28 xl:pl-32 transition-all">
        {/* Container aligned with content cards width */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 flex-1 flex flex-col">
          {/* Top Header Floating Bar — exactly flush with content cards */}
          <header className="sticky top-4 z-40 mb-6 px-4 sm:px-6 h-15 rounded-2xl neo-convex flex items-center justify-between border border-white/90">
            {/* Left: Mobile Menu Toggle & Route Context */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl neo-convex text-neutral-700 hover:text-primary-700 cursor-pointer"
                aria-label="Buka Menu Sidebar"
              >
                <Menu size={20} />
              </button>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#4E625E] font-medium hidden sm:inline">Lembaga Zakat A</span>
                <span className="text-neutral-300 hidden sm:inline">•</span>
                <span className="font-bold text-primary-700 capitalize">
                  {pathname.split('/')[1] === 'profil'
                    ? 'Profil & Pengaturan'
                    : pathname.split('/')[1] || 'Dasbor'}
                </span>
              </div>
            </div>

            {/* Right: Security Indicator & Realtime Notifications */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full neo-inset text-[11px] font-semibold text-[#324541]">
                <span>Multi-Party Signed Ed25519</span>
              </div>

              {/* Notification Center Popover */}
              <NotificationCenter />
            </div>
          </header>

          {/* Page Content Body — flush width with top navbar */}
          <main className="flex-1 w-full">
            {children}
          </main>
        </div>
      </div>

      {/* ============================================================
          PROFILE PREVIEW POPUP CARD MODAL (CLEAN & REFINED)
          Opens on clicking profile without navigating to settings page
          ============================================================ */}
      {profileModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setProfileModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-preview-title"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 border border-neutral-200/90 shadow-2xl z-50 animate-in zoom-in-95 duration-150 text-[#0E1F1B] space-y-4.5">
            {/* Header with Title and Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase block">
                  Identitas Simpul
                </span>
                <h2 id="profile-preview-title" className="text-base font-bold text-neutral-900 mt-0.5">
                  Pratinjau Profil Amil
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Tutup Pratinjau Profil"
              >
                <X size={16} />
              </button>
            </div>

            {/* Amil Identity Hero Card — Clean, High-Contrast */}
            <div className="p-4 rounded-xl bg-[#F6FAF8] border border-emerald-900/10 flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-full bg-primary-700 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm sm:text-base text-neutral-900 truncate">
                  {userName}
                </p>
                <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200/60 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                  <span>{peranLabel[user.peran] || user.peran} • Simpul Aktif</span>
                </div>
              </div>
            </div>

            {/* Inline Quick Edit Name */}
            <div className="space-y-1.5">
              <label htmlFor="edit-name-input" className="block text-xs font-semibold text-neutral-700">
                Ubah Nama Lengkap Amil
              </label>
              <div className="flex gap-2">
                <input
                  id="edit-name-input"
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    setSavedToast(false);
                  }}
                  placeholder="Ketik nama lengkap amil..."
                  className="flex-1 h-10 px-3.5 rounded-xl border border-neutral-300 bg-white text-xs sm:text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-700 focus:ring-1 focus:ring-primary-700 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (editName.trim()) {
                      setUserName(editName.trim());
                      try {
                        localStorage.setItem(`zaky_user_nama_${user.email}`, editName.trim());
                        localStorage.removeItem('zaky_user_nama');
                        window.dispatchEvent(new Event('zaky_profile_updated'));
                      } catch {
                        // ignore
                      }
                      setSavedToast(true);
                      setTimeout(() => setSavedToast(false), 2500);
                    }
                  }}
                  className={`h-10 px-4 rounded-xl text-xs font-bold transition-all duration-150 shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    savedToast
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-primary-700 hover:bg-primary-800 text-white'
                  }`}
                >
                  {savedToast ? (
                    <>
                      <Check size={14} className="text-emerald-700" />
                      <span>Tersimpan</span>
                    </>
                  ) : (
                    <span>Simpan</span>
                  )}
                </button>
              </div>
            </div>

            {/* Cryptographic & Node Parameters — Clean Data Block */}
            <div className="rounded-xl bg-neutral-50 border border-neutral-200/80 p-3.5 space-y-2.5 text-xs text-neutral-700">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Lembaga / Simpul:</span>
                <span className="font-semibold text-neutral-900">Lembaga Zakat A (Simpul Induk)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Otoritas Penyaluran:</span>
                <span className="font-bold text-primary-700">s.d. Rp 10.000.000 / transaksi</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Saksi Konsensus:</span>
                <span className="font-semibold text-emerald-800">Lembaga B & Lembaga C Aktif</span>
              </div>

              <div className="pt-2 border-t border-neutral-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-neutral-500 font-medium">Ed25519 Public Key:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('ed25519:7a4f91e0a29bd8c11e0374e2d45c8f1a7b3c299e5a1b3c4d7e8f9a0b1c2d3e4f');
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="text-[11px] font-semibold text-primary-700 hover:text-primary-800 cursor-pointer flex items-center gap-1"
                  >
                    {copiedKey ? (
                      <>
                        <Check size={12} className="text-emerald-600" />
                        <span className="text-emerald-700">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Salin Key</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-[10.5px] bg-white px-3 py-2 rounded-lg border border-neutral-200 text-neutral-700 truncate select-all">
                  ed25519:7a4f91e0a29bd8c11e0374e2d45c8f1a7b3c299e5a1b3c4d7e8f9a0b1c2d3e4f
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-3">
              <Link
                href="/profil"
                onClick={() => setProfileModalOpen(false)}
                className="text-xs font-semibold text-primary-700 hover:text-primary-800 hover:underline flex items-center gap-1.5"
              >
                <span>Pengaturan Lanjutan</span>
                <ExternalLink size={12} />
              </Link>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="h-9 px-4 rounded-xl text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
