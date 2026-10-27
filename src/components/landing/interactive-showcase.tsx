'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  Layers,
  ArrowRight,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sliders,
  Lock,
  ChevronRight,
  Info,
} from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import KartuSaldo from '@/components/kartu-saldo';
import Card3D from './card-3d';

export default function InteractiveShowcase() {
  const [activeTab, setActiveTab] = useState<'tiga-pihak' | 'saldo-invariant' | 'papan-silang'>('tiga-pihak');

  // State Tab 1
  const [testApproverUnit, setTestApproverUnit] = useState<'keuangan' | 'pelayanan'>('keuangan');
  const [step1Done] = useState(true);
  const [step2Done, setStep2Done] = useState(true);
  const [attemptedApproval, setAttemptedApproval] = useState(false);

  // State Tab 2
  const [totalMasuk, setTotalMasuk] = useState(6000000);
  const [saldoTersedia, setSaldoTersedia] = useState(1000000);
  const [saldoDicadangkan, setSaldoDicadangkan] = useState(800000);
  const [totalTersalurkan, setTotalTersalurkan] = useState(4200000);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // State Tab 3
  const [simulasiSerangan, setSimulasiSerangan] = useState(false);

  const handleBuatDraf = () => {
    const nominal = 300000;
    if (saldoTersedia < nominal) {
      setFeedbackMessage('Saldo tersedia tidak mencukupi untuk membuat draf baru.');
      return;
    }
    setSaldoTersedia((prev) => prev - nominal);
    setSaldoDicadangkan((prev) => prev + nominal);
    setFeedbackMessage(
      `Draf Rp 300.000 dibuat. Saldo langsung dipindahkan dari Tersedia ke Dicadangkan. Invariant: ${formatRupiah(
        saldoTersedia - nominal + saldoDicadangkan + nominal + totalTersalurkan
      )} = ${formatRupiah(totalMasuk)}`
    );
  };

  const handleSetujuiDraf = () => {
    const nominal = 300000;
    if (saldoDicadangkan < nominal) {
      setFeedbackMessage('Tidak ada saldo dicadangkan untuk disetujui.');
      return;
    }
    setSaldoDicadangkan((prev) => prev - nominal);
    setTotalTersalurkan((prev) => prev + nominal);
    setFeedbackMessage(
      `Draf disetujui! Saldo dipindah dari Dicadangkan ke Tersalurkan secara sah. Total dana masuk tetap abadi.`
    );
  };

  const handleBatalkanDraf = () => {
    const nominal = 300000;
    if (saldoDicadangkan < nominal) {
      setFeedbackMessage('Tidak ada reservasi saldo untuk dibatalkan.');
      return;
    }
    setSaldoDicadangkan((prev) => prev - nominal);
    setSaldoTersedia((prev) => prev + nominal);
    setFeedbackMessage(
      `Draf dibatalkan. Reservasi saldo Rp 300.000 dilepas kembali ke Saldo Tersedia secara aman.`
    );
  };

  const handleResetSaldo = () => {
    setTotalMasuk(6000000);
    setSaldoTersedia(1000000);
    setSaldoDicadangkan(800000);
    setTotalTersalurkan(4200000);
    setFeedbackMessage(null);
  };

  return (
    <section id="simulator" className="py-20 md:py-28 bg-[#F7F4ED] border-b border-neutral-300/80 relative scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 gsap-fade-up">
          <h2 className="z-display-2 text-neutral-900">
            Uji Langsung 3 Pilar Keamanan Zaky
          </h2>
          <p className="mt-3 text-neutral-600 text-sm sm:text-base leading-relaxed">
            Rasakan langsung bagaimana mekanisme matematis dan kriptografis Zaky melindungi dana zakat
            tanpa memberi ruang bagi penyalahgunaan wewenang atau manipulasi database.
          </p>

          {/* Neomorphic Flexible Segmented Tabs — Zero Horizontal Scroll, 100% Responsive */}
          <div className="mt-8 w-full max-w-3xl mx-auto p-1.5 sm:p-2 rounded-2xl sm:rounded-full neo-capsule grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('tiga-pihak')}
              className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 text-center ${
                activeTab === 'tiga-pihak'
                  ? 'neo-btn text-white shadow-sm scale-[1.01]'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/60'
              }`}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="truncate sm:whitespace-normal">1. Alur 3-Pihak (Segregasi)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('saldo-invariant')}
              className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 text-center ${
                activeTab === 'saldo-invariant'
                  ? 'neo-btn text-white shadow-sm scale-[1.01]'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/60'
              }`}
            >
              <Sliders className="w-4 h-4 flex-shrink-0" />
              <span className="truncate sm:whitespace-normal">2. Invariant Saldo Kekal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('papan-silang')}
              className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 text-center ${
                activeTab === 'papan-silang'
                  ? 'neo-btn text-white shadow-sm scale-[1.01]'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/60'
              }`}
            >
              <Layers className="w-4 h-4 flex-shrink-0" />
              <span className="truncate sm:whitespace-normal">3. Papan Silang (Anti-Ubah DB)</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            TAB 1: ALUR 3-PIHAK DENGAN SEGREGATION OF DUTIES
           ======================================================== */}
        {activeTab === 'tiga-pihak' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Visual Step Indicator */}
            <div className="lg:col-span-7">
              <Card3D>
                <div
                  className="neo-card-3d p-6 sm:p-8 rounded-3xl space-y-6"
                  style={{ borderRadius: '24px' }}
                >
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900">
                        Penanda Langkah Verifikasi (3 Pihak)
                      </h3>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">
                        Nominal: Rp 800.000 • Asnaf: Fakir • Kode: ZK4B8V2KNT9X
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary-100 text-primary-800">
                      Metode: Mustahik Berponsel
                    </span>
                  </div>

                  {/* Steps */}
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="p-4 rounded-2xl neo-convex flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          1
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-neutral-900">
                            (1) Dibuat oleh Amil
                          </div>
                          <div className="text-xs text-neutral-600 mt-0.5">
                            Amil Budi • <span className="font-semibold text-neutral-800">Unit Pelayanan</span>
                          </div>
                          <p className="text-[11px] text-neutral-600 mt-1 font-mono">
                            Saldo otomatis dipindahkan ke status Dicadangkan
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-primary-700 font-bold shrink-0 self-end sm:self-start">
                        <span>✓</span>
                        <span>27 Okt 09.10</span>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="p-4 rounded-2xl neo-convex flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span
                          className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            step2Done
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          2
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-neutral-900">
                            (2) Dikonfirmasi oleh Penerima (Mustahik)
                          </div>
                          <div className="text-xs text-neutral-600 mt-0.5">
                            Mustahik: Ibu S*** • Via tautan SMS/Web sekali pakai (tanpa akun)
                          </div>
                          <p className="text-[11px] text-neutral-600 mt-1">
                            Penerima mengonfirmasi menerima dana sesuai nominal yang diajukan.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-primary-700 font-bold shrink-0 self-end sm:self-start">
                        <span>✓</span>
                        <span>27 Okt 10.45</span>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div
                      className={`p-4 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                        attemptedApproval && testApproverUnit === 'keuangan'
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : attemptedApproval && testApproverUnit === 'pelayanan'
                          ? 'bg-red-50/70 border-red-300'
                          : 'neo-convex'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span
                          className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            attemptedApproval && testApproverUnit === 'keuangan'
                              ? 'bg-primary-100 text-primary-700'
                              : attemptedApproval && testApproverUnit === 'pelayanan'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-neutral-200 text-neutral-700'
                          }`}
                        >
                          3
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-neutral-900">
                            (3) Disetujui oleh Penyetuju
                          </div>
                          <div className="text-xs text-neutral-600 mt-0.5">
                            Penyetuju Siti •{' '}
                            <span
                              className={`font-semibold ${
                                testApproverUnit === 'keuangan'
                                  ? 'text-primary-700'
                                  : 'text-red-700'
                              }`}
                            >
                              Unit {testApproverUnit === 'keuangan' ? 'Keuangan (Unit Berbeda)' : 'Pelayanan (Unit Sama)'}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-600 mt-1">
                            Wajib akun berbeda dan unit kerja berbeda dari amil pembuat.
                          </p>
                        </div>
                      </div>
                      <div className="text-xs font-semibold shrink-0 self-end sm:self-start">
                        {attemptedApproval && testApproverUnit === 'keuangan' ? (
                          <span className="text-primary-700 flex items-center gap-1 font-bold">
                            <span>✓</span>
                            <span>Disetujui</span>
                          </span>
                        ) : (
                          <span className="text-neutral-600">— Menunggu</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rejection Error Badge */}
                  {attemptedApproval && testApproverUnit === 'pelayanan' && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span>Penyaluran belum dapat disetujui</span>
                      </div>
                      <p className="text-xs text-red-700 leading-relaxed pl-7">
                        Penyetuju harus dari unit yang berbeda dengan pembuat. Pembuat berasal dari Unit Pelayanan, sehingga persetujuan oleh staf Unit Pelayanan diblokir otomatis oleh kode otorisasi.
                      </p>
                      <div className="pl-7 font-mono text-[11px] text-red-900 font-semibold">
                        Kode: SAME_UNIT_APPROVER
                      </div>
                    </div>
                  )}

                  {attemptedApproval && testApproverUnit === 'keuangan' && (
                    <div className="p-4 bg-primary-100/70 border border-primary-200 text-primary-900 rounded-2xl space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm text-primary-700">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Penyaluran Sah dan Tersalurkan!</span>
                      </div>
                      <p className="text-xs text-neutral-700 pl-7 leading-relaxed">
                        Syarat tiga pihak terpenuhi. Saldo dipindahkan ke status Tersalurkan dan entri ditambahkan ke rantai log harian untuk disaksikan lembaga lain.
                      </p>
                    </div>
                  )}
                </div>
              </Card3D>
            </div>

            {/* Right Column: Interactive Test Controls */}
            <div className="lg:col-span-5">
              <Card3D>
                <div
                  className="neo-card-3d p-6 sm:p-8 rounded-3xl space-y-6"
                  style={{ borderRadius: '24px' }}
                >
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">
                      Uji Segregation of Duties
                    </h3>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      Pilih unit kerja pihak yang bertindak sebagai penyetuju untuk menguji pencegahan benturan kepentingan:
                    </p>
                  </div>

                  {/* Selector */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-neutral-700 block uppercase tracking-wider">
                      Pilih Unit Penyetuju:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setTestApproverUnit('keuangan');
                          setAttemptedApproval(false);
                        }}
                        className={`p-3 rounded-2xl text-left transition-all cursor-pointer ${
                          testApproverUnit === 'keuangan'
                            ? 'neo-inset border-primary-600 text-primary-900'
                            : 'neo-convex text-neutral-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-neutral-900">Unit Keuangan</div>
                        <div className="text-[11px] text-neutral-600 mt-0.5">Unit Berbeda (Sah)</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTestApproverUnit('pelayanan');
                          setAttemptedApproval(false);
                        }}
                        className={`p-3 rounded-2xl text-left transition-all cursor-pointer ${
                          testApproverUnit === 'pelayanan'
                            ? 'neo-inset border-red-500 text-red-900'
                            : 'neo-convex text-neutral-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-neutral-900">Unit Pelayanan</div>
                        <div className="text-[11px] text-red-700 mt-0.5">Unit Sama (Konflik)</div>
                      </button>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setAttemptedApproval(true)}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-full neo-btn text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Jalankan Eksekusi Persetujuan</span>
                    </button>
                  </div>

                  {/* Note */}
                  <div className="p-3.5 rounded-2xl neo-inset text-xs text-neutral-600 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                      <Info className="w-4 h-4 text-accent-500" />
                      <span>Standar Fiqih & Good Governance</span>
                    </div>
                    <p className="leading-relaxed">
                      Prinsip ini menjamin amil yang mendata mustahik tidak memiliki wewenang sepihak untuk mencairkan dana tanpa verifikasi independen unit keuangan.
                    </p>
                  </div>
                </div>
              </Card3D>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: SALDO INVARIANT KEKAL
           ======================================================== */}
        {activeTab === 'saldo-invariant' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-4">
              <Card3D>
                <KartuSaldo
                  nama="Zakat Maal (Pos Dana Aktif)"
                  totalMasuk={totalMasuk}
                  tersedia={saldoTersedia}
                  dicadangkan={saldoDicadangkan}
                  tersalurkan={totalTersalurkan}
                />
              </Card3D>

              {/* Invariant Formula Bar */}
              <div className="p-5 rounded-2xl neo-convex font-mono text-xs text-neutral-800 space-y-1.5">
                <div className="font-bold text-neutral-900 text-sm flex items-center justify-between">
                  <span>Rumus Invariant Kekal:</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 font-bold">
                    Status: Valid ✓
                  </span>
                </div>
                <div className="text-neutral-500 pt-1 text-[11px]">
                  total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan
                </div>
                <div className="font-bold text-primary-700 text-sm pt-0.5">
                  {formatRupiah(totalMasuk)} = {formatRupiah(saldoTersedia)} +{' '}
                  {formatRupiah(saldoDicadangkan)} + {formatRupiah(totalTersalurkan)}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <Card3D>
                <div
                  className="neo-card-3d p-6 sm:p-8 rounded-3xl space-y-6"
                  style={{ borderRadius: '24px' }}
                >
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">
                      Simulasi Mutasi Saldo Real-Time
                    </h3>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                      Pada Zaky, dana tidak pernah bisa disalurkan dua kali atau menghasilkan saldo negatif. Uji perpindahan saldo di bawah ini:
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleBuatDraf}
                      disabled={saldoTersedia < 300000}
                      className="p-3 text-left rounded-2xl neo-convex hover:scale-[1.02] disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <div className="text-xs font-bold text-neutral-900">+ Buat Draf Rp 300.000</div>
                      <div className="text-[11px] text-neutral-600 mt-0.5">
                        Tersedia → Dicadangkan
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleSetujuiDraf}
                      disabled={saldoDicadangkan < 300000}
                      className="p-3 text-left rounded-2xl neo-convex hover:scale-[1.02] disabled:opacity-40 transition-all cursor-pointer text-emerald-900 border border-emerald-300"
                    >
                      <div className="text-xs font-bold">✓ Setujui Penyaluran Rp 300.000</div>
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        Dicadangkan → Tersalurkan
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleBatalkanDraf}
                      disabled={saldoDicadangkan < 300000}
                      className="p-3 text-left rounded-2xl neo-convex hover:scale-[1.02] disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <div className="text-xs font-bold text-neutral-900">✕ Batalkan Draf Rp 300.000</div>
                      <div className="text-[11px] text-neutral-600 mt-0.5">
                        Dicadangkan → Tersedia
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetSaldo}
                      className="p-3 text-left rounded-2xl neo-convex hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-neutral-900">Kembalikan Semula</div>
                        <div className="text-[11px] text-neutral-600 mt-0.5">Reset nilai simulasi</div>
                      </div>
                      <RefreshCw className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>

                  {feedbackMessage && (
                    <div className="p-3.5 neo-inset rounded-2xl text-xs text-primary-900 font-medium">
                      {feedbackMessage}
                    </div>
                  )}

                  <div className="border-t border-neutral-100 pt-4 space-y-2 text-xs text-neutral-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary-700 flex-shrink-0" />
                      <span>
                        <strong>Pencegahan Konkurensi:</strong> Baris basis data dikunci selama transaksi reservasi berlangsung.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary-700 flex-shrink-0" />
                      <span>
                        <strong>Tidak Ada Mutasi Antarpos:</strong> Dana Zakat Maal dan Zakat Fitrah terisolasi di jalurnya masing-masing.
                      </span>
                    </div>
                  </div>
                </div>
              </Card3D>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: PAPAN SILANG & DETEKSI PERUBAHAN
           ======================================================== */}
        {activeTab === 'papan-silang' && (
          <div className="space-y-6">
            <div
              className="neo-card-3d p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{ borderRadius: '24px' }}
            >
              <div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                  Konsensus Antarlembaga: Lembaga A, B, dan C Saling Menyaksikan
                </h3>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Setiap pukul 00.00 WIB, setiap lembaga menerbitkan tanda tangan kriptografis dari riwayat transaksi hariannya.
                </p>
              </div>

              {/* Attack simulator switch */}
              <div className="flex items-center gap-3 neo-inset p-2 rounded-full px-4 flex-wrap sm:flex-nowrap flex-shrink-0">
                <span className="text-xs font-semibold text-neutral-800">
                  Simulasi Manipulasi Basis Data:
                </span>
                <button
                  type="button"
                  onClick={() => setSimulasiSerangan(!simulasiSerangan)}
                  className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors cursor-pointer ${
                    simulasiSerangan ? 'bg-amber-600' : 'bg-neutral-300'
                  }`}
                  aria-pressed={simulasiSerangan}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      simulasiSerangan ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {simulasiSerangan && (
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-300 text-orange-950 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm space-y-1">
                  <div className="font-bold text-orange-900">
                    PERINGATAN INTEGRITAS: Perubahan Diam-diam Terdeteksi Seketika!
                  </div>
                  <p className="text-orange-800 leading-relaxed">
                    Seseorang mencoba memodifikasi nominal catatan di database lokal Lembaga Zakat A. Namun, karena hash harian yang ditandatangani kemarin sudah disimpan oleh Lembaga B dan C, hitung ulang hash menghasilkan <code>c441b89...</code> yang berbeda dari hash yang disaksikan <code>9f2c8d1...</code>. Status otomatis beralih menjadi <strong>Tidak Cocok</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* 3D Matrix Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card3D>
                <div
                  className={`neo-card-3d p-6 rounded-3xl h-full flex flex-col justify-between ${
                    simulasiSerangan ? 'border-orange-400 ring-2 ring-orange-200' : ''
                  }`}
                  style={{ borderRadius: '24px' }}
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                      <div>
                        <span className="text-xs font-mono font-bold text-neutral-500">LZ-A</span>
                        <h4 className="text-base font-bold text-neutral-900">Lembaga Zakat A</h4>
                      </div>
                      {simulasiSerangan ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Tidak cocok
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Terkonfirmasi
                        </span>
                      )}
                    </div>

                    <div className="py-4 space-y-3 text-xs">
                      <div>
                        <span className="text-neutral-500 block">Hash Kepala Harian:</span>
                        <code className="font-mono text-[11px] text-neutral-800 font-semibold block truncate neo-inset p-2 rounded-xl mt-0.5">
                          9f2c8d1e3a4b5c6d7e8f901234567890abcdef1234e41a
                        </code>
                      </div>

                      <div>
                        <span className="text-neutral-500 block">Hasil Hitung Ulang:</span>
                        <code
                          className={`font-mono text-[11px] font-semibold block truncate p-2 rounded-xl mt-0.5 ${
                            simulasiSerangan
                              ? 'bg-orange-100 text-orange-900 font-bold border border-orange-300'
                              : 'neo-inset text-neutral-800'
                          }`}
                        >
                          {simulasiSerangan
                            ? 'c441b89ef0321a47b2c99a81230114fe56aa9021bdfc'
                            : '9f2c8d1e3a4b5c6d7e8f901234567890abcdef1234e41a'}
                        </code>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-neutral-600">
                        <span>Saksi Lembaga Lain:</span>
                        <span className="font-bold text-neutral-900">2 Lembaga (B & C)</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/silang"
                    className="mt-3 w-full py-2.5 rounded-full neo-btn-secondary text-xs font-semibold text-center flex items-center justify-center gap-1"
                  >
                    <span>Buka Rincian di Papan Silang</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card3D>

              <Card3D>
                <div
                  className="neo-card-3d p-6 rounded-3xl h-full flex flex-col justify-between"
                  style={{ borderRadius: '24px' }}
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                      <div>
                        <span className="text-xs font-mono font-bold text-neutral-500">LZ-B</span>
                        <h4 className="text-base font-bold text-neutral-900">Lembaga Zakat B</h4>
                      </div>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Terkonfirmasi
                      </span>
                    </div>

                    <div className="py-4 space-y-3 text-xs">
                      <div>
                        <span className="text-neutral-500 block">Hash Kepala Harian:</span>
                        <code className="font-mono text-[11px] text-neutral-800 font-semibold block truncate neo-inset p-2 rounded-xl mt-0.5">
                          7ab01f3e8829cd14a2bf456789012345abcdef123433d1
                        </code>
                      </div>

                      <div>
                        <span className="text-neutral-500 block">Hasil Hitung Ulang:</span>
                        <code className="font-mono text-[11px] neo-inset text-neutral-800 font-semibold block truncate p-2 rounded-xl mt-0.5">
                          7ab01f3e8829cd14a2bf456789012345abcdef123433d1
                        </code>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-neutral-600">
                        <span>Saksi Lembaga Lain:</span>
                        <span className="font-bold text-neutral-900">2 Lembaga (A & C)</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/silang"
                    className="mt-3 w-full py-2.5 rounded-full neo-btn-secondary text-xs font-semibold text-center flex items-center justify-center gap-1"
                  >
                    <span>Buka Rincian di Papan Silang</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card3D>

              <Card3D>
                <div
                  className="neo-card-3d p-6 rounded-3xl h-full flex flex-col justify-between"
                  style={{ borderRadius: '24px' }}
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                      <div>
                        <span className="text-xs font-mono font-bold text-neutral-500">LZ-C</span>
                        <h4 className="text-base font-bold text-neutral-900">Lembaga Zakat C</h4>
                      </div>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Terkonfirmasi
                      </span>
                    </div>

                    <div className="py-4 space-y-3 text-xs">
                      <div>
                        <span className="text-neutral-500 block">Hash Kepala Harian:</span>
                        <code className="font-mono text-[11px] text-neutral-800 font-semibold block truncate neo-inset p-2 rounded-xl mt-0.5">
                          3f8e12a0459cba6789012345abcdef1234567890abcdef4
                        </code>
                      </div>

                      <div>
                        <span className="text-neutral-500 block">Hasil Hitung Ulang:</span>
                        <code className="font-mono text-[11px] neo-inset text-neutral-800 font-semibold block truncate p-2 rounded-xl mt-0.5">
                          3f8e12a0459cba6789012345abcdef1234567890abcdef4
                        </code>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-neutral-600">
                        <span>Saksi Lembaga Lain:</span>
                        <span className="font-bold text-neutral-900">2 Lembaga (A & B)</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/silang"
                    className="mt-3 w-full py-2.5 rounded-full neo-btn-secondary text-xs font-semibold text-center flex items-center justify-center gap-1"
                  >
                    <span>Buka Rincian di Papan Silang</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card3D>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
