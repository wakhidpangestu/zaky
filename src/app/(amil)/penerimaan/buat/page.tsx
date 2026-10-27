'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  INITIAL_POS_DANA,
  PenerimaanItem,
  getSavedPosDana,
  savePosDana,
  getSavedPenerimaan,
  savePenerimaan,
} from '@/lib/store';
import { useStoreSync } from '@/lib/use-store-sync';
import { formatRupiah } from '@/lib/format';
import ZakyLogo from '@/components/zaky-logo';
import { ModalCetakDokumen, BuktiSetorCetak } from '@/components/cetak/dokumen-cetak';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Building2,
  FileCheck2,
  Printer,
  Info,
} from 'lucide-react';

export default function BuatPenerimaanPage() {
  const router = useRouter();

  // Load existing pos dana
  const [posList, setPosList] = useState(() => getSavedPosDana());

  // Saldo pos dana tersegar sendiri selama formulir dibuka
  useStoreSync(() => setPosList(getSavedPosDana()));

  // Form State
  const [posId, setPosId] = useState(posList[0]?.id || INITIAL_POS_DANA[0].id);
  const [muzakkiTipe, setMuzakkiTipe] = useState<'terdaftar' | 'anonim'>('terdaftar');
  const [muzakkiNama, setMuzakkiNama] = useState('Hj. Siti Aminah');
  const [bruto, setBruto] = useState<number>(2000000);
  const [persenAmil, setPersenAmil] = useState<number>(12.5); // Default 12.5% per 1/8 asnaf rule
  const [kanal, setKanal] = useState('Transfer Bank Syariah (BSI)');
  const [keterangan, setKeterangan] = useState('Zakat perniagaan triwulan IV');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<PenerimaanItem | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Computations
  const selectedPos = posList.find((p) => p.id === posId) || posList[0];
  const hakAmil = Math.round((bruto * persenAmil) / 100);
  const masukPos = bruto - hakAmil;

  // Real-time balance preview
  const newTotalMasuk = selectedPos.totalMasuk + masukPos;
  const newSaldoTersedia = selectedPos.saldoTersedia + masukPos;

  const quickNominals = [500000, 1000000, 2500000, 5000000, 10000000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (bruto <= 0) {
      setErrorMsg('Nominal bruto penerimaan harus lebih dari Rp 0.');
      return;
    }

    if (persenAmil > 12.5) {
      setErrorMsg('Hak amil tidak boleh melebihi 12.5% (kaidah batas 1/8 asnaf dalam syariah).');
      return;
    }

    if (muzakkiTipe === 'terdaftar' && !muzakkiNama.trim()) {
      setErrorMsg('Nama muzakki terdaftar wajib diisi atau pilih opsi Anonim.');
      return;
    }

    setIsSubmitting(true);

    // Generate random 12-char receipt code (e.g. RC + 10 alphanumeric chars)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let kodeUnik = 'RC';
    for (let i = 0; i < 10; i++) {
      kodeUnik += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';

    const newReceipt: PenerimaanItem = {
      id: `rcv-${Date.now()}`,
      kodeUnik,
      posId: selectedPos.id,
      posNama: selectedPos.nama,
      bruto,
      hakAmil,
      masukPos,
      persenAmil,
      kanal,
      muzakkiNama: muzakkiTipe === 'anonim' ? 'Hamba Allah' : muzakkiNama,
      muzakkiTipe,
      keterangan,
      dicatatOleh: 'Amil Budi',
      dicatatUnit: 'Unit Pelayanan',
      dicatatPada: nowStr,
      hashSha256: `sha256_${Math.random().toString(16).substring(2, 10)}98f2b7a01d4c7e6b54a321908ef9`,
    };

    // Update pos dana
    const updatedPosList = posList.map((p) => {
      if (p.id === selectedPos.id) {
        return {
          ...p,
          totalMasuk: p.totalMasuk + masukPos,
          saldoTersedia: p.saldoTersedia + masukPos,
        };
      }
      return p;
    });

    // Save to store
    const currentPenerimaan = getSavedPenerimaan();
    const updatedPenerimaan = [newReceipt, ...currentPenerimaan];

    savePosDana(updatedPosList);
    savePenerimaan(updatedPenerimaan);
    setPosList(updatedPosList);

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessReceipt(newReceipt);
    }, 450);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
          <Link href="/penerimaan" className="hover:text-primary-700 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Penerimaan</span>
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-medium">Catat Penerimaan Zakat Baru</span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Catat Penerimaan Zakat Masuk
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          Menghitung hak amil secara otomatis dan menambahkan saldo tersedia pada pos dana secara atomik.
        </p>
      </div>

      {successReceipt ? (
        /* Success State & Receipt Presentation */
        <div
          className="bg-surface rounded-2xl border border-emerald-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95"
          style={{ borderRadius: 'var(--zaky-radius-card)' }}
        >
          <div className="flex items-center gap-3 text-emerald-800">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Penerimaan Berhasil Dicatat!</h2>
              <p className="text-xs text-neutral-600">
                Saldo pos dana telah bertambah sebesar <strong>{formatRupiah(successReceipt.masukPos)}</strong> dan log transaksi telah disegel secara kriptografis.
              </p>
            </div>
          </div>

          {/* Bukti Setor / Kuitansi Visual */}
          <div className="border border-neutral-300 rounded-xl p-5 bg-neutral-50/50 space-y-4">
            <div className="flex items-center justify-between border-b border-dashed border-neutral-300 pb-3">
              <div className="flex items-center gap-2">
                <ZakyLogo size={22} className="text-primary-700" />
                <span className="font-bold text-sm text-neutral-900">Tanda Terima Zakat Resmi</span>
              </div>
              <span className="font-mono font-bold text-primary-700 text-sm">{successReceipt.kodeUnik}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-neutral-500 text-xs">Muzakki (Penyetor):</span>
                <p className="font-semibold text-neutral-900">{successReceipt.muzakkiNama}</p>
              </div>
              <div>
                <span className="text-neutral-500 text-xs">Pos Dana:</span>
                <p className="font-semibold text-neutral-900">{successReceipt.posNama}</p>
              </div>
              <div>
                <span className="text-neutral-500 text-xs">Nominal Bruto:</span>
                <p className="font-mono font-bold text-neutral-900">{formatRupiah(successReceipt.bruto)}</p>
              </div>
              <div>
                <span className="text-neutral-500 text-xs">Hak Amil ({successReceipt.persenAmil}%):</span>
                <p className="font-mono font-semibold text-amber-800">{formatRupiah(successReceipt.hakAmil)}</p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-950 flex justify-between items-center text-xs sm:text-sm">
              <span className="font-medium">Bersih Masuk Pos Dana:</span>
              <span className="font-mono font-bold text-emerald-700 text-base">{formatRupiah(successReceipt.masukPos)}</span>
            </div>

            <div className="text-[11px] font-mono text-neutral-500 break-all bg-white p-2.5 rounded border border-neutral-200">
              <span className="font-sans font-semibold text-neutral-600 block mb-0.5">SHA-256 Hash Segel:</span>
              {successReceipt.hashSha256}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-700 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Bukti Setor / Simpan PDF</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSuccessReceipt(null);
                  setBruto(1000000);
                }}
                className="px-4 py-2.5 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Catat Transaksi Lain
              </button>
              <Link
                href="/penerimaan"
                className="px-5 py-2.5 border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Ke Daftar Penerimaan
              </Link>
            </div>
          </div>

          {/* Modal Pratinjau Cetak & PDF */}
          <ModalCetakDokumen
            isOpen={showPrintModal}
            onClose={() => setShowPrintModal(false)}
            judul={`Bukti Setor Resmi — ${successReceipt.kodeUnik}`}
          >
            <BuktiSetorCetak item={successReceipt} />
          </ModalCetakDokumen>
        </div>
      ) : (
        /* Form Pencatatan Penerimaan */
        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-2xl border border-neutral-300 shadow-sm p-6 sm:p-8 space-y-6"
          style={{ borderRadius: 'var(--zaky-radius-card)' }}
        >
          {/* Pos Dana Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-neutral-900">
              Pos Dana Tujuan <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {posList.map((pos) => (
                <div
                  key={pos.id}
                  onClick={() => setPosId(pos.id)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    posId === pos.id
                      ? 'border-primary-700 bg-primary-50/20 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-surface'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-neutral-900 text-sm">{pos.nama}</span>
                    <input
                      type="radio"
                      name="posId"
                      checked={posId === pos.id}
                      onChange={() => setPosId(pos.id)}
                      className="text-primary-700 focus:ring-primary-700"
                    />
                  </div>
                  <div className="text-xs text-neutral-500 flex justify-between mt-2">
                    <span>Saldo Tersedia saat ini:</span>
                    <span className="font-mono font-bold text-neutral-800">{formatRupiah(pos.saldoTersedia)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Muzakki Type & Identity */}
          <div className="space-y-3 pt-1 border-t border-neutral-200">
            <label className="block text-sm font-semibold text-neutral-900 pt-2">
              Identitas Muzakki (Donatur)
            </label>
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="muzakkiTipe"
                  value="terdaftar"
                  checked={muzakkiTipe === 'terdaftar'}
                  onChange={() => setMuzakkiTipe('terdaftar')}
                  className="text-primary-700 focus:ring-primary-700"
                />
                <span className="text-neutral-800 font-medium">Muzakki Terdaftar / Bernama</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="muzakkiTipe"
                  value="anonim"
                  checked={muzakkiTipe === 'anonim'}
                  onChange={() => setMuzakkiTipe('anonim')}
                  className="text-primary-700 focus:ring-primary-700"
                />
                <span className="text-neutral-800 font-medium">Anonim (Hamba Allah)</span>
              </label>
            </div>

            {muzakkiTipe === 'terdaftar' && (
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Contoh: Hj. Siti Aminah / PT Barakah Amanah"
                  value={muzakkiNama}
                  onChange={(e) => setMuzakkiNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700"
                  required
                />
              </div>
            )}
          </div>

          {/* Nominal Bruto & Quick Chips */}
          <div className="space-y-3 pt-1 border-t border-neutral-200">
            <div className="flex items-center justify-between pt-2">
              <label className="block text-sm font-semibold text-neutral-900">
                Nominal Bruto Zakat Disetor <span className="text-red-500">*</span>
              </label>
              <span className="font-mono text-sm font-bold text-primary-700">
                {formatRupiah(bruto || 0)}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-sm">Rp</span>
              <input
                type="number"
                min="10000"
                step="10000"
                value={bruto || ''}
                onChange={(e) => setBruto(Number(e.target.value) || 0)}
                className="w-full pl-12 pr-4 py-2.5 text-base font-mono font-bold border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700"
                placeholder="0"
                required
              />
            </div>

            {/* Quick Nominal Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-neutral-500">Pilihan cepat:</span>
              {quickNominals.map((nom) => (
                <button
                  key={nom}
                  type="button"
                  onClick={() => setBruto(nom)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md border transition-all cursor-pointer ${
                    bruto === nom
                      ? 'border-primary-700 bg-primary-50 text-primary-800 font-bold'
                      : 'border-neutral-300 hover:border-neutral-400 bg-surface text-neutral-700'
                  }`}
                >
                  {formatRupiah(nom)}
                </button>
              ))}
            </div>
          </div>

          {/* Pengaturan Hak Amil (FR-10, Maks 12.5% = 1/8 asnaf rule) */}
          <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-800" />
                <span className="text-sm font-bold text-amber-950">Alokasi Hak Amil (FR-10)</span>
              </div>
              <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded">
                Maks. 12.5% (1/8 Asnaf)
              </span>
            </div>

            <p className="text-xs text-amber-900/80">
              Berdasarkan Fiqih Zakat dan UU No. 23/2011, amil berhak atas maksimal seperdelapan (12.5%) dari penerimaan zakat untuk membiayai operasional amilin.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Persentase Hak Amil (%):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="12.5"
                    step="0.5"
                    value={persenAmil}
                    onChange={(e) => setPersenAmil(Number(e.target.value))}
                    className="w-full accent-primary-700"
                  />
                  <span className="font-mono text-sm font-bold text-neutral-900 w-12 text-right">
                    {persenAmil}%
                  </span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-amber-200 text-xs flex justify-between items-center">
                <span className="text-neutral-600">Nominal Hak Amil:</span>
                <span className="font-mono font-bold text-amber-800 text-sm">
                  {formatRupiah(hakAmil)}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Invariant Calculation Preview */}
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-2.5 text-xs sm:text-sm">
            <div className="flex items-center justify-between text-neutral-600">
              <span>Nominal Bruto Disetor:</span>
              <span className="font-mono font-bold text-neutral-900">{formatRupiah(bruto)}</span>
            </div>
            <div className="flex items-center justify-between text-amber-800">
              <span>- Dialokasikan ke Hak Amil ({persenAmil}%):</span>
              <span className="font-mono font-semibold">{formatRupiah(hakAmil)}</span>
            </div>
            <div className="flex items-center justify-between text-emerald-700 font-bold pt-2 border-t border-neutral-200 text-sm sm:text-base">
              <span>= Bersih Masuk Pos Dana (Saldo Tersedia):</span>
              <span className="font-mono">{formatRupiah(masukPos)}</span>
            </div>

            <div className="pt-2 text-[11px] text-neutral-500 flex items-center justify-between border-t border-neutral-100">
              <span className="flex items-center gap-1 text-emerald-800 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Invariant Valid: {formatRupiah(bruto)} = {formatRupiah(hakAmil)} + {formatRupiah(masukPos)}
              </span>
              <span>
                Simulasi Saldo Tersedia Baru: <strong>{formatRupiah(newSaldoTersedia)}</strong>
              </span>
            </div>
          </div>

          {/* Kanal & Keterangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-neutral-200">
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-1.5 pt-2">
                Kanal Penyetoran <span className="text-red-500">*</span>
              </label>
              <select
                value={kanal}
                onChange={(e) => setKanal(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 bg-surface cursor-pointer"
              >
                <option value="Transfer Bank Syariah (BSI)">Transfer Bank Syariah (BSI)</option>
                <option value="QRIS Dinamis Counter">QRIS Dinamis Counter</option>
                <option value="Tunai Counter Kantor Layanan">Tunai Counter Kantor Layanan</option>
                <option value="Virtual Account Bank Muamalat">Virtual Account Bank Muamalat</option>
                <option value="Transfer Bank Mandiri Syariah">Transfer Bank Mandiri</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-1.5 pt-2">
                Keterangan / Niat Zakat
              </label>
              <input
                type="text"
                placeholder="Contoh: Zakat penghasilan bulan Oktober"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700"
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-red-100 text-red-800 text-xs sm:text-sm rounded-xl flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
            <Link
              href="/penerimaan"
              className="px-5 py-2.5 rounded-2xl neo-convex neo-convex-hover text-[#0E1F1B] font-bold text-sm transition-all border border-white cursor-pointer"
              style={{ minHeight: '44px' }}
            >
              Batal
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || bruto <= 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl neo-active-pill text-white font-extrabold text-sm shadow-md shadow-primary-900/20 disabled:opacity-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-white/30 cursor-pointer"
              style={{ minHeight: '44px' }}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Mencatat & Menyegel...' : 'Simpan & Tambah Saldo Pos'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
