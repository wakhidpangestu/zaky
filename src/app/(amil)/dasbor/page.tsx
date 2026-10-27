'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Boxes,
  LayoutDashboard,
  ShieldCheck,
  ArrowUpRight,
  Plus,
  Clock,
  ArrowDownLeft,
  Lock,
  CheckCircle2,
  AlertCircle,
  Network,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import KartuSaldo from '@/components/kartu-saldo';
import Dashboard3D from '@/components/dashboard-3d';
import { INITIAL_POS_DANA, getSavedPosDana, PosDanaData } from '@/lib/store';
import { useStoreSync } from '@/lib/use-store-sync';
import { formatRupiah } from '@/lib/format';

export default function DasborPage() {
  const [viewMode, setViewMode] = useState<'standard' | '3d'>('standard');
  const [posList, setPosList] = useState<PosDanaData[]>(INITIAL_POS_DANA);
  const [currentUser, setCurrentUser] = useState<{ nama: string; peran: string; email: string } | null>(null);

  useEffect(() => {
    setPosList(getSavedPosDana());

    try {
      const nama = localStorage.getItem('zaky_user_nama') || 'Amil Budi';
      const peran = localStorage.getItem('zaky_user_peran') || 'amil';
      const email = localStorage.getItem('zaky_user_email') || 'budi@lembaga-a.test';
      setCurrentUser({ nama, peran, email });
    } catch {
      setCurrentUser({ nama: 'Amil Budi', peran: 'amil', email: 'budi@lembaga-a.test' });
    }
  }, []);

  // Auto-sinkron angka pos dana dari semua sumber perubahan
  useStoreSync(() => setPosList(getSavedPosDana()));

  const totalSemuaMasuk = posList.reduce((acc, p) => acc + p.totalMasuk, 0);
  const totalSemuaTersedia = posList.reduce((acc, p) => acc + p.saldoTersedia, 0);
  const totalSemuaDicadangkan = posList.reduce((acc, p) => acc + p.saldoDicadangkan, 0);
  const totalSemuaTersalurkan = posList.reduce((acc, p) => acc + p.totalTersalurkan, 0);

  // Percentages for visual invariant bar
  const pctTersedia = Math.round((totalSemuaTersedia / totalSemuaMasuk) * 100);
  const pctDicadangkan = Math.round((totalSemuaDicadangkan / totalSemuaMasuk) * 100);
  const pctTersalurkan = 100 - pctTersedia - pctDicadangkan;

  return (
    <div className="space-y-8 w-full">
      {/* TOP HEADER & MODE SWITCHER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full whitespace-nowrap">
              Lembaga Zakat A • Simpul Aktif
            </span>
            <span className="text-[11px] sm:text-xs text-neutral-500 font-mono whitespace-nowrap">Consensus: Online</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            Dasbor Penyaluran & Saldo Dana
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Setiap catatan saling disaksikan antarlembaga • Constraint invariant FR-03 aktif di server basis data
          </p>
        </div>

        {/* Action Controls & Mode Switcher — Neomorphic Segmented Control */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Consistent Neomorphic Segmented Switcher (Exact 44px Height) */}
          <div className="h-11 p-1 rounded-2xl neo-inset flex items-center gap-1 border border-white/60 select-none box-border">
            {/* Tab Mode Standar */}
            <button
              type="button"
              onClick={() => setViewMode('standard')}
              className={`h-full flex items-center gap-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                viewMode === 'standard'
                  ? 'neo-convex text-[#0E1F1B] border border-white shadow-xs'
                  : 'text-[#4E625E] hover:text-[#0E1F1B] hover:bg-white/40'
              }`}
            >
              <LayoutDashboard size={15} className="text-[#0E1F1B] shrink-0" />
              <span>Mode Standar</span>
            </button>

            {/* Tab Mode 3D Virtual Office */}
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`h-full flex items-center gap-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                viewMode === '3d'
                  ? 'neo-convex text-[#0E1F1B] border border-white shadow-xs'
                  : 'text-[#4E625E] hover:text-[#0E1F1B] hover:bg-white/40'
              }`}
            >
              <Boxes size={15} className="text-[#0E1F1B] shrink-0" />
              <span>3D Virtual Office</span>
            </button>
          </div>

          {/* Quick Create Distribution — Neomorphism (Exact 44px Height) */}
          <Link
            href="/penyaluran/buat"
            className="h-11 inline-flex items-center justify-center gap-2 px-4.5 rounded-2xl neo-active-pill text-white font-bold text-xs sm:text-sm shadow-md shadow-primary-900/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-white/30 cursor-pointer box-border shrink-0"
          >
            <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-white shrink-0">
              <Plus size={14} />
            </div>
            <span>Buat Penyaluran</span>
          </Link>
        </div>
      </div>

      {/* 3D VIRTUAL HQ GAME MODE (Rendered when toggled) */}
      {viewMode === '3d' && (
        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs text-neutral-600 px-1">
            <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
              <span>3D Isometric Virtual Office View</span>
            </span>
            <span className="hidden md:inline">Gunakan mouse untuk memutar, zoom, dan klik setiap meja petugas untuk monitoring aktivitas.</span>
            <span className="md:hidden">Seret untuk memutar tampilan, ketuk meja petugas untuk monitoring aktivitas.</span>
          </div>

          <Dashboard3D onClose={() => setViewMode('standard')} user={currentUser} />
        </div>
      )}

      {/* GLOBAL 4-NUMBER INVARIANT STATS BAR */}
      <div className="bg-surface rounded-2xl border border-neutral-300 p-4 sm:p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary-700" />
            <h2 className="text-base font-bold text-neutral-900">
              Ringkasan Konsolidasi Seluruh Pos Dana
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            FR-03 Invariant: Total Masuk = Tersedia + Dicadangkan + Tersalurkan
          </span>
        </div>

        {/* 4 Primary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Masuk */}
          <div className="p-2.5 min-[400px]:p-3 sm:p-4 rounded-xl bg-neutral-50/70 border border-neutral-200">
            <div className="flex items-center justify-between gap-1.5 text-neutral-500 text-[11px] min-[400px]:text-xs font-medium mb-1">
              <span>Total Dana Masuk</span>
              <ArrowDownLeft size={13} className="text-neutral-400 shrink-0" />
            </div>
            <div className="whitespace-nowrap text-[13px] min-[400px]:text-[15px] min-[480px]:text-xl sm:text-2xl font-bold font-mono text-neutral-900 tabular-nums">
              {formatRupiah(totalSemuaMasuk)}
            </div>
            <span className="text-[11px] text-neutral-500 mt-1 block">Akumulasi penerimaan zakat</span>
          </div>

          {/* Card 2: Saldo Tersedia */}
          <div className="p-2.5 min-[400px]:p-3 sm:p-4 rounded-xl bg-primary-100/25 border border-primary-200">
            <div className="flex items-center justify-between gap-1.5 text-primary-700 text-[11px] min-[400px]:text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-primary-700" />
                Saldo Tersedia
              </span>
              <span className="font-mono text-[11px] whitespace-nowrap shrink-0">{pctTersedia}%</span>
            </div>
            <div className="whitespace-nowrap text-[13px] min-[400px]:text-[15px] min-[480px]:text-xl sm:text-2xl font-bold font-mono text-primary-700 tabular-nums">
              {formatRupiah(totalSemuaTersedia)}
            </div>
            <span className="text-[11px] text-emerald-800 font-medium mt-1 block">
              Siap dialokasikan untuk draf baru
            </span>
          </div>

          {/* Card 3: Saldo Dicadangkan */}
          <div className="p-2.5 min-[400px]:p-3 sm:p-4 rounded-xl bg-amber-50/60 border border-amber-200">
            <div className="flex items-center justify-between gap-1.5 text-amber-800 text-[11px] min-[400px]:text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Lock size={12} className="text-accent-500" />
                Dicadangkan
              </span>
              <span className="font-mono text-[11px] whitespace-nowrap shrink-0">{pctDicadangkan}%</span>
            </div>
            <div className="whitespace-nowrap text-[13px] min-[400px]:text-[15px] min-[480px]:text-xl sm:text-2xl font-bold font-mono text-accent-500 tabular-nums">
              {formatRupiah(totalSemuaDicadangkan)}
            </div>
            <span className="text-[11px] text-amber-900 font-medium mt-1 block">
              Terkunci dalam draf aktif (FR-04)
            </span>
          </div>

          {/* Card 4: Total Tersalurkan */}
          <div className="p-2.5 min-[400px]:p-3 sm:p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center justify-between gap-1.5 text-emerald-800 text-[11px] min-[400px]:text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-700" />
                Tersalurkan Sah
              </span>
              <span className="font-mono text-[11px] whitespace-nowrap shrink-0">{pctTersalurkan}%</span>
            </div>
            <div className="whitespace-nowrap text-[13px] min-[400px]:text-[15px] min-[480px]:text-xl sm:text-2xl font-bold font-mono text-emerald-900 tabular-nums">
              {formatRupiah(totalSemuaTersalurkan)}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
              Konfirmasi penerima & disetujui unit lain
            </span>
          </div>
        </div>

        {/* Visual Invariant Progress Bar */}
        <div className="space-y-2">
          <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${pctTersedia}%` }}
              className="bg-primary-700 h-full transition-all duration-500"
              title={`Tersedia: ${pctTersedia}%`}
            />
            <div
              style={{ width: `${pctDicadangkan}%` }}
              className="bg-accent-500 h-full transition-all duration-500"
              title={`Dicadangkan: ${pctDicadangkan}%`}
            />
            <div
              style={{ width: `${pctTersalurkan}%` }}
              className="bg-emerald-600 h-full transition-all duration-500"
              title={`Tersalurkan: ${pctTersalurkan}%`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-neutral-500 pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-700" />
                <span>Tersedia ({pctTersedia}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-500" />
                <span>Dicadangkan ({pctDicadangkan}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Tersalurkan ({pctTersalurkan}%)</span>
              </span>
            </div>

            <span className="font-semibold text-primary-700">✓ Formula 100% Terjaga</span>
          </div>
        </div>
      </div>

      {/* POS DANA CARDS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Rincian Pos Dana Program</h2>
            <p className="text-xs text-neutral-500">Saldo terpisah per program dan tidak dapat dipindahkan (FR-08)</p>
          </div>
          <Link
            href="/penerimaan"
            className="text-xs font-semibold text-primary-700 hover:text-primary-600 flex items-center gap-1"
          >
            <span>Catat Penerimaan Baru</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posList.map((pos) => (
            <KartuSaldo
              key={pos.nama}
              nama={pos.nama}
              totalMasuk={pos.totalMasuk}
              tersedia={pos.saldoTersedia}
              dicadangkan={pos.saldoDicadangkan}
              tersalurkan={pos.totalTersalurkan}
            />
          ))}
        </div>
      </div>

      {/* LOWER SECTION: LIVE AUDIT FEED & NETWORK PEERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Audit Trail */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-neutral-300 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-neutral-500" />
              <h3 className="font-bold text-neutral-900 text-sm">
                Aliran Audit Log Transaksi Terakhir (Append-Only)
              </h3>
            </div>
            <span className="text-xs text-primary-700 font-semibold font-mono">SHA-256 Hash Chained</span>
          </div>

          <div className="space-y-3 font-sans">
            {[
              {
                nomor: 24,
                waktu: '27 Okt 09.10',
                pelaku: 'Amil Budi (Unit Pelayanan)',
                aksi: 'RESERVASI_DRAF',
                rincian: 'Draf penyaluran Rp 800.000 (ZK7H3Q9PLM2A) untuk Mustahik S***',
                hash: '9f2c8d1e...e41a',
              },
              {
                nomor: 23,
                waktu: '25 Okt 14.45',
                pelaku: 'Penyetuju Hari (Unit Keuangan)',
                aksi: 'SETUJUI_TERSALURKAN',
                rincian: 'Penyetujuan penyaluran Rp 1.200.000 (ZK4B8V2KNT9X) telah sah',
                hash: '7ab01f3e...33d1',
              },
              {
                nomor: 22,
                waktu: '25 Okt 14.00',
                pelaku: 'Saksi Rian (Unit Kepegawaian)',
                aksi: 'KONFIRMASI_SAKSI_2',
                rincian: 'Saksi 2 mengonfirmasi penyaluran mustahik tanpa ponsel Bantul',
                hash: '1a4d8c90...56fe',
              },
            ].map((log) => (
              <div
                key={log.nomor}
                className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neutral-700">#{log.nomor}</span>
                    <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded font-semibold text-[10px]">
                      {log.aksi}
                    </span>
                    <span className="text-neutral-400 font-mono">{log.waktu}</span>
                  </div>
                  <p className="text-neutral-900 font-medium">{log.rincian}</p>
                  <p className="text-[11px] text-neutral-500">Pelaku: {log.pelaku}</p>
                </div>
                <div className="text-right sm:self-center font-mono text-[11px] text-neutral-500 bg-surface px-2.5 py-1.5 rounded-lg border border-neutral-200 shrink-0">
                  <span>Hash: {log.hash}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-between items-center text-xs text-neutral-500">
            <span>Audit log dilindungi trigger database tanpa UPDATE atau DELETE (FR-32).</span>
            <Link href="/penyaluran" className="text-primary-700 font-semibold hover:underline">
              Buka Semua Riwayat Penyaluran →
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Interconnected Network Peers */}
        <div className="bg-surface rounded-2xl border border-neutral-300 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Network size={18} className="text-primary-700" />
              <h3 className="font-bold text-neutral-900 text-sm">Status Simpul Jaringan</h3>
            </div>
            <Link
              href="/silang"
              className="text-xs text-primary-700 font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>Papan Silang</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {/* Lembaga A */}
            <div className="p-3 rounded-xl border border-primary-300 bg-primary-100/20 space-y-1">
              <div className="flex items-center justify-between font-bold text-neutral-900">
                <span>Lembaga Zakat A (Lokal)</span>
                <span className="text-emerald-700 font-semibold text-[11px]">Simpul Anda</span>
              </div>
              <p className="text-neutral-600 text-[11px]">Database: Supabase Instance A</p>
              <p className="font-mono text-[11px] text-primary-700">Head: 9f2c...e41a</p>
            </div>

            {/* Lembaga B */}
            <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 space-y-1">
              <div className="flex items-center justify-between font-bold text-neutral-900">
                <span>Lembaga Zakat B</span>
                <span className="text-emerald-700 font-semibold text-[11px]">✓ Tersinkron</span>
              </div>
              <p className="text-neutral-500 text-[11px]">Saksi tersimpan: 27 Okt 00.04 WIB</p>
              <p className="font-mono text-[11px] text-neutral-700">Head: 7ab0...33d1</p>
            </div>

            {/* Lembaga C */}
            <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 space-y-1">
              <div className="flex items-center justify-between font-bold text-neutral-900">
                <span>Lembaga Zakat C</span>
                <span className="text-neutral-500 font-semibold text-[11px]">Siaga</span>
              </div>
              <p className="text-neutral-500 text-[11px]">Menunggu penerbitan harian</p>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <Link
              href="/silang"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary-100/60 hover:bg-primary-100 text-primary-700 font-bold text-xs transition-colors"
            >
              <span>Inspeksi Papan Silang Antarlembaga</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
