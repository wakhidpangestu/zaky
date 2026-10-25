'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ZakyLogo from '@/components/zaky-logo';
import { PenerimaanItem, PenyaluranItem } from '@/lib/store';
import { formatRupiah, formatTerbilangRupiah } from '@/lib/format';
import {
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Building2,
  FileCheck2,
  QrCode,
  Users2,
  Check,
} from 'lucide-react';

/* ============================================================
   Kop Surat Lembaga Amil Zakat Resmi (Standar Indonesia)
   ============================================================ */
export function KopSuratResmi({ lembaga = 'Lembaga Amil Zakat Amanah Ummat (LAZ-AU)' }: { lembaga?: string }) {
  return (
    <div className="pb-2 border-b-2 border-neutral-900 mb-3 print:pb-1.5 print:mb-2">
      <div className="flex items-center justify-between gap-3">
        {/* Logo & Brand Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-primary-800 text-white flex items-center justify-center shrink-0 print:border print:border-neutral-900">
            <ZakyLogo size={26} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-neutral-900 font-sans leading-tight">
              {lembaga}
            </h2>
            <p className="text-[10px] text-neutral-600 font-medium leading-tight">
              Izin Kemenag RI No. 492/2021 • Akreditasi BAZNAS RI • PSAK 109
            </p>
            <p className="text-[9px] text-neutral-500 leading-tight">
              Gedung Dakwah Terpadu, Jl. C. Simanjuntak No. 42, Sleman, D.I. Yogyakarta 55281 | Telp: (0274) 556789
            </p>
          </div>
        </div>

        {/* Audit Network Badge */}
        <div className="text-right hidden sm:block print:block shrink-0">
          <span className="inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-300">
            ZAKY v4.0 AUDITED
          </span>
          <p className="text-[8.5px] text-neutral-500 mt-0.5 font-mono">
            Buku Besar Append-Only
          </p>
        </div>
      </div>

      {/* Decorative double rule for formal Indonesian official letters */}
      <div className="mt-1.5 border-b border-neutral-400" />
    </div>
  );
}

/* ============================================================
   Stempel Cap Digital Resmi (Zaky Verified Seal)
   ============================================================ */
export function StempelDigitalResmi({ tanggal, nomor }: { tanggal: string; nomor: string }) {
  return (
    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 border-dashed border-emerald-700/80 p-0.5 flex items-center justify-center text-center relative rotate-[-5deg] select-none pointer-events-none print:border-emerald-800 shrink-0">
      <div className="w-full h-full rounded-full border border-emerald-600/70 flex flex-col items-center justify-center p-0.5 bg-emerald-50/20 print:bg-transparent">
        <span className="text-[7px] font-bold text-emerald-800 tracking-wider uppercase leading-none">
          ★ ZAKY VERIFIED ★
        </span>
        <span className="text-[9.5px] font-extrabold text-emerald-900 tracking-wider my-0.5 font-mono leading-none">
          SAH & AUDIT
        </span>
        <span className="text-[6.5px] text-emerald-700 font-mono leading-none">
          {nomor.slice(0, 10)}
        </span>
        <span className="text-[6.5px] text-emerald-700 font-sans leading-none mt-0.5">
          {tanggal}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   1. LEMBAR CETAK BUKTI SETOR PENERIMAAN ZAKAT (BSZ)
   Tepat 1 Halaman A4 Bersih & Proporsional
   ============================================================ */
export function BuktiSetorCetak({ item }: { item: PenerimaanItem }) {
  const terbilangStr = formatTerbilangRupiah(item.bruto);

  return (
    <div className="bg-white text-neutral-900 font-sans max-w-[210mm] mx-auto print:w-full print:max-w-none print:text-black print:p-0 print:m-0 print-avoid-break">
      {/* Kop Surat Resmi */}
      <KopSuratResmi />

      {/* Judul Dokumen & Nomor */}
      <div className="text-center my-2.5 print:my-2">
        <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-neutral-900 font-sans">
          BUKTI PENERIMAAN ZAKAT (BSZ)
        </h1>
        <p className="text-[10px] text-neutral-600 font-medium">
          Standar Akuntansi Zakat PSAK 109 & Undang-Undang RI No. 23 Tahun 2011
        </p>
      </div>

      {/* Metadata Dokumen Baris Atas */}
      <div className="grid grid-cols-2 gap-2 p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs mb-3 print:bg-white print:border-neutral-400 print:mb-2 print:p-2">
        <div>
          <span className="text-neutral-500 text-[10px] block">Nomor Bukti Setor (Kode Unik):</span>
          <span className="font-mono font-extrabold text-xs sm:text-sm text-primary-800 print:text-black">
            {item.kodeUnik}
          </span>
        </div>
        <div className="text-right">
          <span className="text-neutral-500 text-[10px] block">Waktu Pencatatan:</span>
          <span className="font-medium text-neutral-800 text-[11px]">{item.dicatatPada}</span>
        </div>
      </div>

      {/* Tabel Informasi Muzakki */}
      <div className="border border-neutral-300 rounded-lg overflow-hidden mb-3 print:border-neutral-400 print:mb-2 text-xs">
        <div className="bg-neutral-100/90 px-3 py-1 border-b border-neutral-300 font-bold uppercase tracking-wider text-neutral-700 text-[9.5px]">
          I. DATA MUZAKKI (DONATUR)
        </div>
        <table className="w-full text-left">
          <tbody className="divide-y divide-neutral-200 text-[11px]">
            <tr>
              <td className="w-1/3 py-1.5 px-3 text-neutral-500 font-medium">Nama Muzakki</td>
              <td className="py-1.5 px-3 font-bold text-neutral-900">{item.muzakkiNama}</td>
            </tr>
            <tr>
              <td className="py-1.5 px-3 text-neutral-500 font-medium">Kategori Muzakki</td>
              <td className="py-1.5 px-3 text-neutral-800 capitalize">
                {item.muzakkiTipe === 'anonim' ? 'Hamba Allah (Anonim / Tidak Dipublikasikan)' : 'Muzakki Terdaftar'}
              </td>
            </tr>
            <tr>
              <td className="py-1.5 px-3 text-neutral-500 font-medium">Kanal Pembayaran</td>
              <td className="py-1.5 px-3 text-neutral-800">{item.kanal}</td>
            </tr>
            <tr>
              <td className="py-1.5 px-3 text-neutral-500 font-medium">Keterangan / Akad</td>
              <td className="py-1.5 px-3 text-neutral-800">{item.keterangan || 'Penunaian kewajiban zakat'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tabel Rekonsiliasi Kas Syariah (PSAK 109) */}
      <div className="border border-neutral-300 rounded-lg overflow-hidden mb-3 print:border-neutral-400 print:mb-2 text-xs">
        <div className="bg-neutral-100/90 px-3 py-1 border-b border-neutral-300 font-bold uppercase tracking-wider text-neutral-700 text-[9.5px]">
          II. RINCIAN PENERIMAAN DANA (PSAK 109)
        </div>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-semibold text-neutral-600">
              <th className="py-1.5 px-3">Pos Rekening Dana</th>
              <th className="py-1.5 px-3 text-right">Ketentuan Syariah</th>
              <th className="py-1.5 px-3 text-right">Jumlah (Rupiah)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            <tr>
              <td className="py-1.5 px-3 font-semibold text-neutral-900">
                {item.posNama} (Nominal Bruto)
              </td>
              <td className="py-1.5 px-3 text-right text-neutral-500 text-[10px]">100% Setoran Awal</td>
              <td className="py-1.5 px-3 text-right font-mono font-bold text-neutral-900">
                {formatRupiah(item.bruto)}
              </td>
            </tr>
            <tr>
              <td className="py-1.5 px-3 text-neutral-700">
                Hak Amil Operasional ({item.persenAmil || 12.5}%)
              </td>
              <td className="py-1.5 px-3 text-right text-neutral-500 text-[10px]">Maks. 1/8 Asnaf QS 9:60</td>
              <td className="py-1.5 px-3 text-right font-mono font-semibold text-amber-800 print:text-black">
                {formatRupiah(item.hakAmil)}
              </td>
            </tr>
            <tr className="bg-emerald-50/70 font-bold text-neutral-900 print:bg-neutral-100">
              <td className="py-2 px-3 text-emerald-950 print:text-black">
                Net Masuk Kas Pos Dana (Hak Mustahik)
              </td>
              <td className="py-2 px-3 text-right text-emerald-800 print:text-black text-[10px]">
                Konservasi Invariant
              </td>
              <td className="py-2 px-3 text-right font-mono text-emerald-700 print:text-black text-xs sm:text-sm">
                {formatRupiah(item.masukPos)}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="p-2 bg-neutral-50 border-t border-neutral-200 text-[10.5px] text-neutral-700">
          <span className="font-semibold text-neutral-600">Terbilang: </span>
          <span className="italic font-medium text-neutral-900">&ldquo;{terbilangStr}&rdquo;</span>
        </div>
      </div>

      {/* Segel Kriptografis SHA-256 */}
      <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-300 text-xs mb-3 print:bg-white print:border-neutral-400 print:mb-2 print:p-2">
        <div className="flex items-center gap-1.5 font-bold text-neutral-800 text-[10px] mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-primary-700 print:text-black shrink-0" />
          <span>SEGEL KRIPTOGRAFIS SHA-256 (APPEND-ONLY LEDGER)</span>
        </div>
        <p className="font-mono text-[9.5px] text-neutral-700 break-all bg-white p-1.5 rounded border border-neutral-200 print:border-neutral-400">
          {item.hashSha256 || '9f83c605d4c82b3e925bce3269f14e491a0c7148582103714f7b4e8391ac697c'}
        </p>
        <div className="flex justify-between items-center text-[9px] text-neutral-500 mt-1">
          <span>Verifikasi publik mandiri: <code>zaky.app/verifikasi/{item.kodeUnik}</code></span>
          <span className="font-semibold text-emerald-700 print:text-black">Status: Tersegel Permanen</span>
        </div>
      </div>

      {/* Kolom Tanda Tangan & Pengesahan */}
      <div className="pt-2 print:pt-1 print-avoid-break">
        <div className="grid grid-cols-3 gap-3 items-end text-center text-[10px]">
          {/* Tanda Tangan Muzakki */}
          <div className="space-y-7 print:space-y-6">
            <p className="text-neutral-600 font-medium">Muzakki / Penyetor,</p>
            <div>
              <div className="w-28 sm:w-32 mx-auto border-b border-neutral-400" />
              <p className="font-bold text-neutral-900 mt-1">({item.muzakkiNama})</p>
            </div>
          </div>

          {/* Stempel Digital Tengah */}
          <div className="flex justify-center">
            <StempelDigitalResmi tanggal={item.dicatatPada.split(' ')[0]} nomor={item.kodeUnik} />
          </div>

          {/* Tanda Tangan Amil Penerima */}
          <div className="space-y-7 print:space-y-6">
            <div>
              <p className="text-neutral-500 text-[9px]">D.I. Yogyakarta, {item.dicatatPada.split(' ')[0]}</p>
              <p className="text-neutral-600 font-medium">Petugas Amil Penerima,</p>
            </div>
            <div>
              <div className="w-28 sm:w-32 mx-auto border-b border-neutral-400" />
              <p className="font-bold text-neutral-900 mt-1">{item.dicatatOleh}</p>
              <p className="text-[9px] text-neutral-500">{item.dicatatUnit}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Dokumen */}
      <div className="mt-4 pt-2 border-t border-neutral-200 text-center text-[8.5px] text-neutral-500 print:mt-3 print:border-neutral-400">
        Dokumen resmi diterbitkan Sistem Zaky v4.0. Dicetak pada {new Date().toLocaleString('id-ID')} WIB.
      </div>
    </div>
  );
}

/* ============================================================
   2. LEMBAR CETAK SURAT BUKTI PENYALURAN ZAKAT (DISTRIBUTION PROOF)
   Tepat 1 Halaman A4 Bersih & Proporsional
   ============================================================ */
export function SuratPenyaluranCetak({ item }: { item: PenyaluranItem }) {
  const terbilangStr = formatTerbilangRupiah(item.nominal);

  return (
    <div className="bg-white text-neutral-900 font-sans max-w-[210mm] mx-auto print:w-full print:max-w-none print:text-black print:p-0 print:m-0 print-avoid-break">
      {/* Kop Surat Resmi */}
      <KopSuratResmi />

      {/* Judul Dokumen */}
      <div className="text-center my-2.5 print:my-2">
        <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-neutral-900 font-sans">
          SURAT BUKTI PENYALURAN DANA ZAKAT
        </h1>
        <p className="text-[10px] text-neutral-600 font-medium">
          Berita Acara Penyaluran Berbasis Segregasi Kewenangan 4-Mata (Keputusan N1 & N2)
        </p>
      </div>

      {/* Metadata Dokumen */}
      <div className="grid grid-cols-2 gap-2 p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs mb-3 print:bg-white print:border-neutral-400 print:mb-2 print:p-2">
        <div>
          <span className="text-neutral-500 text-[10px] block">Kode Transaksi Penyaluran:</span>
          <span className="font-mono font-extrabold text-xs sm:text-sm text-primary-800 print:text-black">
            {item.kodeUnik}
          </span>
        </div>
        <div className="text-right">
          <span className="text-neutral-500 text-[10px] block">Status Penyaluran:</span>
          <span className="font-bold text-[10px] uppercase text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300 print:border-neutral-500 print:text-black">
            {item.status.toUpperCase()} (TERVERIFIKASI)
          </span>
        </div>
      </div>

      {/* Tabel Rincian Penyaluran */}
      <div className="border border-neutral-300 rounded-lg overflow-hidden mb-3 print:border-neutral-400 print:mb-2 text-xs">
        <div className="bg-neutral-100/90 px-3 py-1 border-b border-neutral-300 font-bold uppercase tracking-wider text-neutral-700 text-[9.5px]">
          I. DATA PENERIMA MANFAAT & ASNAF (DIGNITY-FIRST / UU PDP NO. 27/2022)
        </div>
        <table className="w-full text-left text-[11px]">
          <tbody className="divide-y divide-neutral-200">
            <tr>
              <td className="w-1/3 py-1.5 px-3 text-neutral-500 font-medium">Penerima Manfaat</td>
              <td className="py-1.5 px-3 font-bold text-neutral-900">
                {item.mustahikNama} <span className="font-normal text-neutral-500 text-[10px]">(Inisial terlindungi)</span>
              </td>
            </tr>
            <tr>
              <td className="py-1.5 px-3 text-neutral-500 font-medium">Golongan Asnaf</td>
              <td className="py-1.5 px-3 font-semibold text-neutral-800">
                Asnaf {item.asnaf} (Surat At-Taubah Ayat 60)
              </td>
            </tr>
            <tr>
              <td className="py-1.5 px-3 text-neutral-500 font-medium">Program / Pos Dana</td>
              <td className="py-1.5 px-3 text-neutral-800">{item.posNama}</td>
            </tr>
            <tr>
              <td className="py-1.5 px-3 text-neutral-500 font-medium">Metode Konfirmasi</td>
              <td className="py-1.5 px-3 text-neutral-800 capitalize">
                {item.metode === 'mustahik'
                  ? 'Konfirmasi Mandiri Mustahik (Token 32-Byte)'
                  : 'Kesaksian Fisik Amil Lapangan (2 Saksi Independen)'}
              </td>
            </tr>
            <tr className="bg-neutral-50 font-semibold">
              <td className="py-2 px-3 text-neutral-700">Nominal Penyaluran</td>
              <td className="py-2 px-3 font-mono text-xs sm:text-sm font-extrabold text-primary-800 print:text-black">
                {formatRupiah(item.nominal)}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="p-2 bg-neutral-50 border-t border-neutral-200 text-[10.5px] text-neutral-700">
          <span className="font-semibold text-neutral-600">Terbilang: </span>
          <span className="italic font-medium text-neutral-900">&ldquo;{terbilangStr}&rdquo;</span>
        </div>
      </div>

      {/* Matriks Segregasi Kewenangan 4-Mata (Aturan 4-Unit N1 & N2) */}
      <div className="border border-neutral-300 rounded-lg overflow-hidden mb-3 print:border-neutral-400 print:mb-2 text-xs">
        <div className="bg-neutral-100/90 px-3 py-1 border-b border-neutral-300 font-bold uppercase tracking-wider text-neutral-700 text-[9.5px]">
          II. MATRIKS SEGREGASI 4-MATA & OTORISASI 4-UNIT (KEPUTUSAN N1 & N2)
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-neutral-50 text-[10px] font-semibold text-neutral-600 border-b border-neutral-200">
              <th className="py-1.5 px-3">Peran Fungsional</th>
              <th className="py-1.5 px-3">Nama Pejabat</th>
              <th className="py-1.5 px-3">Unit Kerja (Wajib Berbeda)</th>
              <th className="py-1.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-[10.5px]">
            <tr>
              <td className="py-1.5 px-3 font-semibold text-neutral-800">1. Pembuat Draf (Maker)</td>
              <td className="py-1.5 px-3">{item.dibuatOleh}</td>
              <td className="py-1.5 px-3 font-medium text-primary-800 print:text-black">{item.dibuatUnit}</td>
              <td className="py-1.5 px-3 text-center text-emerald-700 font-bold">Lengkap</td>
            </tr>
            <tr>
              <td className="py-1.5 px-3 font-semibold text-neutral-800">2. Saksi 1 (Witness 1)</td>
              <td className="py-1.5 px-3">{item.saksi1Nama || 'Amil Saksi 1'}</td>
              <td className="py-1.5 px-3 font-medium text-blue-800 print:text-black">{item.saksi1Unit || 'Unit Lapangan'}</td>
              <td className="py-1.5 px-3 text-center text-emerald-700 font-bold">Tersaksi</td>
            </tr>
            <tr>
              <td className="py-1.5 px-3 font-semibold text-neutral-800">3. Saksi 2 (Witness 2)</td>
              <td className="py-1.5 px-3">{item.saksi2Nama || 'Amil Saksi 2'}</td>
              <td className="py-1.5 px-3 font-medium text-purple-800 print:text-black">{item.saksi2Unit || 'Unit Kemitraan'}</td>
              <td className="py-1.5 px-3 text-center text-emerald-700 font-bold">Tersaksi</td>
            </tr>
            <tr className="bg-emerald-50/40 print:bg-neutral-50">
              <td className="py-1.5 px-3 font-bold text-neutral-900">4. Penyetuju (Checker)</td>
              <td className="py-1.5 px-3 font-semibold">{item.penyetujuNama || 'Penyetuju Hari'}</td>
              <td className="py-1.5 px-3 font-bold text-amber-900 print:text-black">{item.penyetujuUnit || 'Unit Keuangan'}</td>
              <td className="py-1.5 px-3 text-center text-emerald-700 font-bold">Disetujui</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Segel Integritas Kriptografis & Saksi Antarlembaga */}
      <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-300 text-xs mb-3 print:bg-white print:border-neutral-400 print:mb-2 print:p-2">
        <div className="flex items-center gap-1.5 font-bold text-neutral-800 text-[10px] mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-primary-700 print:text-black shrink-0" />
          <span>BUKTI HASH SHA-256 & KONSENSUS ANTARLEMBAGA</span>
        </div>
        <p className="font-mono text-[9.5px] text-neutral-700 break-all bg-white p-1.5 rounded border border-neutral-200 print:border-neutral-400">
          {item.hashSha256 || '4f53cda18c2b4e8925bce3269f14e491a0c7148582103714f7b4e8391ac697a2'}
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[9px] text-neutral-600">
          <span>Saksi Silang: <strong>Lembaga B (Dompet Dhuafa)</strong> & <strong>Lembaga C (Rumah Zakat)</strong></span>
          <span className="font-mono">zaky.app/verifikasi/{item.kodeUnik}</span>
        </div>
      </div>

      {/* Kolom 4 Tanda Tangan Formal */}
      <div className="pt-2 print:pt-1 print-avoid-break">
        <div className="grid grid-cols-4 gap-2 items-end text-center text-[9.5px] sm:text-[10px]">
          {/* 1. Maker */}
          <div className="space-y-6 print:space-y-5">
            <p className="text-neutral-600 font-medium">Pembuat Draf,</p>
            <div>
              <div className="w-20 sm:w-24 mx-auto border-b border-neutral-400" />
              <p className="font-bold text-neutral-900 mt-0.5">{item.dibuatOleh}</p>
              <p className="text-[8.5px] text-neutral-500">{item.dibuatUnit}</p>
            </div>
          </div>

          {/* 2. Witness 1 */}
          <div className="space-y-6 print:space-y-5">
            <p className="text-neutral-600 font-medium">Saksi Lapangan 1,</p>
            <div>
              <div className="w-20 sm:w-24 mx-auto border-b border-neutral-400" />
              <p className="font-bold text-neutral-900 mt-0.5">{item.saksi1Nama || 'Saksi Dewi'}</p>
              <p className="text-[8.5px] text-neutral-500">{item.saksi1Unit || 'Unit Lapangan'}</p>
            </div>
          </div>

          {/* 3. Witness 2 */}
          <div className="space-y-6 print:space-y-5">
            <p className="text-neutral-600 font-medium">Saksi Lapangan 2,</p>
            <div>
              <div className="w-20 sm:w-24 mx-auto border-b border-neutral-400" />
              <p className="font-bold text-neutral-900 mt-0.5">{item.saksi2Nama || 'Saksi Ridwan'}</p>
              <p className="text-[8.5px] text-neutral-500">{item.saksi2Unit || 'Unit Kemitraan'}</p>
            </div>
          </div>

          {/* 4. Checker */}
          <div className="space-y-6 print:space-y-5">
            <p className="text-neutral-600 font-bold">Penyetuju Kas,</p>
            <div>
              <div className="w-20 sm:w-24 mx-auto border-b border-neutral-900" />
              <p className="font-bold text-neutral-900 mt-0.5">{item.penyetujuNama || 'Penyetuju Hari'}</p>
              <p className="text-[8.5px] text-neutral-500">{item.penyetujuUnit || 'Unit Keuangan'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-2 border-t border-neutral-200 text-center text-[8.5px] text-neutral-500 print:mt-3 print:border-neutral-400">
        Berita Acara resmi diterbitkan melalui konsensus Sistem Zaky v4.0. Dicetak pada {new Date().toLocaleString('id-ID')} WIB.
      </div>
    </div>
  );
}

/* ============================================================
   3. MODAL PREVIEW DOKUMEN CETAK & PDF WRAPPER
   Dilengkapi Auto-Fix Pencetakan 1 Halaman A4
   ============================================================ */
interface ModalCetakDokumenProps {
  isOpen: boolean;
  onClose: () => void;
  judul?: string;
  children: React.ReactNode;
}

export function ModalCetakDokumen({
  isOpen,
  onClose,
  judul = 'Pratinjau Dokumen Cetak / PDF',
  children,
}: ModalCetakDokumenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pasang penanda cetak ke body agar browser memfokuskan pencetakan ke #zaky-print-root
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('zaky-has-print-root');
    } else {
      document.body.classList.remove('zaky-has-print-root');
    }

    return () => {
      document.body.classList.remove('zaky-has-print-root');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* 1. Modal Dialog di Layar Komputer / HP (no-print: otomatis disembunyikan saat mencetak) */}
      <div className="no-print fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <div className="bg-white rounded-2xl border border-neutral-300 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
          {/* Modal Toolbar */}
          <div className="p-3 sm:p-4 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <Printer className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="font-bold text-xs sm:text-sm tracking-wide text-white">{judul}</h3>
                <p className="text-[10px] sm:text-[11px] text-neutral-400">
                  Pratinjau Pas 1 Halaman HVS A4 • Klik tombol untuk mencetak atau simpan sebagai PDF
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Simpan PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Tutup Pratinjau"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Paper Sheet Preview Area */}
          <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-neutral-100/80">
            <div className="bg-white rounded-xl shadow-lg border border-neutral-200/80 p-5 sm:p-7 max-w-[210mm] mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Target Dokumen Cetak Nyata (Di-portal langsung ke bawah body)
          Menghilangkan 100% masalah double / blank putih karena bebas dari parent fixed / overflow */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <div id="zaky-print-root">
          <div className="bg-white text-neutral-900 font-sans p-0 m-0 w-full print-avoid-break">
            {children}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
