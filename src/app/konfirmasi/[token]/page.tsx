'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
import ZakyLogo from '@/components/zaky-logo';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  HeartHandshake,
} from 'lucide-react';

function KonfirmasiMustahikContent() {
  const urlParams = useParams();
  const rawToken = (urlParams?.token as string) || '';
  const token = decodeURIComponent(rawToken).trim();

  const [item, setItem] = useState<PenyaluranItem | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionDone, setActionDone] = useState<'terima' | 'tolak' | null>(null);
  const [alasanTolak, setAlasanTolak] = useState('Nominal belum diterima secara fisik');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const loadItem = () => {
    const list = getSavedPenyaluran();
    // Cari berdasarkan tokenHash atau kodeUnik atau fallback ke item pertama jika demo
    let found = list.find((p) => p.tokenHash === token || p.kodeUnik.toLowerCase() === token.toLowerCase());
    if (!found && list.length > 0) {
      // Demo fallback to first item awaiting confirmation
      found = list.find((p) => p.status === 'menunggu_konfirmasi') || list[0];
    }
    setItem(found || null);
    setLoaded(true);
  };

  useEffect(loadItem, [token]);

  // Status tersegar sendiri selama halaman ditunggu (mis. pengajuan dibatalkan
  // atau disahkan pihak lain), tanpa mustahik me-refresh tautan ini
  useStoreSync(loadItem);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-primary-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-600 font-medium">Memuat tautan konfirmasi aman...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface p-6 rounded-2xl border border-neutral-300 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
          <h1 className="text-lg font-bold text-neutral-900">Tautan Tidak Ditemukan</h1>
          <p className="text-xs text-neutral-600">
            Tautan konfirmasi penerimaan zakat ini tidak valid atau telah kedaluwarsa.
          </p>
          <Link
            href="/verifikasi"
            className="inline-block px-4 py-2 bg-primary-700 text-white rounded-lg text-xs font-semibold"
          >
            Buka Verifikasi Publik
          </Link>
        </div>
      </div>
    );
  }

  // Cek apakah sudah pernah dipakai (AC-11)
  const isAlreadyProcessed = item.status !== 'menunggu_konfirmasi' && !actionDone;

  const handleKonfirmasiTerima = () => {
    setIsSubmitting(true);

    const allPenyaluran = getSavedPenyaluran();
    const updated = allPenyaluran.map((p) => {
      if (p.id === item.id) {
        return {
          ...p,
          status: 'dikonfirmasi' as const,
        };
      }
      return p;
    });

    savePenyaluran(updated);
    setItem({ ...item, status: 'dikonfirmasi' });

    setTimeout(() => {
      setIsSubmitting(false);
      setActionDone('terima');
    }, 400);
  };

  const handleKonfirmasiTolak = () => {
    setIsSubmitting(true);

    // FR-05 & AC-10: Mustahik menolak -> status ditolak_penerima, saldo reservasi dilepas kembali ke saldo_tersedia
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
          status: 'ditolak_penerima' as const,
          alasanTolak,
        };
      }
      return p;
    });

    savePosDana(updatedPos);
    savePenyaluran(updatedPenyaluran);

    setTimeout(() => {
      setIsSubmitting(false);
      setActionDone('tolak');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-canvas text-neutral-900 flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* Header Mobile Brand */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <ZakyLogo size={28} className="text-primary-700" />
          <div>
            <h2 className="font-bold text-sm text-neutral-900 leading-none">Zaky</h2>
            <p className="text-[10px] text-neutral-500 mt-0.5">Lembaga Amil Zakat A</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tautan Resmi Terenkripsi</span>
        </div>
      </div>

      {/* Main Body (One Column, Touch-friendly) */}
      <main className="max-w-md mx-auto w-full my-auto py-6 space-y-5">
        {actionDone === 'terima' || item.status === 'dikonfirmasi' || item.status === 'tersalurkan' ? (
          /* TERIMA SUCCESS STATE */
          <div
            className="bg-surface rounded-2xl border border-emerald-200 p-6 sm:p-8 text-center space-y-4 shadow-sm animate-in fade-in zoom-in-95"
            style={{ borderRadius: 'var(--zaky-radius-card)' }}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-800">
                Alhamdulillah
              </span>
              <h1 className="text-xl font-bold text-neutral-900">
                Konfirmasi Berhasil Diterima
              </h1>
              <p className="text-xs text-neutral-600">
                Terima kasih, konfirmasi Anda telah tercatat sah pada sistem Zaky dan siap diproses persetujuannya oleh Unit Keuangan.
              </p>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-500">Kode Penyaluran:</span>
                <span className="font-mono font-bold text-neutral-900">{item.kodeUnik}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Nominal:</span>
                <span className="font-mono font-bold text-neutral-900">{formatRupiah(item.nominal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Status Saat Ini:</span>
                <span className="text-emerald-700 font-bold">Dikonfirmasi Penerima</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400">
              Semoga dana zakat ini memberikan berkah dan manfaat bagi Bapak/Ibu sekeluarga. Aamiin.
            </p>
          </div>
        ) : actionDone === 'tolak' || item.status === 'ditolak_penerima' ? (
          /* TOLAK STATE (AC-10) */
          <div
            className="bg-surface rounded-2xl border border-amber-200 p-6 sm:p-8 text-center space-y-4 shadow-sm animate-in fade-in zoom-in-95"
            style={{ borderRadius: 'var(--zaky-radius-card)' }}
          >
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
              <XCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-neutral-900">
                Pernyataan Penolakan Dicatat
              </h1>
              <p className="text-xs text-neutral-600">
                Laporan penolakan Anda telah kami rekam demi menjaga integritas amanah donatur. Saldo yang dicadangkan telah dibatalkan secara otomatis (AC-10).
              </p>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl text-xs text-neutral-700 border border-neutral-200 text-left">
              <span className="text-neutral-500 block mb-0.5">Alasan:</span>
              <p className="font-medium text-neutral-900">{item.alasanTolak || alasanTolak}</p>
            </div>
          </div>
        ) : isAlreadyProcessed ? (
          /* ALREADY USED STATE (AC-11) */
          <div
            className="bg-surface rounded-2xl border border-neutral-300 p-6 text-center space-y-4 shadow-sm"
            style={{ borderRadius: 'var(--zaky-radius-card)' }}
          >
            <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-600 mx-auto flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-neutral-900">Tautan Sudah Pernah Digunakan</h1>
            <p className="text-xs text-neutral-600">
              Tautan konfirmasi sekali pakai ini telah diproses sebelumnya. Status penyaluran saat ini: <strong className="text-neutral-900 capitalize">{item.status.replace('_', ' ')}</strong> (AC-11).
            </p>
          </div>
        ) : (
          /* ACTIVE CONFIRMATION FORM (FR-21 to FR-24) */
          <div
            className="bg-surface rounded-2xl border border-neutral-300 p-6 sm:p-7 space-y-6 shadow-sm"
            style={{ borderRadius: 'var(--zaky-radius-card)' }}
          >
            {/* Greeting & Time limit indicator */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>Masa berlaku konfirmasi: <strong>72 Jam</strong> (FR-21)</span>
              </div>

              <h1 className="text-xl font-bold text-neutral-900 pt-1">
                Konfirmasi Penerimaan Manfaat Zakat
              </h1>

              <p className="text-xs text-neutral-600 leading-relaxed">
                Assalamu’alaikum Warahmatullahi Wabarakatuh.<br />
                Bapak/Ibu terdaftar sebagai penerima bantuan zakat dari <strong>Lembaga Amil Zakat A</strong>. Mohon konfirmasi apakah bantuan berikut telah Anda terima:
              </p>
            </div>

            {/* Assistance Card */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
              <div>
                <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
                  Nominal Bantuan
                </span>
                <p className="font-mono text-2xl font-extrabold text-primary-700 mt-0.5">
                  {formatRupiah(item.nominal)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200 text-xs">
                <div>
                  <span className="text-neutral-500">Program / Pos:</span>
                  <p className="font-semibold text-neutral-900">{item.posNama}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Penerima Terdaftar:</span>
                  <p className="font-semibold text-neutral-900">{item.mustahikNama} ({item.kabupaten})</p>
                </div>
              </div>
            </div>

            {/* Action Buttons: Min 52px Touch-target per PRD */}
            {!showRejectForm ? (
              <div className="space-y-3 pt-2">
                {/* 1. Menerima (Green, Primary, 52px) */}
                <button
                  type="button"
                  onClick={handleKonfirmasiTerima}
                  disabled={isSubmitting}
                  className="w-full h-[52px] bg-primary-700 hover:bg-primary-600 active:scale-[0.99] text-white font-bold text-base rounded-xl flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer"
                  style={{ minHeight: '52px' }}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{isSubmitting ? 'Memproses...' : 'Saya Menerima'}</span>
                </button>

                {/* 2. Tidak Menerima (Secondary, 52px) */}
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isSubmitting}
                  className="w-full h-[52px] border border-neutral-300 hover:border-red-400 hover:bg-red-50/50 text-neutral-700 hover:text-red-700 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  style={{ minHeight: '52px' }}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Saya Tidak Menerima / Tidak Sesuai</span>
                </button>
              </div>
            ) : (
              /* REJECT REASON FORM */
              <div className="space-y-4 pt-1 animate-in fade-in">
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800">
                  <p className="font-semibold mb-1">Konfirmasi Penolakan</p>
                  <p>Silakan pilih alasan Anda tidak menerima dana bantuan ini untuk audit lembaga:</p>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    'Nominal belum saya terima secara fisik/transfer',
                    'Nominal yang saya terima berbeda dari yang tertera',
                    'Salah orang / saya merasa sudah mampu dan tidak berhak',
                    'Lainnya',
                  ].map((alasan) => (
                    <label
                      key={alasan}
                      onClick={() => setAlasanTolak(alasan)}
                      className={`p-3 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-colors ${
                        alasanTolak === alasan
                          ? 'border-red-400 bg-red-50 text-red-900 font-semibold'
                          : 'border-neutral-200 bg-surface text-neutral-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="alasan"
                        checked={alasanTolak === alasan}
                        onChange={() => setAlasanTolak(alasan)}
                        className="text-red-600 focus:ring-red-600"
                      />
                      <span>{alasan}</span>
                    </label>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1 py-3 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Kembali
                  </button>

                  <button
                    type="button"
                    onClick={handleKonfirmasiTolak}
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isSubmitting ? 'Merekam...' : 'Kirim Penolakan'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full text-center text-[11px] text-neutral-500 pt-4 border-t border-neutral-200">
        <p>Zaky v4.0 — Tautan ini dienkripsi dengan HMAC-SHA256.</p>
        <p className="mt-0.5">Tidak untuk disebarluaskan kepada pihak lain.</p>
      </footer>
    </div>
  );
}

export default function KonfirmasiMustahikPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
          <div className="text-center space-y-2">
            <div className="w-6 h-6 border-2 border-primary-700 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-neutral-600 font-medium">Memuat konfirmasi...</p>
          </div>
        </div>
      }
    >
      <KonfirmasiMustahikContent />
    </Suspense>
  );
}
