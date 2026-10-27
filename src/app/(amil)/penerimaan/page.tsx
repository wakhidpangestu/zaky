'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PenerimaanItem,
  getSavedPenerimaan,
  INITIAL_PENERIMAAN,
} from '@/lib/store';
import { useStoreSync } from '@/lib/use-store-sync';
import { formatRupiah } from '@/lib/format';
import ZakyLogo from '@/components/zaky-logo';
import { ModalCetakDokumen, BuktiSetorCetak } from '@/components/cetak/dokumen-cetak';
import {
  PlusCircle,
  FileText,
  Printer,
  CheckCircle2,
  TrendingUp,
  Landmark,
  ShieldCheck,
  Search,
  Building2,
  X,
  CreditCard,
  QrCode,
  Banknote,
} from 'lucide-react';

export default function PenerimaanPage() {
  const [items, setItems] = useState<PenerimaanItem[]>(INITIAL_PENERIMAAN);
  const [filterPos, setFilterPos] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReceipt, setSelectedReceipt] = useState<PenerimaanItem | null>(null);

  useEffect(() => {
    setItems(getSavedPenerimaan());
  }, []);

  // Auto-sinkron: perubahan dari tab lain / saat tab kembali aktif / berkala
  useStoreSync(() => setItems(getSavedPenerimaan()));

  const totalBruto = items.reduce((acc, curr) => acc + curr.bruto, 0);
  const totalHakAmil = items.reduce((acc, curr) => acc + curr.hakAmil, 0);
  const totalMasukPos = items.reduce((acc, curr) => acc + curr.masukPos, 0);

  const filteredItems = items.filter((item) => {
    if (filterPos !== 'semua' && item.posNama !== filterPos) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchKode = item.kodeUnik.toLowerCase().includes(q);
      const matchMuzakki = item.muzakkiNama.toLowerCase().includes(q);
      const matchKanal = item.kanal.toLowerCase().includes(q);
      if (!matchKode && !matchMuzakki && !matchKanal) return false;
    }
    return true;
  });

  const getKanalIcon = (kanal: string) => {
    if (kanal.toLowerCase().includes('qris')) return <QrCode className="w-4 h-4 text-emerald-600" />;
    if (kanal.toLowerCase().includes('transfer') || kanal.toLowerCase().includes('bank'))
      return <CreditCard className="w-4 h-4 text-blue-600" />;
    return <Banknote className="w-4 h-4 text-amber-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Penerimaan Zakat & Hak Amil</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Pencatatan dana zakat masuk dengan pembagian hak amil (FR-09 s/d FR-13) dan kode penerimaan unik 12 karakter.
          </p>
        </div>

        <Link
          href="/penerimaan/buat"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl neo-active-pill text-white font-extrabold text-xs sm:text-sm shadow-md shadow-primary-900/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-white/30 cursor-pointer"
          style={{ minHeight: '44px' }}
        >
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white">
            <PlusCircle className="w-4 h-4" />
          </div>
          <span>Catat Penerimaan Baru</span>
        </Link>
      </div>

      {/* KPI Cards: Bruto, Hak Amil, Masuk Pos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="bg-surface p-5 rounded-xl border border-neutral-300 shadow-sm relative overflow-hidden"
          style={{ borderRadius: 'var(--zaky-radius-card)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Penerimaan Bruto</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-neutral-900 tabular-nums">
            {formatRupiah(totalBruto)}
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            Seluruh transaksi zakat masuk tercatat di buku kas
          </p>
        </div>

        <div
          className="bg-surface p-5 rounded-xl border border-emerald-200/80 shadow-sm relative overflow-hidden"
          style={{ borderRadius: 'var(--zaky-radius-card)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Masuk Pos Dana (Mustahik)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100/60 text-emerald-700 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {formatRupiah(totalMasukPos)}
          </p>
          <p className="text-xs text-emerald-800 mt-2 font-medium">
            87.5% langsung menambah saldo tersedia pos
          </p>
        </div>

        <div
          className="bg-surface p-5 rounded-xl border border-amber-200/80 shadow-sm relative overflow-hidden"
          style={{ borderRadius: 'var(--zaky-radius-card)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Bagian Hak Amil (Maks 1/8)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100/60 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
            {formatRupiah(totalHakAmil)}
          </p>
          <p className="text-xs text-amber-800 mt-2 font-medium">
            Maks. 12.5% untuk biaya operasional & amilin
          </p>
        </div>
      </div>

      {/* Invariant Note Bar */}
      <div className="bg-primary-50/50 border border-primary-200/70 p-3.5 rounded-xl text-xs text-primary-950 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary-700 shrink-0" />
          <span>
            <strong>Aturan Invariant Keseimbangan (FR-11):</strong> <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-primary-200">bruto = hak_amil + masuk_pos</code> ditegakkan constraint database pada setiap baris.
          </span>
        </div>
        <div className="font-mono text-primary-900 font-semibold text-xs">
          {formatRupiah(totalBruto)} = {formatRupiah(totalHakAmil)} + {formatRupiah(totalMasukPos)}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm">
          {[
            { id: 'semua', label: 'Semua Pos Dana' },
            { id: 'Zakat Maal', label: 'Zakat Maal' },
            { id: 'Zakat Fitrah Uang', label: 'Zakat Fitrah' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterPos(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap ${
                filterPos === tab.id
                  ? 'bg-primary-700 text-white'
                  : 'bg-surface border border-neutral-300 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Cari kode atau muzakki..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-neutral-300 rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 transition-all"
          />
        </div>
      </div>

      {/* Tabel Penerimaan */}
      <div
        className="bg-surface rounded-xl border border-neutral-300 shadow-sm overflow-hidden"
        style={{ borderRadius: 'var(--zaky-radius-card)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50/80 border-b border-neutral-200 text-xs font-semibold text-neutral-600">
              <tr>
                <th className="py-3 px-4">Kode & Pos Dana</th>
                <th className="py-3 px-4">Muzakki (Donatur)</th>
                <th className="py-3 px-4">Kanal Bayar</th>
                <th className="py-3 px-4 text-right">Nominal Bruto</th>
                <th className="py-3 px-4 text-right">Hak Amil (12.5%)</th>
                <th className="py-3 px-4 text-right">Masuk Pos</th>
                <th className="py-3 px-4 text-center">Tanda Terima</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs sm:text-sm">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-primary-700 text-xs sm:text-sm">
                      {item.kodeUnik}
                    </div>
                    <div className="text-neutral-500 text-xs mt-0.5">{item.posNama} • {item.dicatatPada}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-neutral-900">{item.muzakkiNama}</div>
                    <div className="text-neutral-500 text-xs capitalize">
                      {item.muzakkiTipe === 'anonim' ? 'Hamba Allah (Anonim)' : 'Muzakki Terdaftar'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-700 font-medium">
                      {getKanalIcon(item.kanal)}
                      <span>{item.kanal}</span>
                    </div>
                    <div className="text-neutral-400 text-xs truncate max-w-[140px] mt-0.5">
                      {item.keterangan || '-'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-neutral-900 tabular-nums">
                    {formatRupiah(item.bruto)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-amber-800 tabular-nums">
                    {formatRupiah(item.hakAmil)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                    {formatRupiah(item.masukPos)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedReceipt(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-300 hover:border-primary-700 hover:text-primary-700 text-neutral-700 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Kuitansi</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    Tidak ada catatan penerimaan yang sesuai kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Kuitansi Kriptografis Resmi */}
      {selectedReceipt && (
        <ModalCetakDokumen
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          judul={`Bukti Setor Resmi — ${selectedReceipt.kodeUnik}`}
        >
          <BuktiSetorCetak item={selectedReceipt} />
        </ModalCetakDokumen>
      )}
    </div>
  );
}
