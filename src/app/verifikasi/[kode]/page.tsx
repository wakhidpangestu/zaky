'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  getSavedPenyaluran,
  getSavedPenerimaan,
  PenyaluranItem,
  PenerimaanItem,
  INITIAL_PENYALURAN,
  INITIAL_PENERIMAAN,
} from '@/lib/store';
import { useStoreSync } from '@/lib/use-store-sync';
import { formatRupiah } from '@/lib/format';
import ZakyLogo from '@/components/zaky-logo';
import PageNavbar from '@/components/navigation/page-navbar';
import StatusBadge from '@/components/status-badge';
import {
  ModalCetakDokumen,
  BuktiSetorCetak,
  SuratPenyaluranCetak,
} from '@/components/cetak/dokumen-cetak';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  AlertTriangle,
  ArrowLeft,
  Lock,
  Layers,
  ExternalLink,
  Users2,
  FileKey,
  Database,
  Printer,
} from 'lucide-react';

function DetailVerifikasiContent() {
  const urlParams = useParams();
  const rawKode = (urlParams?.kode as string) || '';
  const kode = decodeURIComponent(rawKode).toUpperCase().trim();

  const [penyaluran, setPenyaluran] = useState<PenyaluranItem | null>(null);
  const [penerimaan, setPenerimaan] = useState<PenerimaanItem | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const loadResult = () => {
    const penyaluranList = getSavedPenyaluran();
    const penerimaanList = getSavedPenerimaan();

    const foundDist = penyaluranList.find((p) => p.kodeUnik.toUpperCase() === kode);
    const foundRcv = penerimaanList.find((r) => r.kodeUnik.toUpperCase() === kode);

    setPenyaluran(foundDist || null);
    setPenerimaan(foundRcv || null);
    setLoaded(true);
  };

  useEffect(loadResult, [kode]);

  // Hasil verifikasi ikut berubah sendiri bila status kode ini berubah
  // (mis. baru disetujui admin) selagi halaman sedang dibuka
  useStoreSync(loadResult);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-neutral-600">
          <div className="w-5 h-5 border-2 border-primary-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Memeriksa catatan kriptografis...</span>
        </div>
      </div>
    );
  }

  const isFound = Boolean(penyaluran || penerimaan);

  return (
    <div className="min-h-screen bg-canvas text-neutral-900 flex flex-col justify-between">
      {/* Top Header */}
      <PageNavbar variant="verifikasi-detail" backHref="/verifikasi" backLabel="Kembali ke Cek Kode" />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12 sm:pt-28 sm:pb-16 flex-1 w-full space-y-6">
        {/* Availability Cache Banner (AV-01) */}
        <div className="flex items-center justify-between text-xs px-3.5 py-2 bg-neutral-100 rounded-lg text-neutral-600 border border-neutral-200">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-primary-700" />
            Snapshot Ketersediaan Jaringan (AV-01) — Diperbarui 2 menit yang lalu
          </span>
          <span className="font-mono text-[11px] text-neutral-500">Node Sync: 100% Ok</span>
        </div>

        {!isFound ? (
          /* NOT FOUND / INVALID RECORD WARNING (FR-58) */
          <div
            className="bg-surface rounded-2xl border border-red-200 shadow-sm p-6 sm:p-8 space-y-5 text-center"
            style={{ borderRadius: 'var(--zaky-radius-card)' }}
          >
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
                Kode Tidak Ditemukan di Jaringan
              </h1>
              <p className="font-mono text-base font-bold text-red-700">{kode}</p>
              <p className="text-sm text-neutral-600 max-w-lg mx-auto">
                Kode ini tidak tercatat dalam buku besar transaksi resmi lembaga manapun pada jaringan Zaky, atau catatan transaksi tersebut telah diubah di luar konsensus (FR-58).
              </p>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <Link
                href="/verifikasi"
                className="px-5 py-2.5 bg-primary-700 text-white font-semibold rounded-lg text-sm hover:bg-primary-600 transition-colors"
              >
                Coba Kode Lain
              </Link>
            </div>
          </div>
        ) : penyaluran ? (
          /* PENYALURAN VERIFICATION DETAILS */
          <div className="space-y-6 animate-in fade-in">
            {/* Status Card */}
            <div
              className={`p-6 sm:p-8 rounded-2xl border shadow-sm space-y-4 ${
                penyaluran.status === 'tersalurkan'
                  ? 'bg-emerald-50/40 border-emerald-200/80'
                  : penyaluran.status === 'dikonfirmasi'
                  ? 'bg-blue-50/40 border-blue-200/80'
                  : 'bg-amber-50/40 border-amber-200/80'
              }`}
              style={{ borderRadius: 'var(--zaky-radius-card)' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Verifikasi Catatan Penyaluran Zakat
                    </span>
                    <span className="text-neutral-300">•</span>
                    <span className="text-xs font-bold font-mono text-neutral-700">FR-56 / FR-57</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-mono font-extrabold text-neutral-900 tracking-tight">
                    {penyaluran.kodeUnik}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusBadge status={penyaluran.status} />
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Cetak Bukti / PDF</span>
                  </button>
                </div>
              </div>

              {/* Invariant & Integrity message */}
              <div className="flex items-center gap-2.5 text-xs text-neutral-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Catatan ini terikat pada rantai append-only Lembaga A dan memenuhi kaidah reservasi saldo (FR-04).
                </span>
              </div>
            </div>

            {/* Grid of Verified Attributes */}
            <div
              className="bg-surface rounded-2xl border border-neutral-300 shadow-sm p-6 space-y-5"
              style={{ borderRadius: 'var(--zaky-radius-card)' }}
            >
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2 border-b border-neutral-200 pb-3">
                <ShieldCheck className="w-4 h-4 text-primary-700" />
                <span>Detail Penyaluran Terverifikasi</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-neutral-50 rounded-xl">
                  <span className="text-neutral-500 text-xs block">Pos Dana Program:</span>
                  <p className="font-semibold text-neutral-900 mt-0.5">{penyaluran.posNama}</p>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl">
                  <span className="text-neutral-500 text-xs block">Kategori Asnaf:</span>
                  <p className="font-semibold text-neutral-900 capitalize mt-0.5">
                    Asnaf {penyaluran.asnaf} (Sesuai Data Mustahik)
                  </p>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl">
                  <span className="text-neutral-500 text-xs block">Nominal Bantuan Tersalurkan:</span>
                  <p className="font-mono font-bold text-neutral-900 text-base mt-0.5">
                    {formatRupiah(penyaluran.nominal)}
                  </p>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl">
                  <span className="text-neutral-500 text-xs block">Wilayah / Kabupaten Penerima:</span>
                  <p className="font-semibold text-neutral-900 mt-0.5">{penyaluran.kabupaten}</p>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-neutral-500 text-xs block">Nama Penerima Manfaat (Disamarkan, FR-57):</span>
                      <p className="font-bold text-neutral-900 mt-0.5">{penyaluran.mustahikNama}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Data Sensitif Dilindungi UU 27/2022</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-party Signatures Timeline */}
            <div
              className="bg-surface rounded-2xl border border-neutral-300 shadow-sm p-6 space-y-4"
              style={{ borderRadius: 'var(--zaky-radius-card)' }}
            >
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Users2 className="w-4 h-4 text-primary-700" />
                <span>Rantai Persetujuan Multi-Pihak (Multi-Party Validation)</span>
              </h2>

              <div className="space-y-4 text-xs sm:text-sm">
                {/* 1. Amil Pembuat */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900">
                        Dicatat oleh {penyaluran.dibuatOleh}
                      </span>
                      <span className="text-neutral-500 text-xs">{penyaluran.dibuatPada}</span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Unit: {penyaluran.dibuatUnit} • Bukti verifikasi: <code>{penyaluran.namaBerkasBukti}</code>
                    </p>
                  </div>
                </div>

                {/* 2. Konfirmasi Penerima / Dua Saksi */}
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 ${
                    penyaluran.status === 'menunggu_konfirmasi'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900">
                        {penyaluran.metode === 'mustahik'
                          ? 'Konfirmasi Mustahik Langsung (SMS 72 Jam)'
                          : 'Dua Saksi Amil Lintas Unit'}
                      </span>
                      <span className="text-neutral-500 text-xs">
                        {penyaluran.status === 'menunggu_konfirmasi' ? 'Menunggu Konfirmasi' : 'Terkonfirmasi'}
                      </span>
                    </div>
                    {penyaluran.metode === 'saksi' ? (
                      <p className="text-xs text-neutral-600 mt-0.5">
                        Saksi 1: {penyaluran.saksi1Nama || 'Saksi Dewi (Unit Keuangan)'} • Saksi 2: {penyaluran.saksi2Nama || 'Saksi Rian (Unit Kepegawaian)'}
                      </p>
                    ) : (
                      <p className="text-xs text-neutral-600 mt-0.5">
                        Terkonfirmasi melalui token rahasia sekali pakai yang dikirim ke nomor mustahik.
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Penyetuju Unit Lain */}
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 ${
                    penyaluran.status === 'tersalurkan'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}>
                    3
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900">
                        Persetujuan Otorisator Lintas Unit (FR-30)
                      </span>
                      <span className="text-neutral-500 text-xs">
                        {penyaluran.penyetujuWaktu || (penyaluran.status === 'tersalurkan' ? '25 Okt 14.45' : 'Menunggu')}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      Penyetuju: {penyaluran.penyetujuNama || 'Penyetuju Hari'} ({penyaluran.penyetujuUnit || 'Unit Keuangan'}) — Unit berbeda dari amil pembuat.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic Witness Card (Feature C & Papan Silang) */}
            <div
              className="bg-surface rounded-2xl border border-neutral-300 shadow-sm p-6 space-y-4"
              style={{ borderRadius: 'var(--zaky-radius-card)' }}
            >
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileKey className="w-4 h-4 text-primary-700" />
                  <span className="font-bold text-sm text-neutral-900">Bukti Kriptografis & Saksi Antarlembaga</span>
                </div>
                <Link
                  href="/silang"
                  className="text-xs text-primary-700 hover:text-primary-800 font-semibold flex items-center gap-1"
                >
                  <span>Lihat Papan Silang</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-neutral-500 block mb-0.5">SHA-256 Bukti Berkas:</span>
                  <div className="p-2.5 bg-neutral-100 rounded-lg font-mono text-[11px] text-neutral-800 break-all border border-neutral-200">
                    {penyaluran.hashSha256 || '9f83c605d4c82b3e925bce3269f14e491a0c7148582103714f7b4e8391ac697c'}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-950 text-xs">Lembaga B (Dompet Dhuafa Node)</p>
                      <p className="text-[11px] text-emerald-800">Tanda tangan Ed25519 valid • Saksi Tersimpan</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-950 text-xs">Lembaga C (Rumah Zakat Node)</p>
                      <p className="text-[11px] text-emerald-800">Tanda tangan Ed25519 valid • Saksi Tersimpan</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* PENERIMAAN VERIFICATION DETAILS */
          <div className="space-y-6 animate-in fade-in">
            <div
              className="p-6 sm:p-8 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-sm space-y-4"
              style={{ borderRadius: 'var(--zaky-radius-card)' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Tanda Terima Zakat Resmi Terverifikasi
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-mono font-extrabold text-neutral-900 tracking-tight mt-1">
                    {penerimaan?.kodeUnik}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    Sah & Tercatat
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Cetak Bukti / PDF</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-2">
                <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                  <span className="text-neutral-500 text-xs block">Muzakki:</span>
                  <p className="font-bold text-neutral-900 mt-0.5">{penerimaan?.muzakkiNama}</p>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                  <span className="text-neutral-500 text-xs block">Pos Dana:</span>
                  <p className="font-semibold text-neutral-900 mt-0.5">{penerimaan?.posNama}</p>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                  <span className="text-neutral-500 text-xs block">Nominal Bruto:</span>
                  <p className="font-mono font-bold text-neutral-900 text-base mt-0.5">
                    {formatRupiah(penerimaan?.bruto || 0)}
                  </p>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                  <span className="text-neutral-500 text-xs block">Bersih Masuk Pos Dana:</span>
                  <p className="font-mono font-bold text-emerald-700 text-base mt-0.5">
                    {formatRupiah(penerimaan?.masukPos || 0)}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg font-mono text-[11px] text-neutral-600 break-all border border-neutral-200">
                <span className="font-sans font-semibold text-neutral-700 block mb-0.5">Segel Hash Transaksi:</span>
                {penerimaan?.hashSha256}
              </div>
            </div>
          </div>
        )}

        {/* Modal Pratinjau Dokumen Cetak / PDF */}
        <ModalCetakDokumen
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          judul={
            penyaluran
              ? `Surat Bukti Penyaluran — ${penyaluran.kodeUnik}`
              : `Bukti Penerimaan — ${penerimaan?.kodeUnik}`
          }
        >
          {penyaluran ? (
            <SuratPenyaluranCetak item={penyaluran} />
          ) : penerimaan ? (
            <BuktiSetorCetak item={penerimaan} />
          ) : null}
        </ModalCetakDokumen>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-500">
        <p>Zaky v4.0 — Jaringan Verifikasi Penyaluran Zakat Antarlembaga (UINIC 8.0)</p>
      </footer>
    </div>
  );
}

export default function DetailVerifikasiPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
          <div className="flex items-center gap-3 text-neutral-600">
            <div className="w-5 h-5 border-2 border-primary-700 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Memeriksa catatan kriptografis...</span>
          </div>
        </div>
      }
    >
      <DetailVerifikasiContent />
    </Suspense>
  );
}
