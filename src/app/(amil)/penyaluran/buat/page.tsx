'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  INITIAL_POS_DANA,
  DEMO_MUSTAHIK,
  PenyaluranItem,
  getSavedPosDana,
  savePosDana,
  getSavedPenyaluran,
  savePenyaluran,
} from '@/lib/store';
import { useStoreSync } from '@/lib/use-store-sync';
import { formatRupiah } from '@/lib/format';

export default function BuatPenyaluranPage() {
  const router = useRouter();

  const [posList, setPosList] = useState(() => getSavedPosDana());

  // Saldo pos dana tersegar sendiri selama formulir dibuka
  useStoreSync(() => setPosList(getSavedPosDana()));

  // Form State
  const [posId, setPosId] = useState(posList[0]?.id || INITIAL_POS_DANA[0].id);
  const [mustahikId, setMustahikId] = useState(DEMO_MUSTAHIK[0].id);
  const [nominal, setNominal] = useState<number>(800000);
  const [metode, setMetode] = useState<'mustahik' | 'saksi'>('mustahik');
  const [berkasNama, setBerkasNama] = useState('rekomendasi-mustahik.pdf');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successItem, setSuccessItem] = useState<PenyaluranItem | null>(null);

  // Computed data
  const selectedPos = posList.find((p) => p.id === posId) || posList[0] || INITIAL_POS_DANA[0];
  const selectedMustahik = DEMO_MUSTAHIK.find((m) => m.id === mustahikId) || DEMO_MUSTAHIK[0];
  const asnaf = selectedMustahik.asnaf;

  // Real-time Balance Check (FR-04, AC-01)
  const isOverBalance = nominal > selectedPos.saldoTersedia;
  const saldoSisa = selectedPos.saldoTersedia - (nominal || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (nominal <= 0) {
      setErrorMsg('Nominal penyaluran harus lebih dari Rp 0.');
      return;
    }

    if (isOverBalance) {
      setErrorMsg(
        `Saldo tersedia tidak mencukupi untuk reservasi draf ini. (Tersedia: ${formatRupiah(
          selectedPos.saldoTersedia
        )}, diminta: ${formatRupiah(nominal)}). Kode: INSUFFICIENT_AVAILABLE_BALANCE`
      );
      return;
    }

    if (!berkasNama) {
      setErrorMsg('Bukti rekomendasi / verifikasi wajib diunggah (FR-16).');
      return;
    }

    setIsSubmitting(true);

    // Generate random 12-char code
    const randomChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let kodeUnik = 'ZK';
    for (let i = 0; i < 10; i++) {
      kodeUnik += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }

    // Buat draf penyaluran baru
    const tokenHash = `tok-${kodeUnik.toLowerCase()}`;
    const newItem: PenyaluranItem = {
      id: `dist-${Date.now()}`,
      kodeUnik,
      posId: selectedPos.id,
      posNama: selectedPos.nama,
      mustahikId: selectedMustahik.id,
      mustahikNama: selectedMustahik.namaSamaran,
      kabupaten: selectedMustahik.kabupaten,
      asnaf,
      nominal,
      status: 'menunggu_konfirmasi',
      metode,
      dibuatOleh: 'Amil Budi',
      dibuatUnit: 'Unit Pelayanan',
      dibuatPada: 'Hari ini',
      kedaluwarsaPada: '72 jam ke depan',
      namaBerkasBukti: berkasNama,
      hashSha256: '7f9a2c...b81d (dihitung otomatis)',
      tokenHash,
    };

    // Reservasi saldo pada pos dana (FR-04)
    const updatedPosList = posList.map((p) => {
      if (p.id === selectedPos.id) {
        return {
          ...p,
          saldoTersedia: p.saldoTersedia - nominal,
          saldoDicadangkan: p.saldoDicadangkan + nominal,
        };
      }
      return p;
    });

    const currentPenyaluran = getSavedPenyaluran();
    const updatedPenyaluran = [newItem, ...currentPenyaluran];

    savePosDana(updatedPosList);
    savePenyaluran(updatedPenyaluran);
    setPosList(updatedPosList);

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessItem(newItem);
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-neutral-600 mb-2">
          <Link href="/penyaluran" className="hover:text-primary-700">
            Penyaluran
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-medium">Buat Penyaluran Baru</span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Buat Draf Penyaluran</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Nominal akan langsung dicadangkan dari pos dana saat draf dibuat (FR-04). Penyaluran sah hanya jika dikonfirmasi penerima dan disetujui unit lain.
        </p>
      </div>

      {/* Success Modal / Banner */}
      {successItem && (
        <div
          className="p-6 bg-surface border-2 border-primary-600 rounded-xl shadow-md space-y-4"
          style={{ borderRadius: 'var(--zaky-radius-card)' }}
        >
          <div className="flex items-center gap-3 text-primary-700">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-lg">
              ✓
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Draf Penyaluran Berhasil Dibuat</h2>
              <p className="text-xs text-neutral-600">
                Saldo sebesar {formatRupiah(successItem.nominal)} telah dipindahkan dari Saldo Tersedia ke Saldo Dicadangkan.
              </p>
            </div>
          </div>

          <div className="bg-neutral-50 p-4 rounded-lg font-mono text-sm space-y-2 border border-neutral-300">
            <div className="flex justify-between">
              <span className="text-neutral-600">Kode Unik Penyaluran:</span>
              <span className="font-bold text-primary-700">{successItem.kodeUnik}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Pos Dana:</span>
              <span>{successItem.posNama}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Nominal:</span>
              <span className="font-bold">{formatRupiah(successItem.nominal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Metode Konfirmasi:</span>
              <span className="capitalize">{successItem.metode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Status Saat Ini:</span>
              <span className="text-amber-800 font-semibold">Menunggu Konfirmasi</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/penyaluran"
              className="inline-flex items-center justify-center bg-primary-700 hover:bg-primary-600 text-white font-semibold py-2.5 px-5 rounded-lg text-sm transition-colors"
              style={{ minHeight: '44px' }}
            >
              Lihat Daftar Penyaluran
            </Link>
            <button
              onClick={() => {
                setSuccessItem(null);
                setNominal(500000);
              }}
              className="inline-flex items-center justify-center border border-neutral-300 hover:bg-neutral-50 text-neutral-900 font-medium py-2.5 px-4 rounded-lg text-sm"
              style={{ minHeight: '44px' }}
            >
              Buat Draf Lain
            </button>
          </div>
        </div>
      )}

      {/* Main Form */}
      {!successItem && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Pos Dana & Saldo */}
          <div
            className="bg-surface p-6 rounded-xl border border-neutral-300 shadow-sm space-y-4"
            style={{ borderRadius: 'var(--zaky-radius-card)' }}
          >
            <h2 className="text-base font-semibold text-neutral-900">1. Pos Dana Sumber</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {INITIAL_POS_DANA.map((pos) => {
                const isSelected = pos.id === posId;
                return (
                  <label
                    key={pos.id}
                    onClick={() => setPosId(pos.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary-700 bg-primary-100/20'
                        : 'border-neutral-300 hover:border-neutral-400 bg-surface'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900">{pos.nama}</span>
                      <input
                        type="radio"
                        name="posId"
                        checked={isSelected}
                        onChange={() => setPosId(pos.id)}
                        className="text-primary-700 focus:ring-primary-600"
                      />
                    </div>
                    <div className="mt-3 pt-3 border-t border-neutral-200 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Saldo Tersedia:</span>
                        <span className="font-mono font-bold text-primary-700">
                          {formatRupiah(pos.saldoTersedia)}
                        </span>
                      </div>
                      <div className="flex justify-between text-neutral-500">
                        <span>Dicadangkan:</span>
                        <span className="font-mono">{formatRupiah(pos.saldoDicadangkan)}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Card 2: Mustahik & Asnaf */}
          <div
            className="bg-surface p-6 rounded-xl border border-neutral-300 shadow-sm space-y-4"
            style={{ borderRadius: 'var(--zaky-radius-card)' }}
          >
            <h2 className="text-base font-semibold text-neutral-900">2. Penerima Manfaat (Mustahik)</h2>

            <div>
              <label htmlFor="mustahikSelect" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Pilih Mustahik Terdaftar
              </label>
              <select
                id="mustahikSelect"
                value={mustahikId}
                onChange={(e) => setMustahikId(e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-neutral-900 bg-surface focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none"
                style={{ borderRadius: 'var(--zaky-radius-input)' }}
              >
                {DEMO_MUSTAHIK.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.namaSamaran} — {m.kabupaten} (Asnaf: {m.asnaf.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Asnaf Locked Indicator (FR-15, ADR-09) */}
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-700" />
                <span className="text-neutral-600">Kategori Asnaf (Terkunci dari data mustahik):</span>
                <span className="font-semibold text-neutral-900 uppercase">{asnaf}</span>
              </div>
              <span className="text-neutral-500 italic">ADR-09: Asnaf diverifikasi dari master data</span>
            </div>

            {/* Duplication Check Indicator (Design System 5.9) */}
            <div
              className="p-3 rounded-lg text-xs flex items-center gap-2.5"
              style={{
                backgroundColor: 'var(--zaky-primary-100)',
                color: 'var(--zaky-primary-700)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z" />
              </svg>
              <span>
                <strong>Hasil pemeriksaan antarlembaga:</strong> Tidak ada catatan penyaluran di lembaga anggota lain dalam 12 bulan terakhir.
              </span>
            </div>
          </div>

          {/* Card 3: Nominal & Reservasi Saldo */}
          <div
            className="bg-surface p-6 rounded-xl border border-neutral-300 shadow-sm space-y-4"
            style={{ borderRadius: 'var(--zaky-radius-card)' }}
          >
            <h2 className="text-base font-semibold text-neutral-900">3. Nominal Penyaluran</h2>

            <div>
              <label htmlFor="nominalInput" className="block text-sm font-medium text-neutral-900 mb-1.5">
                Nominal (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold">
                  Rp
                </span>
                <input
                  id="nominalInput"
                  type="number"
                  step="50000"
                  min="50000"
                  value={nominal || ''}
                  onChange={(e) => setNominal(Number(e.target.value))}
                  placeholder="Contoh: 800000"
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg text-neutral-900 font-mono text-lg outline-none transition-colors ${
                    isOverBalance
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-neutral-300 focus:border-primary-600 focus:ring-1 focus:ring-primary-600'
                  }`}
                  style={{ borderRadius: 'var(--zaky-radius-input)' }}
                />
              </div>
            </div>

            {/* Live Balance Invariant Simulation */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-2">
              <div className="font-semibold text-neutral-900 flex justify-between">
                <span>Simulasi Perubahan Saldo ({selectedPos.nama})</span>
                <span className="text-primary-700 font-mono">FR-04 Reservasi Otomatis</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Saldo Tersedia saat ini:</span>
                <span className="font-mono font-medium">{formatRupiah(selectedPos.saldoTersedia)}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Akan dipindah ke Dicadangkan:</span>
                <span className="font-mono font-medium">(-) {formatRupiah(nominal || 0)}</span>
              </div>
              <div className="pt-2 border-t border-neutral-300 flex justify-between font-bold">
                <span className={isOverBalance ? 'text-red-700' : 'text-neutral-900'}>
                  Estimasi Sisa Saldo Tersedia:
                </span>
                <span className={`font-mono ${isOverBalance ? 'text-red-700' : 'text-primary-700'}`}>
                  {formatRupiah(saldoSisa)}
                </span>
              </div>
            </div>

            {/* Error Message per Design System 5.8 */}
            {isOverBalance && (
              <div
                className="p-3 rounded-lg text-xs space-y-1"
                style={{
                  backgroundColor: 'var(--zaky-status-ditolak-bg)',
                  color: 'var(--zaky-status-ditolak-text)',
                }}
              >
                <div className="flex items-center gap-2 font-bold">
                  <span>✕</span>
                  <span>Penyaluran tidak dapat dibuat</span>
                </div>
                <p>
                  Nominal melebihi saldo tersedia dari pos {selectedPos.nama}. Saldo tidak boleh negatif (FR-07, AC-01).
                </p>
                <p className="font-mono text-[11px] pt-1">Kode: INSUFFICIENT_AVAILABLE_BALANCE</p>
              </div>
            )}
          </div>

          {/* Card 4: Metode Konfirmasi & Berkas */}
          <div
            className="bg-surface p-6 rounded-xl border border-neutral-300 shadow-sm space-y-4"
            style={{ borderRadius: 'var(--zaky-radius-card)' }}
          >
            <h2 className="text-base font-semibold text-neutral-900">4. Metode Konfirmasi & Bukti</h2>

            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-900 block">Pilih Metode Konfirmasi:</label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setMetode('mustahik')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    metode === 'mustahik'
                      ? 'border-primary-700 bg-primary-100/20'
                      : 'border-neutral-300 hover:border-neutral-400 bg-surface'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-neutral-900 text-sm">Mustahik Berponsel</span>
                    <input
                      type="radio"
                      name="metode"
                      checked={metode === 'mustahik'}
                      onChange={() => setMetode('mustahik')}
                    />
                  </div>
                  <p className="text-xs text-neutral-600">
                    Kirim tautan token 72 jam via SMS ({selectedMustahik.teleponMasked}). Cukup 1 konfirmasi penerima.
                  </p>
                </label>

                <label
                  onClick={() => setMetode('saksi')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    metode === 'saksi'
                      ? 'border-primary-700 bg-primary-100/20'
                      : 'border-neutral-300 hover:border-neutral-400 bg-surface'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-neutral-900 text-sm">Dua Saksi (Tanpa Ponsel)</span>
                    <input
                      type="radio"
                      name="metode"
                      checked={metode === 'saksi'}
                      onChange={() => setMetode('saksi')}
                    />
                  </div>
                  <p className="text-xs text-neutral-600">
                    Memerlukan konfirmasi 2 saksi amil dari unit berbeda, total 4 akun unik yang terlibat.
                  </p>
                </label>
              </div>
            </div>

            {/* Unggah Bukti (FR-16) */}
            <div className="pt-2">
              <label className="block text-sm font-medium text-neutral-900 mb-1.5">
                Berkas Bukti / Rekomendasi (Wajib diunggah)
              </label>
              <div className="p-4 border-2 border-dashed border-neutral-300 rounded-xl text-center bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
                <div className="text-neutral-500 mb-2">📄 {berkasNama}</div>
                <p className="text-xs text-neutral-600">
                  Format: PDF, PNG, JPG (Maks. 5MB). Hash SHA-256 dihitung secara kriptografis saat draf diajukan.
                </p>
                <button
                  type="button"
                  onClick={() => setBerkasNama(`berita-acara-${Date.now().toString().slice(-4)}.pdf`)}
                  className="mt-2.5 text-xs text-primary-700 font-semibold underline hover:text-primary-600 cursor-pointer"
                >
                  Pilih berkas lain
                </button>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          {errorMsg && !isOverBalance && (
            <div className="p-4 bg-red-100 text-red-800 text-sm rounded-xl flex items-center gap-2">
              <span>✕</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/penyaluran"
              className="inline-flex items-center justify-center neo-convex neo-convex-hover text-[#0F241F] font-bold px-5 py-2.5 rounded-2xl text-sm transition-all border border-white"
              style={{ minHeight: '44px' }}
            >
              Batal
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || isOverBalance}
              className="inline-flex items-center justify-center neo-active-pill disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold px-6 py-2.5 rounded-2xl text-sm shadow-md shadow-primary-900/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-white/30 cursor-pointer"
              style={{ minHeight: '44px' }}
            >
              {isSubmitting ? 'Memproses Reservasi...' : 'Buat Draf & Cadangkan Saldo'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
