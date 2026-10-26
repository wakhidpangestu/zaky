'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Layers,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronRight,
  FileCheck2,
  KeyRound,
} from 'lucide-react';
import Card3D from './card-3d';

export default function HeroSection() {
  const router = useRouter();
  const [kode, setKode] = useState('');
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKode = kode.trim().toUpperCase();
    if (!cleanKode) {
      setError('Masukkan 12 karakter kode unik.');
      return;
    }
    router.push(`/verifikasi/${cleanKode}`);
  };

  const sampleCodes = [
    {
      code: 'ZK4B8V2KNT9X',
      label: 'Zakat Maal',
      status: 'Tersalurkan Sah',
    },
    {
      code: 'ZK7H3Q9PLM2A',
      label: 'Zakat Maal',
      status: 'Menunggu Konfirmasi',
    },
    {
      code: 'RC8K3N9PL2MA',
      label: 'Penerimaan',
      status: 'Tercatat',
    },
  ];

  return (
    <section className="relative overflow-hidden pt-28 sm:pt-36 lg:pt-40 pb-16 md:pb-24 bg-gradient-to-b from-[#F5F1E6] via-neutral-50 to-neutral-50 border-b border-neutral-300/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Clean, Punchy Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 tracking-tight leading-[1.14]">
          Setiap lembaga mencatat sendiri,{' '}
          <span className="text-primary-700 block sm:inline">
            catatannya saling diperiksa.
          </span>
        </h1>

        {/* Short, Digestible Value Proposition */}
        <p className="mt-5 text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
          Mengakhiri keraguan pengelolaan dana zakat. Penyaluran disahkan melalui{' '}
          <strong>konfirmasi penerima manfaat</strong>,{' '}
          <strong>pemisahan kewenangan unit</strong>, dan{' '}
          <strong>saksi silang kriptografis harian</strong>.
        </p>

        {/* Clean & Focused Verification Search Box */}
        <div className="mt-8 max-w-xl mx-auto">
          <form onSubmit={handleSearch} className="relative text-left">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-white rounded-2xl border border-neutral-300/80 shadow-md shadow-primary-950/5 focus-within:border-primary-700 transition-all">
              <div className="relative flex-1 flex items-center min-w-0">
                <Search className="w-5 h-5 absolute left-3.5 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={kode}
                  onChange={(e) => {
                    setKode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="Masukkan Kode Unik (mis. ZK4B8V2KNT9X)"
                  maxLength={14}
                  className="w-full pl-11 pr-3 py-3 text-sm sm:text-base font-mono font-bold tracking-wider uppercase text-neutral-900 placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-neutral-400 focus:outline-none bg-transparent"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 bg-primary-700 hover:bg-primary-600 text-white text-sm font-semibold transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                <span>Verifikasi</span>
              </button>
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-600 font-medium pl-2">
                {error}
              </p>
            )}
          </form>

          {/* Quick Clickable Chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-neutral-500 font-medium">Contoh kode:</span>
            {sampleCodes.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setKode(item.code);
                  router.push(`/verifikasi/${item.code}`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 border border-neutral-200/90 font-mono text-neutral-800 text-xs hover:border-primary-600 transition-all cursor-pointer shadow-2xs hover:scale-105"
                title={`Uji langsung: ${item.label}`}
              >
                <span className="font-bold">{item.code}</span>
                <span className="text-[10px] text-neutral-500 hidden sm:inline">({item.status})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Action Links */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm">
          <Link
            href="/silang"
            className="inline-flex items-center gap-1.5 font-semibold text-neutral-700 hover:text-primary-700 px-4 py-2 rounded-full hover:bg-neutral-100/70 transition-colors"
          >
            <Layers className="w-4 h-4 text-primary-700" />
            <span>Lihat Papan Silang Antarlembaga</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          </Link>

          <a
            href="#simulator"
            className="inline-flex items-center gap-1.5 font-semibold text-primary-700 hover:text-primary-600 px-4 py-2 rounded-full hover:bg-primary-100/40 transition-colors"
          >
            <span>Coba Simulator Interaktif</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 3 Clean Focus Cards (Simple, High Readability, No Clutter) */}
        <div className="mt-14 pt-8 border-t border-neutral-200/80 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 text-left gsap-stagger-group">
          <Card3D className="gsap-stagger-item">
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-sm hover:border-primary-600/40 transition-all h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-neutral-900">
                  Invariant Saldo Terjaga
                </h2>
                <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                  Total masuk selalu sama dengan saldo tersedia, dicadangkan, dan tersalurkan. Saldo negatif mustahil secara teknis.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-100 text-[11px] font-mono text-primary-700 font-semibold">
                Kekal di level database
              </div>
            </div>
          </Card3D>

          <Card3D className="gsap-stagger-item">
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-sm hover:border-primary-600/40 transition-all h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center mb-4">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-neutral-900">
                  Alur 3-Pihak Tanpa Kolusi
                </h2>
                <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                  Amil membuat draf, mustahik mengonfirmasi lewat tautan, dan staf Unit Keuangan memberikan persetujuan final.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-100 text-[11px] font-mono text-primary-700 font-semibold">
                Segregation of duties mutlak
              </div>
            </div>
          </Card3D>

          <Card3D className="gsap-stagger-item">
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-sm hover:border-primary-600/40 transition-all h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center mb-4">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-neutral-900">
                  Saksi Silang Antarlembaga
                </h2>
                <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                  Setiap tengah malam, hash riwayat mutasi ditandatangani Ed25519 dan disaksikan oleh lembaga zakat anggota lain.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-100 text-[11px] font-mono text-primary-700 font-semibold">
                Deteksi manipulasi seketika
              </div>
            </div>
          </Card3D>
        </div>
      </div>
    </section>
  );
}
