'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ZakyLogo from '@/components/zaky-logo';
import {
  Search,
  Layers,
  ArrowLeft,
  Menu,
  X,
  LogIn,
  UserCheck,
  BookOpen,
  Home,
} from 'lucide-react';

interface PageNavbarProps {
  variant?: 'verifikasi' | 'verifikasi-detail' | 'silang' | 'docs';
  backHref?: string;
  backLabel?: string;
}

interface StatusSesi {
  masuk: boolean;
  tujuan?: string;
  label?: string;
}

export default function PageNavbar({
  variant = 'verifikasi',
  backHref,
  backLabel,
}: PageNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sesi, setSesi] = useState<StatusSesi | null>(null);

  // Navbar publik harus mencerminkan sesi yang sebenarnya: pengunjung yang
  // sudah masuk melihat jalan kembali ke konsolnya, bukan tombol masuk lagi.
  useEffect(() => {
    let batal = false;
    fetch('/api/sesi')
      .then((r) => (r.ok ? r.json() : { masuk: false }))
      .then((d: StatusSesi) => {
        if (!batal) setSesi(d);
      })
      .catch(() => {
        if (!batal) setSesi({ masuk: false });
      });
    return () => {
      batal = true;
    };
  }, []);

  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY;
        const p = Math.min(Math.max(y / 80, 0), 1);
        setProgress(p);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const isScrolled = progress > 0.05;

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center pointer-events-none px-3 sm:px-6">
      <header
        className="pointer-events-auto w-full flex items-center justify-between relative will-change-transform"
        style={{
          marginTop: `${progress * 14}px`,
          maxWidth: `min(100%, ${1280 - progress * (1280 - 1024)}px)`,
          borderRadius: `${progress * 9999}px`,
          height: `${72 - progress * 16}px`,
          backgroundColor: `rgba(255, 255, 255, ${progress * 0.82})`,
          backdropFilter: `blur(${progress * 24}px) saturate(${100 + progress * 80}%)`,
          WebkitBackdropFilter: `blur(${progress * 24}px) saturate(${100 + progress * 80}%)`,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: progress > 0.05 ? `rgba(229, 231, 235, ${progress * 0.8})` : 'transparent',
          boxShadow: progress > 0.05 ? `0 ${progress * 4}px ${progress * 16}px -2px rgba(0, 0, 0, ${progress * 0.06})` : 'none',
          paddingLeft: `${16 + (1 - progress) * 8}px`,
          paddingRight: `${16 + (1 - progress) * 8}px`,
          transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Left Side: Brand or Back Link — NO BACKGROUND ON LOGO */}
        {variant === 'verifikasi-detail' ? (
          <div className="flex items-center gap-3">
            <Link
              href={backHref || '/verifikasi'}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-600 hover:text-primary-700 transition-colors p-1 rounded-full hover:bg-neutral-100/70"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{backLabel || 'Kembali ke Cek Kode'}</span>
            </Link>
            <div className="h-4 w-px bg-neutral-300 hidden sm:block" />
            <Link href="/" className="flex items-center gap-2 group">
              <ZakyLogo
                size={progress > 0.5 ? 24 : 26}
                className="text-primary-700 transition-all group-hover:scale-105 flex-shrink-0"
              />
              <span className="font-bold text-base sm:text-lg tracking-tight text-neutral-900 leading-none">
                Zaky<span className="text-accent-500">.</span>
              </span>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <ZakyLogo
                size={progress > 0.5 ? 26 : 30}
                className="text-primary-700 transition-all duration-300 group-hover:scale-105 flex-shrink-0"
              />
              <span className="font-bold text-lg sm:text-xl tracking-tight text-neutral-900 leading-none">
                Zaky<span className="text-accent-500">.</span>
              </span>
            </Link>

            {variant === 'silang' && (
              <div className="hidden sm:inline-flex items-center gap-1.5 text-xs text-neutral-600 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Jaringan Aktif (3 Lembaga)</span>
              </div>
            )}

            {variant === 'verifikasi' && (
              <span className="hidden md:inline-block text-xs text-neutral-500 font-medium tracking-wide uppercase">
                Verifikasi Publik Antarlembaga
              </span>
            )}

            {variant === 'docs' && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-neutral-300 select-none font-light">/</span>
                <span className="text-xs font-semibold text-neutral-600 tracking-tight">Dokumentasi</span>
              </div>
            )}
          </div>
        )}

        {/* Desktop Actions — visible on >= 1024px */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-2.5 flex-shrink-0 text-xs sm:text-sm">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
              isScrolled
                ? 'text-neutral-700 hover:text-primary-700 hover:bg-neutral-100/80'
                : 'text-neutral-700 hover:text-primary-700 hover:bg-black/5'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-neutral-500" />
            <span>Beranda</span>
          </Link>

          {variant !== 'docs' && (
            <Link
              href="/docs"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                isScrolled
                  ? 'text-neutral-700 hover:text-primary-700 hover:bg-neutral-100/80'
                  : 'text-neutral-700 hover:text-primary-700 hover:bg-black/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
              <span>Docs</span>
            </Link>
          )}

          {variant !== 'verifikasi' && (
            <Link
              href="/verifikasi"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                isScrolled
                  ? 'text-neutral-700 hover:text-primary-700 hover:bg-neutral-100/80'
                  : 'text-neutral-700 hover:text-primary-700 hover:bg-black/5'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cek Kode</span>
            </Link>
          )}

          {variant !== 'silang' && (
            <Link
              href="/silang"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                isScrolled
                  ? 'text-neutral-700 hover:text-primary-700 hover:bg-neutral-100/80'
                  : 'text-neutral-700 hover:text-primary-700 hover:bg-black/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Papan Silang</span>
            </Link>
          )}

          {sesi?.masuk ? (
            <Link
              href={sesi.tujuan || '/dasbor'}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full bg-primary-700 hover:bg-primary-600 text-white shadow-sm transition-all hover:scale-105"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{sesi.label || 'Ke Dasbor'}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full bg-primary-700 hover:bg-primary-600 text-white shadow-sm transition-all hover:scale-105"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk Amil</span>
            </Link>
          )}
        </div>

        {/* Tablet & Mobile Right Actions (< 1024px) */}
        <div className="lg:hidden flex items-center gap-1.5 sm:gap-2">
          {sesi?.masuk ? (
            <Link
              href={sesi.tujuan || '/dasbor'}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-primary-700 hover:bg-primary-600 text-white shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{sesi.label || 'Ke Dasbor'}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-primary-700 hover:bg-primary-600 text-white shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Masuk Amil</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full text-neutral-700 hover:bg-neutral-100/80 transition-colors pointer-events-auto cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-3xl bg-white/95 backdrop-blur-2xl border border-neutral-200/90 p-4 sm:p-5 shadow-2xl space-y-3 transition-all z-50 max-h-[82vh] overflow-y-auto">
            <nav className="flex flex-col space-y-1 text-xs font-medium text-neutral-700">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-neutral-100/80 hover:text-primary-700 flex items-center justify-between"
              >
                <span>Beranda Zaky</span>
                <Home className="w-4 h-4 text-neutral-400" />
              </Link>
              <Link
                href="/verifikasi"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-neutral-100/80 hover:text-primary-700 flex items-center justify-between"
              >
                <span>Verifikasi Kode Publik</span>
                <Search className="w-4 h-4" />
              </Link>
              <Link
                href="/silang"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-primary-700 font-semibold flex items-center justify-between hover:bg-primary-100/40"
              >
                <span>Papan Silang Antarlembaga</span>
                <Layers className="w-4 h-4" />
              </Link>
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-neutral-700 hover:text-primary-700 hover:bg-neutral-100/80 flex items-center justify-between"
              >
                <span>Dokumentasi</span>
                <BookOpen className="w-4 h-4 text-neutral-400" />
              </Link>
            </nav>

            <div className="pt-2 border-t border-neutral-200 flex flex-col gap-2">
              {sesi?.masuk ? (
                <Link
                  href={sesi.tujuan || '/dasbor'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-primary-700 hover:bg-primary-600 text-white text-xs font-semibold shadow-xs"
                >
                  {sesi.label || 'Ke Dasbor'}
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-primary-700 hover:bg-primary-600 text-white text-xs font-semibold shadow-xs"
                >
                  Masuk Portal Amil
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
