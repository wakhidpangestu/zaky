
import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Search, Layers, ArrowRight, UserCheck } from 'lucide-react';
import type { SessionPayload } from '@/lib/auth';
import Card3D from './card-3d';

interface CtaBannerProps {
  session: SessionPayload | null;
}

export default function CtaBanner({ session }: CtaBannerProps) {
  return (
    <section className="z-cv py-20 md:py-28 bg-gradient-to-br from-[#0F5C4D] via-[#0D4E41] to-[#0A3D33] text-white relative overflow-hidden">
      {/* Subtle Neomorphic Ambient Light */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 pointer-events-none blur-3xl"
        style={{
          background: 'radial-gradient(circle, #C8962E 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-25 pointer-events-none blur-3xl"
        style={{
          background: 'radial-gradient(circle, #137A66 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-semibold border border-white/20">
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <span>Kepercayaan Umat Adalah Amanah Tertinggi</span>
        </div>

        <h2 className="z-display-2 max-w-3xl mx-auto">
          Wujudkan Pengelolaan Zakat yang Terbuka, Sah, dan Saling Diperiksa.
        </h2>

        <p className="text-sm sm:text-base text-primary-100 max-w-2xl mx-auto leading-relaxed">
          Zaky membuktikan bahwa transparansi sejati dapat diraih tanpa mengorbankan kedaulatan data
          lembaga dan tanpa mengekspos privasi mustahik.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/verifikasi"
            className="inline-flex items-center gap-2 bg-white hover:bg-neutral-100 text-primary-700 font-bold px-7 py-3.5 rounded-full shadow-lg transition-all text-xs sm:text-sm cursor-pointer hover:scale-105"
          >
            <Search className="w-4 h-4" />
            <span>Mulai Verifikasi Publik</span>
          </Link>

          <Link
            href="/silang"
            className="inline-flex items-center gap-2 bg-primary-600/70 hover:bg-primary-600 text-white font-semibold px-6 py-3.5 rounded-full border border-white/20 transition-all text-xs sm:text-sm cursor-pointer hover:scale-105"
          >
            <Layers className="w-4 h-4" />
            <span>Pantau Papan Silang</span>
          </Link>

          {session ? (
            <Link
              href="/dasbor"
              className="inline-flex items-center gap-2 bg-accent-500 hover:bg-[#B38324] text-neutral-900 font-bold px-6 py-3.5 rounded-full transition-all text-xs sm:text-sm cursor-pointer hover:scale-105"
            >
              <UserCheck className="w-4 h-4" />
              <span>Buka Dasbor Amil</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-accent-500 hover:bg-[#B38324] text-neutral-900 font-bold px-6 py-3.5 rounded-full transition-all text-xs sm:text-sm cursor-pointer hover:scale-105"
            >
              <span>Masuk Portal Amil</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
