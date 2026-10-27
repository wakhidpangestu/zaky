'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getSavedPenyaluran,
  savePenyaluran,
  getSavedPosDana,
  savePosDana,
  PenyaluranItem,
  INITIAL_PENYALURAN,
} from '@/lib/store';
import { useStoreSync } from '@/lib/use-store-sync';
import { formatRupiah } from '@/lib/format';
import StatusBadge from '@/components/status-badge';
import PenandaLangkah from '@/components/penanda-langkah';
import { ModalCetakDokumen, SuratPenyaluranCetak } from '@/components/cetak/dokumen-cetak';
import {
  PlusCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Send,
  Users2,
  Ban,
  Search,
  MessageSquare,
  FileCheck2,
  Printer,
} from 'lucide-react';

export default function PenyaluranPage() {
  const [items, setItems] = useState<PenyaluranItem[]>(INITIAL_PENYALURAN);
  const [filter, setFilter] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [selectedPrintItem, setSelectedPrintItem] = useState<PenyaluranItem | null>(null);

  useEffect(() => {
    setItems(getSavedPenyaluran());
  }, []);

  // Auto-sinkron: status yang berubah di tempat lain (konfirmasi mustahik,
  // persetujuan admin) langsung tampil di sini tanpa refresh manual
  useStoreSync(() => setItems(getSavedPenyaluran()));

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Setujui Penyaluran (FR-29 s/d FR-31, AC-04)
  const handleApprove = (item: PenyaluranItem) => {
    const allPos = getSavedPosDana();
    const updatedPos = allPos.map((pos) => {
      if (pos.id === item.posId) {
        return {
          ...pos,
          saldoDicadangkan: Math.max(0, pos.saldoDicadangkan - item.nominal),
          totalTersalurkan: pos.totalTersalurkan + item.nominal,
        };
      }
      return pos;
    });

    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    const allPenyaluran = getSavedPenyaluran();
    const updatedPenyaluran = allPenyaluran.map((p) => {
      if (p.id === item.id) {
        return {
          ...p,
          status: 'tersalurkan' as const,
          penyetujuNama: 'Penyetuju Hari',
          penyetujuUnit: 'Unit Keuangan',
          penyetujuWaktu: nowStr,
        };
      }
      return p;
    });

    savePosDana(updatedPos);
    savePenyaluran(updatedPenyaluran);
    showNotification(`Penyaluran ${item.kodeUnik} berhasil disetujui! Saldo dipindah ke Total Tersalurkan.`);
  };

  // Batalkan Draf Penyaluran (FR-05, AC-03)
  const handleCancel = (item: PenyaluranItem) => {
    if (!confirm(`Batalkan draf ${item.kodeUnik} dan lepas reservasi saldo ${formatRupiah(item.nominal)}?`)) {
      return;
    }

    const allPos = getSavedPosDana();
    const updatedPos = allPos.map((pos) => {
      if (pos.id === item.posId) {
        return {
          ...pos,
          saldoTersedia: pos.saldoTersedia + item.nominal,
          saldoDicadangkan: Math.max(0, pos.saldoDicadangkan - item.nominal),
        };
      }
      return pos;
    });

    const allPenyaluran = getSavedPenyaluran();
    const updatedPenyaluran = allPenyaluran.map((p) => {
      if (p.id === item.id) {
        return {
          ...p,
          status: 'dibatalkan' as const,
        };
      }
      return p;
    });

    savePosDana(updatedPos);
    savePenyaluran(updatedPenyaluran);
    showNotification(`Draf ${item.kodeUnik} dibatalkan. Saldo ${formatRupiah(item.nominal)} kembali ke Saldo Tersedia.`);
  };

  // Tambahkan Kesaksian Saksi (FR-26 s/d FR-28)
  const handleAddWitness = (item: PenyaluranItem) => {
    const allPenyaluran = getSavedPenyaluran();
    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    const updatedPenyaluran = allPenyaluran.map((p) => {
      if (p.id === item.id) {
        if (!p.saksi1Nama) {
          return {
            ...p,
            saksi1Nama: 'Saksi Dewi',
            saksi1Unit: 'Unit Keuangan',
            saksi1Waktu: nowStr,
          };
        } else if (!p.saksi2Nama) {
          return {
            ...p,
            saksi2Nama: 'Saksi Rian',
            saksi2Unit: 'Unit Kepegawaian',
            saksi2Waktu: nowStr,
            status: 'dikonfirmasi' as const, // 2 saksi terpenuhi -> status menjadi dikonfirmasi (FR-28)
          };
        }
      }
      return p;
    });

    savePenyaluran(updatedPenyaluran);
    showNotification(`Kesaksian untuk ${item.kodeUnik} berhasil dicatat.`);
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'menunggu') {
      if (item.status !== 'menunggu_konfirmasi' && item.status !== 'dibuat') return false;
    } else if (filter === 'dikonfirmasi') {
      if (item.status !== 'dikonfirmasi') return false;
    } else if (filter === 'tersalurkan') {
      if (item.status !== 'tersalurkan') return false;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchKode = item.kodeUnik.toLowerCase().includes(q);
      const matchMustahik = item.mustahikNama.toLowerCase().includes(q);
      const matchPos = item.posNama.toLowerCase().includes(q);
      if (!matchKode && !matchMustahik && !matchPos) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Daftar Penyaluran Zakat</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Penyaluran sah membutuhkan konfirmasi penerima dan persetujuan dari unit lain (FR-18).
          </p>
        </div>
        <Link
          href="/penyaluran/buat"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl neo-active-pill text-white font-extrabold text-xs sm:text-sm shadow-md shadow-primary-900/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-white/30 cursor-pointer"
          style={{ minHeight: '44px' }}
        >
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white">
            <PlusCircle className="w-4 h-4" />
          </div>
          <span>Buat Penyaluran Baru</span>
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-neutral-300 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto text-sm pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_88%,transparent)] sm:[mask-image:none]">
          {[
            { id: 'semua', label: 'Semua Status' },
            { id: 'menunggu', label: 'Menunggu Konfirmasi' },
            { id: 'dikonfirmasi', label: 'Siap Disetujui' },
            { id: 'tersalurkan', label: 'Tersalurkan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filter === tab.id
                  ? 'bg-primary-700 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Cari kode atau mustahik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-neutral-300 rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 transition-all"
          />
        </div>
      </div>

      {/* Daftar Penyaluran Cards */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-surface rounded-xl border border-neutral-300 shadow-sm p-5 sm:p-6 space-y-4 transition-all"
            style={{ borderRadius: 'var(--zaky-radius-card)' }}
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono font-bold text-base sm:text-lg text-primary-700">
                  {item.kodeUnik}
                </span>
                <span className="text-neutral-300">•</span>
                <span className="font-semibold text-neutral-900 text-sm">{item.posNama}</span>
                <span className="text-neutral-300">•</span>
                <span className="text-xs bg-neutral-100 px-2.5 py-0.5 rounded-md text-neutral-700 uppercase font-semibold">
                  Asnaf: {item.asnaf}
                </span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span className="font-mono font-bold text-lg sm:text-xl text-neutral-900 tabular-nums whitespace-nowrap">
                  {formatRupiah(item.nominal)}
                </span>
                <StatusBadge status={item.status} />
              </div>
            </div>

            {/* Penerima Info & Penanda Langkah */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              <div className="space-y-2.5 text-xs text-neutral-600">
                <div>
                  <span className="text-neutral-500 block">Penerima Manfaat (Mustahik):</span>
                  <p className="font-semibold text-neutral-900 text-sm mt-0.5">
                    {item.mustahikNama} ({item.kabupaten})
                  </p>
                </div>
                <div>
                  <span className="text-neutral-500 block">Berkas Bukti / Rekomendasi:</span>
                  <p className="font-mono text-neutral-800 text-xs mt-0.5">📄 {item.namaBerkasBukti}</p>
                </div>
                <div>
                  <span className="text-neutral-500 block">Metode Konfirmasi:</span>
                  <p className="font-medium text-neutral-900 capitalize mt-0.5">
                    {item.metode === 'mustahik'
                      ? 'Mustahik Berponsel (Token 72 Jam)'
                      : 'Dua Saksi (Amil Lintas Unit)'}
                  </p>
                </div>
              </div>

              {/* Penanda Langkah Component (Design System 5.2) */}
              <div className="lg:col-span-2">
                <PenandaLangkah penyaluran={item} />
              </div>
            </div>

            {/* Action Buttons for Interactive Evaluation */}
            <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-neutral-500">
                Dicatat oleh <strong>{item.dibuatOleh}</strong> ({item.dibuatUnit}) pada {item.dibuatPada}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Method Mustahik: SMS Confirmation Link */}
                {item.status === 'menunggu_konfirmasi' && item.metode === 'mustahik' && (
                  <Link
                    href={`/konfirmasi/${item.tokenHash || item.kodeUnik}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Buka Tautan SMS Mustahik</span>
                  </Link>
                )}

                {/* Method Saksi: Add Witness */}
                {item.status === 'menunggu_konfirmasi' && item.metode === 'saksi' && (
                  <button
                    onClick={() => handleAddWitness(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Users2 className="w-3.5 h-3.5" />
                    <span>
                      {!item.saksi1Nama
                        ? '+ Saksi 1 (Dewi, Keuangan)'
                        : '+ Saksi 2 (Rian, Kepegawaian)'}
                    </span>
                  </button>
                )}

                {/* Ready to approve (dikonfirmasi) -> Approve button */}
                {item.status === 'dikonfirmasi' && (
                  <button
                    onClick={() => handleApprove(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Setujui Penyaluran (Penyetuju Hari)</span>
                  </button>
                )}

                {/* Cancel draft (if waiting) */}
                {item.status === 'menunggu_konfirmasi' && (
                  <button
                    onClick={() => handleCancel(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-300 text-neutral-600 hover:text-red-700 hover:border-red-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Batalkan</span>
                  </button>
                )}

                {/* Cetak Berita Acara / Dokumen PDF */}
                <button
                  type="button"
                  onClick={() => setSelectedPrintItem(item)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-300 text-neutral-700 hover:border-primary-700 hover:text-primary-700 hover:bg-neutral-50 text-xs font-semibold transition-colors cursor-pointer"
                  title="Cetak Berita Acara Penyaluran Resmi / PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Cetak / PDF</span>
                </button>

                {/* Public Verification Link */}
                <Link
                  href={`/verifikasi/${item.kodeUnik}`}
                  className="inline-flex items-center gap-1 text-primary-700 hover:text-primary-800 text-xs font-semibold px-2 py-1.5 rounded hover:bg-primary-50 transition-colors"
                >
                  <span>Verifikasi Publik</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="py-12 text-center text-neutral-500 bg-surface rounded-xl border border-neutral-300">
            Tidak ada data penyaluran pada tab ini.
          </div>
        )}
      </div>

      {/* Modal Pratinjau Cetak Berita Acara */}
      {selectedPrintItem && (
        <ModalCetakDokumen
          isOpen={Boolean(selectedPrintItem)}
          onClose={() => setSelectedPrintItem(null)}
          judul={`Berita Acara Penyaluran — ${selectedPrintItem.kodeUnik}`}
        >
          <SuratPenyaluranCetak item={selectedPrintItem} />
        </ModalCetakDokumen>
      )}
    </div>
  );
}
