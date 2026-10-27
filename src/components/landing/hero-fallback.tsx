'use client';

import React from 'react';
import Link from 'next/link';
import { Coins, Search, Info, MousePointer2, Play } from 'lucide-react';

interface HeroFallbackProps {
  onOpenAkadModal?: () => void;
  /** 'loading' = placeholder sesaat selagi scene 3D dimuat; 'static' = pengganti permanen bila tur 3D tidak dapat dijalankan di perangkat ini */
  mode?: 'loading' | 'static';
  /** Dipanggil saat pengguna memilih "Tetap putar tur 3D" pada kartu pemberitahuan mode statis */
  onForce3D?: () => void;
}

/**
 * Hero statis bergaya referensi scrollytelling: latar kertas hangat,
 * headline raksasa dua baris dua warna, statistik besar, CTA pill.
 * Berfungsi sebagai (1) placeholder pemuatan journey 3D,
 * (2) fallback permanen bila tur 3D tidak dapat dijalankan,
 * sehingga halaman utama tidak pernah kosong / crash.
 */
export default function HeroFallback({ onOpenAkadModal, mode = 'loading', onForce3D }: HeroFallbackProps) {
  const handleOpenAkad = () => {
    if (onOpenAkadModal) {
      onOpenAkadModal();
    } else if (typeof window !== 'undefined') {
      // Dipakai sebagai loading component next/dynamic (module-level, tanpa akses state):
      // HomeView mendengarkan event ini untuk membuka modal akad.
      window.dispatchEvent(new CustomEvent('zaky:open-akad'));
    }
  };
  return (
    <section className="relative w-full flex overflow-hidden bg-[#F7F4ED] min-h-[100svh] items-center">
      {/* Dekorasi lembut: cahaya emerald + emas sangat tipis di sudut */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 w-[34rem] h-[34rem] rounded-full opacity-60"
        style={{ background: 'radial-gradient(closest-side, rgba(19,122,102,0.14), transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-56 -left-40 w-[30rem] h-[30rem] rounded-full opacity-50"
        style={{ background: 'radial-gradient(closest-side, rgba(200,150,46,0.16), transparent)' }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 pt-32 pb-20 sm:pt-36">
        {/* Eyebrow */}
        <p className="z-eyebrow text-primary-700 flex items-center gap-3">
          <span className="inline-block w-8 h-px bg-accent-500" aria-hidden />
          Markaz Zaky · Tata Kelola Zakat Digital
        </p>

        {/* Headline raksasa dua baris, dua warna */}
        <h1 className="z-display-1 text-neutral-900 mt-5">
          Tata Kelola Zakat
          <br />
          <span className="text-primary-700">Transparan</span>
          <span className="text-accent-500">.</span>
        </h1>

        <p className="z-lead text-neutral-600 mt-6 max-w-xl">
          Audit silang dan verifikasi kriptografis. Telusuri 6 ruang tata kelola zakat: akad syariah,
          validasi asnaf, segregasi 4-mata, hingga konsensus silang antarkota.
        </p>

        {/* CTA pill */}
        <div className="flex flex-wrap items-center gap-3 mt-9">
          <button
            type="button"
            onClick={handleOpenAkad}
            className="z-touch inline-flex items-center gap-2 px-7 rounded-full bg-neutral-900 hover:bg-primary-800 text-white text-sm font-bold shadow-[0_14px_28px_-12px_rgba(20,32,29,0.45)] cursor-pointer"
          >
            <Coins className="w-4 h-4 text-accent-400" />
            Salurkan / Hitung Zakat
          </button>
          <Link
            href="/verifikasi"
            className="z-touch inline-flex items-center gap-2 px-7 rounded-full bg-white/85 hover:bg-white border border-neutral-900/10 text-neutral-800 text-sm font-bold shadow-[0_10px_24px_-14px_rgba(20,32,29,0.35)]"
          >
            <Search className="w-4 h-4 text-primary-700" />
            Cek Kode Penyaluran
          </Link>
          {mode === 'loading' && (
            <span className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600">
              <MousePointer2 className="w-3.5 h-3.5 animate-pulse" />
              Menyiapkan tur gedung 3D, gulir ke bawah untuk menjelajah...
            </span>
          )}
        </div>

        {/* Statistik besar */}
        <div className="relative mt-14 sm:mt-16">
          <dl className="grid grid-cols-3 gap-4 sm:gap-10 max-w-2xl">
            <div className="flex flex-col">
              <dt className="order-2 block text-[11px] sm:text-xs font-semibold text-neutral-600 mt-2 leading-snug">
                Pihak penegak terpisah
              </dt>
              <dd className="z-stat-num text-neutral-900 order-1">3</dd>
            </div>
            <div className="flex flex-col">
              <dt className="order-2 block text-[11px] sm:text-xs font-semibold text-neutral-600 mt-2 leading-snug">
                Asnaf mustahik terverifikasi
              </dt>
              <dd className="z-stat-num text-neutral-900 order-1">8</dd>
            </div>
            <div className="flex flex-col">
              <dt className="order-2 block text-[11px] sm:text-xs font-semibold text-neutral-600 mt-2 leading-snug">
                Tercatat dalam rantai audit
              </dt>
              <dd className="z-stat-num text-primary-700 order-1">100%</dd>
            </div>
          </dl>

          {/* Anotasi tulisan tangan (satu-satunya di hero) */}
          <span
            aria-hidden
            className="font-hand hidden sm:block absolute -top-9 right-2 lg:right-24 text-[1.7rem] text-accent-600 rotate-[-4deg] select-none"
          >
            catatan saling disaksikan
          </span>
        </div>

        {mode === 'static' && (
          <div className="mt-12 max-w-lg bg-white/70 border border-neutral-900/8 rounded-2xl px-4 py-3.5">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-neutral-500">
              <Info className="w-4 h-4 flex-shrink-0 text-primary-700 mt-px" />
              <span>
                Anda sedang melihat tampilan sederhana karena perangkat atau browser Anda tidak
                dapat menjalankan tur gedung 3D. Seluruh isi halaman tetap bisa dibaca dengan
                menggulir ke bawah, termasuk ringkasan enam langkah perjalanan zakat.
              </span>
            </p>
            {onForce3D && (
              <button
                type="button"
                onClick={onForce3D}
                className="z-touch mt-3 inline-flex items-center gap-2 px-5 rounded-full bg-white border border-primary-700/30 text-primary-800 text-xs font-bold shadow-sm hover:bg-primary-700 hover:text-white transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Tetap putar tur 3D
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
