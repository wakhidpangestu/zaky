'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ZakyLogo from '@/components/zaky-logo';
import {
  Search,
  Layers,
  Menu,
  X,
  UserCheck,
  LogIn,
  Users,
  FlaskConical,
  Scale,
  BookOpen,
} from 'lucide-react';
import type { SessionPayload } from '@/lib/auth';

interface NavbarProps {
  session: SessionPayload | null;
}

export default function Navbar({ session }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY;
        // Smooth interpolation over 80px of scroll
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

  // Interpolasi halus untuk bayangan & penyusutan pill saat halaman digulir

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center pointer-events-none px-3 sm:px-6">
      <header
        className="pointer-events-auto w-full flex items-center justify-between relative will-change-transform"
        style={{
          marginTop: `${10 + progress * 4}px`,
          maxWidth: `min(100%, ${1180 - progress * 180}px)`,
          borderRadius: '9999px',
          height: `${64 - progress * 8}px`,
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(18px) saturate(160%)',
          WebkitBackdropFilter: 'blur(18px) saturate(160%)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'rgba(20, 32, 29, 0.08)',
          boxShadow: `0 ${8 + progress * 8}px ${24 + progress * 16}px -12px rgba(20, 32, 29, ${0.20 + progress * 0.10})`,
          paddingLeft: '10px',
          paddingRight: '10px',
          transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Brand — NO BACKGROUND BOX ON LOGO, NO V4.0 */}
        {/* Di halaman beranda sendiri, klik logo menggulir kembali ke paling
            atas (navigasi Next ke rute yang sama tidak menggulir apa pun,
            sehingga tanpa ini logo terasa tidak merespons). */}
        <Link
          href="/"
          onClick={(e) => {
            if (pathname === '/') {
              e.preventDefault();
              const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
            }
          }}
          className="flex items-center gap-2.5 group flex-shrink-0"
        >
          <ZakyLogo
            size={progress > 0.5 ? 26 : 30}
            className="text-primary-700 transition-all duration-300 group-hover:scale-105 flex-shrink-0"
          />
          <span className="font-bold text-lg sm:text-xl tracking-tight text-neutral-900 leading-none">
            Zaky<span className="text-accent-500">.</span>
          </span>
        </Link>

        {/* Desktop Navigation Links — Hidden on tablet/mobile (< 1024px) to prevent crowded overflow */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs xl:text-sm font-medium text-neutral-600">
          <a
            href="#alur"
            className="inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-2.5 rounded-full hover:bg-neutral-100/80 hover:text-primary-700 transition-colors whitespace-nowrap"
          >
            <Users className="w-3.5 h-3.5 text-neutral-500" />
            <span>Alur 3-Pihak</span>
          </a>
          <a
            href="#simulator"
            className="inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-2.5 rounded-full hover:bg-neutral-100/80 hover:text-primary-700 transition-colors whitespace-nowrap"
          >
            <FlaskConical className="w-3.5 h-3.5 text-neutral-500" />
            <span>Uji Mandiri</span>
          </a>
          <a
            href="#syariah"
            className="inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-2.5 rounded-full hover:bg-neutral-100/80 hover:text-primary-700 transition-colors whitespace-nowrap"
          >
            <Scale className="w-3.5 h-3.5 text-neutral-500" />
            <span>Standar Syariah</span>
          </a>
          <Link
            href="/silang"
            className="inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-2.5 rounded-full text-primary-700 font-semibold hover:bg-primary-100/60 transition-colors whitespace-nowrap"
          >
            <Layers className="w-3.5 h-3.5 text-primary-700" />
            <span>Papan Silang</span>
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-2.5 rounded-full hover:bg-neutral-100/80 hover:text-primary-700 transition-colors whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
            <span>Docs</span>
          </Link>
        </nav>

        {/* Action CTAs & Mobile/Tablet Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          <Link
            href="/verifikasi"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs font-semibold rounded-full border transition-all bg-white/90 hover:bg-white text-neutral-800 border-neutral-300/80 shadow-xs hover:border-primary-600"
          >
            <Search className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden md:inline">Cek Kode</span>
          </Link>

          {session ? (
            <Link
              href="/dasbor"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs font-bold rounded-full bg-primary-800 hover:bg-primary-700 text-white shadow-md transition-all hover:scale-[1.03]"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Dasbor</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs font-bold rounded-full bg-primary-800 hover:bg-primary-700 text-white shadow-md transition-all hover:scale-[1.03]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk Amil</span>
            </Link>
          )}

          {/* Mobile & Tablet Hamburger Button (Visible on < 1024px) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden min-w-11 min-h-11 inline-flex items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100/80 transition-colors pointer-events-auto cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-3xl bg-white/95 backdrop-blur-2xl border border-neutral-200/90 p-4 sm:p-5 shadow-2xl space-y-3 transition-all z-50 max-h-[82vh] overflow-y-auto">
            <nav className="flex flex-col space-y-1 text-xs font-medium text-neutral-700">
              <a
                href="#alur"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-3 rounded-xl hover:bg-neutral-100/80 hover:text-primary-700 flex items-center justify-between"
              >
                <span>Alur 3-Pihak Tanpa Kolusi</span>
                <Users className="w-4 h-4 text-neutral-400" />
              </a>
              <a
                href="#simulator"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-3 rounded-xl hover:bg-neutral-100/80 hover:text-primary-700 flex items-center justify-between"
              >
                <span>Uji Mandiri Simulator</span>
                <FlaskConical className="w-4 h-4 text-neutral-400" />
              </a>
              <a
                href="#syariah"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-3 rounded-xl hover:bg-neutral-100/80 hover:text-primary-700 flex items-center justify-between"
              >
                <span>Standar Syariah & Tata Kelola</span>
                <Scale className="w-4 h-4 text-neutral-400" />
              </a>
              <Link
                href="/silang"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-3 rounded-xl text-primary-700 font-semibold flex items-center justify-between hover:bg-primary-100/40"
              >
                <span>Papan Silang Antarlembaga</span>
                <Layers className="w-4 h-4" />
              </Link>
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-3 rounded-xl text-neutral-700 hover:text-primary-700 hover:bg-neutral-100/80 flex items-center justify-between"
              >
                <span>Dokumentasi</span>
                <BookOpen className="w-4 h-4 text-neutral-400" />
              </Link>
              <Link
                href="/verifikasi"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-3 rounded-xl text-primary-700 font-semibold flex items-center justify-between hover:bg-primary-100/40"
              >
                <span>Verifikasi Kode Publik</span>
                <Search className="w-4 h-4" />
              </Link>
            </nav>

            <div className="pt-2 border-t border-neutral-200 flex flex-col gap-2">
              {session ? (
                <Link
                  href="/dasbor"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 rounded-full bg-primary-700 hover:bg-primary-600 text-white text-xs font-semibold shadow-xs"
                >
                  Buka Dasbor Amil ({session.nama})
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 rounded-full bg-primary-700 hover:bg-primary-600 text-white text-xs font-semibold shadow-xs"
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
