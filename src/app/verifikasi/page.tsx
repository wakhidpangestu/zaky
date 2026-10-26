'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageNavbar from '@/components/navigation/page-navbar';
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  Layers,
  FileSearch,
} from 'lucide-react';

export default function VerifikasiLandingPage() {
  const router = useRouter();
  const [kode, setKode] = useState('');
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKode = kode.trim().toUpperCase();
    if (!cleanKode) {
      setError('Masukkan kode 12 karakter untuk memverifikasi.');
      return;
    }
    router.push(`/verifikasi/${cleanKode}`);
  };

  const sampleCodes = [
    {
      code: 'ZK7H3Q9PLM2A',
      desc: 'Penyaluran Zakat Maal (Menunggu Konfirmasi)',
      status: 'Proses Verifikasi',
      color: 'bg-amber-100 text-amber-800',
    },
    {
      code: 'ZK4B8V2KNT9X',
      desc: 'Penyaluran Zakat Maal (Tersalurkan & Disaksikan)',
      status: 'Tersalurkan Sah',
      color: 'bg-emerald-100 text-emerald-800',
    },
    {
      code: 'RC8K3N9PL2MA',
      desc: 'Penerimaan Zakat Maal (H. Ahmad Syafii)',
      status: 'Penerimaan Sah',
      color: 'bg-blue-100 text-blue-800',
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-neutral-900 flex flex-col justify-between">
      {/* Top Navigation */}
      <PageNavbar variant="verifikasi" />

      {/* Main Hero & Search */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-12 sm:pt-32 sm:pb-20 flex-1 flex flex-col justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100/60 border border-primary-200 text-primary-900 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-primary-700" />
            <span>Keterbukaan Publik & Perlindungan Data Pribadi UU 27/2022</span>
          </div>

          <h1 className="z-display-2 text-neutral-900">
            Verifikasi Keabsahan Penyaluran Zakat
          </h1>

          <p className="text-neutral-600 text-sm sm:text-base max-w-xl mx-auto">
            Masukkan kode 12 karakter yang tertera pada kuitansi, SMS konfirmasi mustahik, atau tanda terima untuk menguji keabsahan catatan kriptografis di jaringan antarlembaga.
          </p>
        </div>

        {/* Input Box */}
        <form onSubmit={handleSearch} className="mt-8 space-y-3">
          <div
            className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-surface rounded-2xl border-2 border-primary-700/30 focus-within:border-primary-700 shadow-lg shadow-primary-900/5 transition-all"
            style={{ borderRadius: 'var(--zaky-radius-card)' }}
          >
            <div className="relative flex-1 w-full flex items-center">
              <Search className="w-5 h-5 absolute left-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Masukkan 12 Karakter (Contoh: ZK7H3Q9PLM2A)"
                value={kode}
                onChange={(e) => {
                  setKode(e.target.value.toUpperCase());
                  setError('');
                }}
                maxLength={14}
                className="w-full pl-11 pr-4 py-3 text-base sm:text-lg font-mono tracking-wider font-bold uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-neutral-400 focus:outline-none bg-transparent"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-600 text-white font-semibold px-7 py-3 rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
              style={{ borderRadius: 'var(--zaky-radius-button)' }}
            >
              <span>Periksa</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {error && <p className="text-red-700 text-xs font-medium pl-2">{error}</p>}
        </form>

        {/* Quick Demo Samples */}
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Atau uji langsung kode sampel demonstrasi:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {sampleCodes.map((item) => (
              <button
                key={item.code}
                onClick={() => router.push(`/verifikasi/${item.code}`)}
                className="text-left p-3 rounded-xl border border-neutral-200 bg-surface hover:border-primary-700/60 hover:bg-primary-50/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-primary-700 text-sm group-hover:underline">
                    {item.code}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${item.color}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Note (FR-57) */}
        <div className="mt-8 p-4 rounded-xl bg-neutral-100/80 border border-neutral-200 text-neutral-600 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-neutral-900">
            <Lock className="w-3.5 h-3.5 text-primary-700" />
            <span>Kaidah Privasi Data Pribadi (FR-57)</span>
          </div>
          <p>
            Nama mustahik disamarkan menjadi inisial (misal <code>S***</code>). NIK, nomor ponsel, dan identitas donatur perorangan tidak pernah ditampilkan di halaman publik demi menjunjung martabat penerima manfaat dan kepatuhan syariah.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-500">
        <p>Zaky v4.0 — Jaringan Verifikasi Penyaluran Zakat Antarlembaga (UINIC 8.0)</p>
      </footer>
    </div>
  );
}
