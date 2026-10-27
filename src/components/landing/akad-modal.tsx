'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  X,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Coins,
  QrCode,
  ShieldCheck,
  Building2,
  Check,
  FileCheck,
  Printer,
  Copy,
  ExternalLink,
  Lock,
  HelpCircle,
  CreditCard,
  Smartphone,
  FileText,
} from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import ZakyLogo from '@/components/zaky-logo';
import { ModalCetakDokumen, BuktiSetorCetak } from '@/components/cetak/dokumen-cetak';
import { PenerimaanItem } from '@/lib/store';

export type ZakatCategory = 'maal' | 'fitrah' | 'profesi' | 'fidyah';

/**
 * Modal akad mengelola status terbukanya sendiri: dibuka lewat event
 * jendela 'zaky:open-akad' (dipancarkan hero fallback, journey 3D, dan
 * tombol-tombol CTA), ditutup lewat onClose internal. Dengan begitu halaman
 * landing tidak perlu menjadi komponen klien hanya demi status modal ini.
 */
export default function AkadModal() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const onClose = () => setIsOpen(false);

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener('zaky:open-akad', open);
    return () => window.removeEventListener('zaky:open-akad', open);
  }, []);

  const [mounted, setMounted] = useState<boolean>(false);
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [category, setCategory] = useState<ZakatCategory>('maal');
  const [totalHarta, setTotalHarta] = useState<number>(150000000); // Rp 150 jt
  const [namaMuzakki, setNamaMuzakki] = useState<string>('Hamba Allah (Anonim)');
  const [noHp, setNoHp] = useState<string>('081234567890');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'va_bsi' | 'va_mandiri'>('qris');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [generatedKode, setGeneratedKode] = useState<string>('ZK9M4V8PL2X1');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pasang penanda cetak resmi ke body saat berada di Step 5 E-Kuitansi
  useEffect(() => {
    if (isOpen && currentStep === 5) {
      document.body.classList.add('zaky-has-print-root');
      return () => {
        document.body.classList.remove('zaky-has-print-root');
      };
    } else {
      document.body.classList.remove('zaky-has-print-root');
    }
  }, [isOpen, currentStep]);

  // Gold price assumption: Rp 1.500.000 / gram -> 85 gram = Rp 127.500.000
  const nisabEmas = 127500000;
  const isMelebihiNisab = totalHarta >= nisabEmas;

  // 2.5% for Maal / Profesi
  const calculatedZakat = category === 'fitrah'
    ? 50000 // Rp 50.000 per jiwa
    : Math.round(totalHarta * 0.025);

  const danaZakatMurni = Math.round(calculatedZakat * 0.875);
  const hakAmilMaksimal = calculatedZakat - danaZakatMurni;

  const categoryLabel =
    category === 'fitrah'
      ? 'Zakat Fitrah'
      : category === 'profesi'
      ? 'Zakat Profesi'
      : category === 'fidyah'
      ? 'Fidyah'
      : 'Zakat Maal';

  const penerimaanItem: PenerimaanItem = {
    id: generatedKode || 'ZK-DEMO',
    kodeUnik: generatedKode,
    posId: category === 'maal' ? 'p1111111-1111-1111-1111-111111111111' : 'p2222222-2222-2222-2222-222222222222',
    posNama: categoryLabel,
    bruto: calculatedZakat,
    hakAmil: hakAmilMaksimal,
    masukPos: danaZakatMurni,
    persenAmil: 12.5,
    kanal:
      paymentMethod === 'qris'
        ? 'QRIS Realtime'
        : paymentMethod === 'va_bsi'
        ? 'Virtual Account BSI'
        : 'Virtual Account Mandiri Syariah',
    muzakkiNama: namaMuzakki?.trim() || 'Hamba Allah (Anonim)',
    muzakkiTipe: namaMuzakki && !namaMuzakki.toLowerCase().includes('anonim') ? 'terdaftar' : 'anonim',
    keterangan: `Akad Penunaian ${categoryLabel} — Verifikasi Digital Zaky`,
    dicatatOleh: 'Hari Wibowo (Petugas Amil)',
    dicatatUnit: 'Kantor Layanan Lazismu Sleman',
    dicatatPada: `${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
    hashSha256: '9f83c605d4c82b3e925bce3269f14e491a0c7148582103714f7b4e8391ac697c',
  };

  const handleNextStep = () => {
    if (currentStep === 4) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        // Generate random realistic zaky code
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let code = 'ZK';
        for (let i = 0; i < 10; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setGeneratedKode(code);
        setCurrentStep(5);
      }, 1200);
    } else {
      setCurrentStep((prev) => Math.min(5, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleCopyKode = () => {
    navigator.clipboard.writeText(generatedKode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const STEPS_LIST = [
    { num: 1, title: 'Layanan', desc: 'Pilihan Jenis Zakat' },
    { num: 2, title: 'Kalkulator', desc: 'Nisab & Nominal' },
    { num: 3, title: 'Data & Niat', desc: 'Akad Muzakki' },
    { num: 4, title: 'Penyaluran', desc: 'Metode Pembayaran' },
    { num: 5, title: 'E-Kuitansi', desc: 'Bukti Kriptografis' },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-neutral-200/90 shadow-2xl overflow-hidden my-8 flex flex-col md:flex-row text-neutral-900">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT PROGRESS SIDEBAR (Matching 00:40 in video) */}
        <div className="w-full md:w-72 bg-gradient-to-b from-[#0D2E26] via-[#0A241E] to-[#071A15] text-white p-5 sm:p-6 flex flex-col justify-between flex-shrink-0">
          <div className="space-y-6">
            {/* Header Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary-700 flex items-center justify-center text-white">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
                  Akad Zakat Digital
                </span>
                <h3 className="text-base font-extrabold text-white">
                  Markaz Zaky
                </h3>
              </div>
            </div>

            {/* Stepper Navigation */}
            <div className="flex flex-row md:flex-col gap-3.5 md:gap-0 md:space-y-3.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {STEPS_LIST.map((s) => {
                const isActive = currentStep === s.num;
                const isPassed = currentStep > s.num;

                return (
                  <div key={s.num} className="flex items-start gap-3 shrink-0 md:shrink">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 mt-0.5 ${
                        isActive
                          ? 'bg-accent-500 text-neutral-950 ring-4 ring-accent-500/20'
                          : isPassed
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </div>

                    <div className="text-left">
                      <span
                        className={`block text-xs font-bold ${
                          isActive
                            ? 'text-white'
                            : isPassed
                            ? 'text-neutral-300'
                            : 'text-neutral-500'
                        }`}
                      >
                        {s.title}
                      </span>
                      <span className="hidden md:block text-[11px] text-neutral-400">
                        {s.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Realtime Summary Box */}
          <div className="mt-5 md:mt-8 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-2">
            <div className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
              Ringkasan Kewajiban
            </div>
            <div className="flex justify-between items-center text-emerald-400 font-extrabold text-sm">
              <span>Nominal Zakat:</span>
              <span>{formatRupiah(calculatedZakat)}</span>
            </div>
            <div className="border-t border-white/10 pt-2 text-[11px] text-neutral-300 space-y-1">
              <div className="flex justify-between">
                <span>Hak Amil (12.5%):</span>
                <span>{formatRupiah(hakAmilMaksimal)}</span>
              </div>
              <div className="flex justify-between font-semibold text-white">
                <span>Zakat Murni (87.5%):</span>
                <span>{formatRupiah(danaZakatMurni)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 p-5 sm:p-8 flex flex-col justify-between min-h-0 md:min-h-[460px]">
          {/* STEP 1: PILIHAN LAYANAN ZAKAT */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-[11px] font-bold font-mono tracking-wider text-primary-700 uppercase">
                  Langkah 1 dari 5
                </span>
                <h4 className="text-xl sm:text-2xl font-extrabold text-neutral-900">
                  Pilih Kategori Penyaluran Zakat
                </h4>
                <p className="text-xs text-neutral-500">
                  Pilih jenis zakat yang hendak Anda tunaikan sesuai ketentuan fiqih syariah.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  {
                    id: 'maal',
                    title: 'Zakat Maal (Harta Simpanan)',
                    desc: 'Wajib ditunaikan bila telah mencapai nisab 85 gr emas & haul 1 tahun hijriyah.',
                    rate: '2.5%',
                  },
                  {
                    id: 'profesi',
                    title: 'Zakat Penghasilan / Profesi',
                    desc: 'Dikeluarkan saat menerima gaji/honor bulanan yang setara nisab emas.',
                    rate: '2.5%',
                  },
                  {
                    id: 'fitrah',
                    title: 'Zakat Fitrah (Jiwa)',
                    desc: 'Kewajiban mensucikan diri menjelang Idulfitri, setara 2.5 kg / 3.5 liter beras.',
                    rate: 'Rp 50.000 / Jiwa',
                  },
                  {
                    id: 'fidyah',
                    title: 'Fidyah & Kaffarah',
                    desc: 'Kompensasi bagi yang berhalangan puasa karena usia lanjut atau sakit permanen.',
                    rate: 'Rp 30.000 / Hari',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id as ZakatCategory)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      category === item.id
                        ? 'border-primary-700 bg-primary-50/50 ring-2 ring-primary-700/20 shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-neutral-900">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                        {item.rate}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: KALKULATOR NISAB & NOMINAL */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-[11px] font-bold font-mono tracking-wider text-primary-700 uppercase">
                  Langkah 2 dari 5
                </span>
                <h4 className="text-xl sm:text-2xl font-extrabold text-neutral-900">
                  Hitung Nisab & Nominal Zakat
                </h4>
                <p className="text-xs text-neutral-500">
                  Masukkan nilai harta yang tersimpan selama satu tahun penuh.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Total Nilai Harta Simpanan / Gaji (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={totalHarta}
                      onChange={(e) => setTotalHarta(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700"
                    />
                  </div>
                </div>

                {/* Nisab Validation Card */}
                <div
                  className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                    isMelebihiNisab
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      {isMelebihiNisab
                        ? 'Wajib Zakat: Harta telah melampaui batas nisab emas.'
                        : 'Belum Mencapai Nisab: Disarankan berinfaq/sedekah sukarela.'}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80">
                    Standar Nisab Emas: 85 gram x Rp 1.500.000 = <strong>{formatRupiah(nisabEmas)}</strong>
                  </p>
                </div>

                {/* Breakdown result */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                  <div className="flex justify-between text-xs text-neutral-600">
                    <span>Persentase Fiqih Syariah:</span>
                    <span className="font-mono font-bold text-neutral-900">2.5%</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-primary-800 border-t border-neutral-200 pt-2">
                    <span>Total Zakat Wajib:</span>
                    <span className="font-mono">{formatRupiah(calculatedZakat)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DATA & NIAT AKAD SYARIAH */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-[11px] font-bold font-mono tracking-wider text-primary-700 uppercase">
                  Langkah 3 dari 5
                </span>
                <h4 className="text-xl sm:text-2xl font-extrabold text-neutral-900">
                  Data Muzakki & Niat Akad Syariah
                </h4>
                <p className="text-xs text-neutral-500">
                  Anda diperbolehkan menyamarkan nama sebagai &apos;Hamba Allah&apos; demi menjaga keikhlasan.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nama Muzakki (Penyetor)
                  </label>
                  <input
                    type="text"
                    value={namaMuzakki}
                    onChange={(e) => setNamaMuzakki(e.target.value)}
                    placeholder="Nama Lengkap atau Hamba Allah"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nomor WhatsApp (Untuk Tanda Terima & Hash Log)
                  </label>
                  <input
                    type="tel"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700"
                  />
                </div>

                {/* Box Lafadz Niat Zakat */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 text-left space-y-1.5">
                  <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase font-mono">
                    Lafadz Niat Akad Zakat Maal
                  </span>
                  <p className="text-xs italic text-emerald-950 font-serif leading-relaxed">
                    &ldquo;Nawaitu an ukhrija zakata maali fardhan lillahi ta&apos;ala.&rdquo;
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    Artinya: &ldquo;Saya berniat mengeluarkan zakat dari harta saya secara fardhu karena Allah Ta&apos;ala.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: METODE PEMBAYARAN */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-[11px] font-bold font-mono tracking-wider text-primary-700 uppercase">
                  Langkah 4 dari 5
                </span>
                <h4 className="text-xl sm:text-2xl font-extrabold text-neutral-900">
                  Pilih Kanal Penyaluran Zakat
                </h4>
                <p className="text-xs text-neutral-500">
                  Transaksi diproses langsung ke rekening amanah Zaky dengan penerbitan bukti kripto instan.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {[
                  {
                    id: 'qris',
                    name: 'QRIS Nasional (BCA, Mandiri, GoPay, OVO, Dana)',
                    desc: 'Scan cepat instan dari aplikasi mobile banking / dompet digital apa saja.',
                    badge: 'Bebas Biaya Admin',
                    icon: QrCode,
                  },
                  {
                    id: 'va_bsi',
                    name: 'Virtual Account Bank Syariah Indonesia (BSI)',
                    desc: 'Kanal perbankan syariah resmi terintegrasi langsung.',
                    badge: 'Konfirmasi Otomatis',
                    icon: CreditCard,
                  },
                  {
                    id: 'va_mandiri',
                    name: 'Virtual Account Bank Mandiri Syariah',
                    desc: 'Transfer lewat ATM atau Livin / Mobile Banking.',
                    badge: 'Konfirmasi Otomatis',
                    icon: Smartphone,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentMethod(item.id as 'qris' | 'va_bsi' | 'va_mandiri')}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary-700 bg-primary-50/50 ring-2 ring-primary-700/20'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-primary-700 text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-900 truncate">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-md">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: E-KUITANSI BUKTI SETOR RESMI (Matching 00:59 in video) */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-xl sm:text-2xl font-extrabold text-neutral-900">
                  Akad Zakat Berhasil Diterbitkan!
                </h4>
                <p className="text-xs text-neutral-500">
                  Bukti setor digital sah dengan stempel kriptografis SHA-256 dan nomor registrasi unik.
                </p>
              </div>

              {/* Digital E-Ticket Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 border border-neutral-300/80 shadow-xs space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
                  <ZakyLogo size={24} />
                  <span className="text-[10px] font-mono font-bold bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                    E-KUITANSI RESMI
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-left w-full sm:w-auto">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">
                      Nomor Registrasi Unik
                    </span>
                    <div className="text-xl font-mono font-extrabold text-primary-900 tracking-wider">
                      {generatedKode}
                    </div>
                    <div className="text-xs text-neutral-600">
                      Muzakki: <strong>{namaMuzakki}</strong>
                    </div>
                    <div className="text-xs text-neutral-600">
                      Nominal: <strong>{formatRupiah(calculatedZakat)}</strong>
                    </div>
                  </div>

                  {/* QR Code Placeholder with Real Link */}
                  <div className="p-2.5 rounded-xl bg-white border border-neutral-200 shadow-2xs text-center flex-shrink-0">
                    <QrCode className="w-16 h-16 text-neutral-900 mx-auto" />
                    <span className="block text-[9px] font-mono text-neutral-400 mt-1">
                      Scan Verifikasi
                    </span>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-2 text-[11px] text-neutral-500 flex flex-wrap items-center justify-between gap-2">
                  <span>Pemisahan Fiqih: <strong>87.5% Zakat</strong> | <strong>12.5% Amil</strong></span>
                  <button
                    type="button"
                    onClick={handleCopyKode}
                    className="inline-flex items-center gap-1 font-mono text-primary-700 hover:text-primary-800 font-bold"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{isCopied ? 'Tersalin!' : 'Salin Kode'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <Link
                  href={`/verifikasi/${generatedKode}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-700 hover:bg-primary-600 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Cek di Portal Verifikasi</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setShowPrintPreview(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Pratinjau BSZ</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* FOOTER CONTROLS */}
          <div className="flex items-center justify-between pt-6 border-t border-neutral-100 mt-6">
            {currentStep > 1 && currentStep < 5 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="z-touch inline-flex items-center gap-1.5 px-5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleNextStep}
                className="z-touch inline-flex items-center gap-2 px-6 rounded-full bg-primary-800 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <span>{isProcessing ? 'Memproses Akad...' : currentStep === 4 ? 'Bayar & Terbitkan Akad' : 'Lanjut'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="z-touch px-6 rounded-full bg-primary-800 hover:bg-primary-700 text-white text-xs font-bold shadow-md"
              >
                Selesai
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Modal Pratinjau Dokumen Cetak / PDF */}
      <ModalCetakDokumen
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        judul={`Bukti Penerimaan Zakat (BSZ) — ${generatedKode}`}
      >
        <BuktiSetorCetak item={penerimaanItem} />
      </ModalCetakDokumen>

      {/* Target Cetak Langsung: Di-portal ke body saat berada di Step 5 dan bukan saat modal preview terbuka */}
      {mounted && typeof document !== 'undefined' && isOpen && currentStep === 5 && !showPrintPreview && createPortal(
        <div id="zaky-print-root">
          <div className="bg-white text-neutral-900 font-sans p-0 m-0 w-full print-avoid-break">
            <BuktiSetorCetak item={penerimaanItem} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
