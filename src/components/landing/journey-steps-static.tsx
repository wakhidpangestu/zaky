import React from 'react';
import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import { STATIONS } from '@/components/landing/stations-data';

/**
 * Daftar langkah statis perjalanan zakat (stasiun 1-6), ditampilkan tepat
 * di bawah hero saat tur 3D tidak dapat dijalankan di perangkat pengguna.
 * Tujuannya agar cerita alur tetap terbaca runtut dari atas ke bawah,
 * bukan halaman yang terasa kehilangan isi tengahnya.
 */
export default function JourneyStepsStatic() {
  const steps = STATIONS.filter((s) => s.id > 0);

  return (
    <section aria-label="Langkah perjalanan zakat" className="bg-[#F7F4ED] py-16 sm:py-20 border-t border-neutral-900/5">
      <div className="w-full max-w-4xl mx-auto px-5 sm:px-8">
        {/* Kepala section */}
        <p className="z-eyebrow text-primary-700 flex items-center gap-3">
          <span className="inline-block w-8 h-px bg-accent-500" aria-hidden />
          Tur Gedung Zaky · Ringkasan Langkah
        </p>
        <h2 className="z-display-2 text-neutral-900 mt-4">
          Enam Langkah Perjalanan Zakat
        </h2>
        <p className="z-lead text-neutral-600 mt-4 max-w-2xl">
          Di perangkat yang mendukung, enam ruang ini dijelajahi lewat tur gedung 3D.
          Berikut runtutan langkahnya dalam bentuk ringkas, dari akad penerimaan sampai
          konsensus silang antarlembaga.
        </p>

        {/* Garis waktu vertikal langkah */}
        <ol className="relative mt-12 space-y-5">
          <span
            aria-hidden
            className="absolute left-[22px] top-3 bottom-3 w-px bg-gradient-to-b from-primary-700/40 via-accent-500/40 to-primary-700/10 hidden sm:block"
          />
          {steps.map((station) => (
            <li key={station.id} className="relative sm:pl-16">
              {/* Nomor langkah */}
              <span
                aria-hidden
                className="hidden sm:flex absolute left-0 top-6 w-11 h-11 rounded-full bg-primary-800 text-white items-center justify-center font-mono text-sm font-bold shadow-[0_10px_20px_-10px_rgba(15,92,77,0.55)]"
              >
                {String(station.id).padStart(2, '0')}
              </span>

              <article className="z-card-clean p-5 sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EEF4F1] border border-primary-700/10 text-[11px] font-bold text-primary-800 tracking-[0.14em] uppercase">
                    <Building2 className="w-3 h-3 text-primary-700" aria-hidden />
                    {station.roomName}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-neutral-500">
                    Langkah {station.id} dari 6
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900 mt-3 leading-snug">
                  {station.title}
                </h3>
                <p className="text-sm font-semibold text-primary-800 mt-1">
                  {station.subtitle}
                </p>
                <p className="text-sm leading-relaxed text-neutral-600 mt-2.5">
                  {station.description}
                </p>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                  {station.details.map((d) => (
                    <div
                      key={d.label}
                      className="rounded-xl bg-[#F7F4ED] border border-neutral-900/5 px-3 py-2.5"
                    >
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                        {d.label}
                      </dt>
                      <dd className="text-xs font-mono font-bold text-primary-900 mt-0.5 leading-snug">
                        {d.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-neutral-200/60">
                  <span className="text-xs text-neutral-600">
                    {station.metricLabel}:{' '}
                    <span className="font-mono font-bold text-primary-900">
                      {station.metricValue}
                    </span>
                  </span>
                  <Link
                    href={station.actionHref}
                    className="z-touch inline-flex items-center gap-1.5 px-4 rounded-full bg-neutral-900 hover:bg-primary-800 text-white text-xs font-bold transition-colors"
                  >
                    {station.actionText}
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
