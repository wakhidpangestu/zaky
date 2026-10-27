'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  Building2,
  AlertCircle,
  FileText,
  Search,
} from 'lucide-react';
import { getSavedPenyaluran, savePenyaluran, PenyaluranItem } from '@/lib/store';
import { useStoreSync } from '@/lib/use-store-sync';
import { formatRupiah } from '@/lib/format';
import StatusBadge from '@/components/status-badge';
import { ModalCetakDokumen, SuratPenyaluranCetak } from '@/components/cetak/dokumen-cetak';
import { Printer } from 'lucide-react';

export default function AntreanPersetujuanPage() {
  const [items, setItems] = useState<PenyaluranItem[]>([]);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [selectedPrintItem, setSelectedPrintItem] = useState<PenyaluranItem | null>(null);

  const loadQueue = () => {
    const list = getSavedPenyaluran();
    setItems(list.filter((p) => p.status === 'dikonfirmasi'));
  };

  useEffect(loadQueue, []);

  // Antrean tersegar sendiri: pengajuan yang baru dikonfirmasi mustahik/saksi
  // langsung muncul di sini tanpa refresh manual
  useStoreSync(loadQueue);

  const handleApprove = (id: string) => {
    const all = getSavedPenyaluran();
    const updated = all.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status: 'tersalurkan' as const,
          penyetujuNama: 'Penyetuju Hari',
          penyetujuUnit: 'Unit Keuangan',
          penyetujuWaktu: 'Baru saja',
        };
      }
      return item;
    });

    savePenyaluran(updated);
    setItems(updated.filter((p) => p.status === 'dikonfirmasi'));
    setSuccessId(id);
    setTimeout(() => setSuccessId(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
            Unit Keuangan • Segregasi 4-Mata
          </span>
          <span className="text-xs text-neutral-500 font-mono">Checker Authority</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
          Konsol Persetujuan Penyaluran Zakat
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 mt-1">
          Daftar pengajuan penyaluran yang telah dikonfirmasi penerima/saksi dan menunggu pengesahan eksekutif (FR-29 s/d FR-31).
        </p>
      </div>

      {successId && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>Penyaluran berhasil disahkan! Dana resmi dibukukan sebagai tersalurkan pada ledger pos dana.</span>
        </div>
      )}

      {/* Queue List */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200 text-neutral-500 space-y-2">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
            <h3 className="font-bold text-neutral-900 text-base">Seluruh Pengajuan Telah Disahkan</h3>
            <p className="text-xs">Tidak ada antrean penyaluran berstatus konfirmasi saat ini.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-xs hover:border-neutral-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-primary-700 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200/60">
                      {item.kodeUnik}
                    </span>
                    <StatusBadge status={item.status} />
                    <span className="text-xs text-neutral-500">• Pos: {item.posNama}</span>
                  </div>
                  <h4 className="font-bold text-base text-neutral-900">
                    {formatRupiah(item.nominal)} <span className="text-xs font-normal text-neutral-500">untuk asnaf {item.asnaf}</span>
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPrintItem(item)}
                    className="px-3.5 py-2.5 rounded-xl border border-neutral-300 hover:border-neutral-400 bg-white text-neutral-700 hover:bg-neutral-50 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                    title="Pratinjau Dokumen Berita Acara / PDF"
                  >
                    <Printer size={15} className="text-neutral-500" />
                    <span>Cetak / PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApprove(item.id)}
                    className="px-5 py-2.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <ShieldCheck size={16} />
                    <span>Sahkan Penyaluran (4-Mata)</span>
                  </button>
                </div>
              </div>

              {/* Actor Traceability */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-100 text-xs">
                <div className="flex items-start gap-2">
                  <UserCheck size={14} className="text-neutral-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Pembuat Draf (Maker)</span>
                    <span className="font-semibold text-neutral-800">{item.dibuatOleh}</span>
                    <span className="text-[10px] text-neutral-500 block">{item.dibuatUnit}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <ShieldCheck size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Konfirmasi (Witness)</span>
                    <span className="font-semibold text-neutral-800">
                      {item.metode === 'mustahik' ? 'Tautan Mustahik Sah' : `${item.saksi1Nama} & ${item.saksi2Nama || 'Saksi 2'}`}
                    </span>
                    <span className="text-[10px] text-emerald-700 block">Dua saksi independen valid</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Building2 size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Penyetuju (Checker)</span>
                    <span className="font-semibold text-neutral-800">Penyetuju Hari</span>
                    <span className="text-[10px] text-amber-700 block">Unit Keuangan (Terpisah dari Maker)</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Pratinjau Dokumen Cetak / PDF */}
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
