'use client';

import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Package,
  PhoneCall,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function ArmadaSection() {
  const [activeCheckpoint, setActiveCheckpoint] = useState<number>(2);

  const checkpoints = [
    {
      id: 1,
      title: 'Gudang Logistik Pusat',
      time: '08:30 WIB',
      desc: 'Muatan 500 paket sembako asnaf fakir diverifikasi & disegel tim audit.',
      status: 'Selesai',
    },
    {
      id: 2,
      title: 'Pos Transit Wilayah',
      time: '11:15 WIB',
      desc: 'Armada melewati checkpoint wilayah, status barcode muatan diperbarui.',
      status: 'Dalam Perjalanan',
    },
    {
      id: 3,
      title: 'Titik Distribusi Mustahik',
      time: 'Estimasi 13:45 WIB',
      desc: 'Saksi Dewi & tim relawan bersiap validasi OTP / Geotag penyerahan.',
      status: 'Menunggu Kedatangan',
    },
  ];

  return (
    <section className="z-cv pt-4 sm:pt-6 pb-20 sm:pb-28 bg-white border-t border-b border-neutral-200/80 relative overflow-hidden rounded-t-[36px] sm:rounded-t-[48px] lg:rounded-t-[56px] shadow-[0_-25px_60px_-15px_rgba(0,0,0,0.12)]">
      {/* Subtle modern grab handle indicator like mobile/tablet sheet & reference video frame 00:29 */}
      <div className="flex justify-center pt-2 pb-6 sm:pb-8">
        <div className="w-12 h-1.5 rounded-full bg-neutral-300/80" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-5 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-primary-800 text-xs font-bold border border-emerald-200">
              <Truck className="w-3.5 h-3.5" />
              <span>LOGISTIK & DISTRIBUSI CEPAT</span>
            </div>

            <h2 className="z-display-2 text-neutral-900">
              Amanah Sampai ke Tangan Mustahik,{' '}
              <span className="text-primary-700 block">Tepat Waktu & Terdokumentasi.</span>
            </h2>

            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              Armada logistik Zaky bergerak mendistribusikan bantuan sembako, biaya hidup, dan logistik darurat
              ke wilayah pelosok dan zona bencana. Setiap penyerahan divalidasi langsung oleh saksi unit distribusi berbeda.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-900">
                    Saksi Geotag & Foto Lapangan
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Koordinat GPS presisi dan foto serah terima terikat ke nomor transaksi secara permanen.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-900">
                    Konfirmasi OTP SMS Langsung
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Mustahik memasukkan kode 6-digit OTP pribadi tanpa perlu perantara tunai.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/verifikasi/ZK4B8V2KNT9X"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-700 hover:bg-primary-600 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Lihat Contoh Pembuktian Geotag</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Stylized Isometric Map & Live Tracker Card (matching 00:30) */}
          <div className="lg:col-span-7 relative">
            {/* Background Isometric Route Illustration */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#EEF4F1] border border-neutral-200/90 shadow-sm relative overflow-hidden">
              {/* Road Track SVG Curve */}
              <div className="relative h-64 sm:h-72 w-full flex items-center justify-center">
                <svg
                  className="w-full h-full text-primary-200"
                  viewBox="0 0 600 240"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Road Path */}
                  <path
                    d="M 40 180 C 180 180, 200 60, 360 80 C 480 100, 520 190, 560 190"
                    stroke="#CBD5E1"
                    strokeWidth="24"
                    strokeLinecap="round"
                  />
                  {/* Active Covered Path in Emerald */}
                  <path
                    d="M 40 180 C 180 180, 200 60, 360 80"
                    stroke="#0F5C4D"
                    strokeWidth="24"
                    strokeLinecap="round"
                  />
                  {/* Center Dash Guide Line */}
                  <path
                    d="M 40 180 C 180 180, 200 60, 360 80 C 480 100, 520 190, 560 190"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    strokeDasharray="8 8"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Point 1: Gudang Pusat */}
                <div className="absolute left-6 bottom-10 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary-700 text-white flex items-center justify-center shadow-md">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-neutral-800 mt-1 bg-white/90 px-2 py-0.5 rounded shadow-2xs">
                    Gudang Pusat
                  </span>
                </div>

                {/* Point 2: Active Vehicle (Armada Zaky) */}
                <div className="absolute top-12 left-[52%] -translate-x-1/2 flex flex-col items-center animate-bounce">
                  <div className="w-10 h-10 rounded-2xl bg-accent-500 text-neutral-950 flex items-center justify-center shadow-lg border-2 border-white">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold text-neutral-950 mt-1 bg-accent-100 text-accent-900 px-2.5 py-0.5 rounded-full shadow-xs border border-accent-300">
                    Armada Zaky #04
                  </span>
                </div>

                {/* Point 3: Destination Mustahik */}
                <div className="absolute right-6 bottom-8 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center shadow-xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-neutral-600 mt-1 bg-white/90 px-2 py-0.5 rounded shadow-2xs">
                    Lokasi Mustahik
                  </span>
                </div>
              </div>

              {/* Floating Realtime Dispatch HUD Card (matching 00:30 in video) */}
              <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-neutral-900">
                      Dalam Perjalanan Menuju Lokasi Mustahik
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    SIGAP 24 JAM
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  {checkpoints.map((cp, idx) => {
                    const isSelected = activeCheckpoint === cp.id;
                    return (
                      <button
                        key={cp.id}
                        type="button"
                        onClick={() => setActiveCheckpoint(cp.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary-700 bg-primary-50/50 ring-2 ring-primary-700/20'
                            : 'border-neutral-200 bg-neutral-50/70 hover:bg-neutral-100/60'
                        }`}
                      >
                        <span className="block text-[10px] font-mono text-neutral-600 font-bold">
                          {cp.time}
                        </span>
                        <span className="block text-xs font-bold text-neutral-800 mt-0.5">
                          {cp.title}
                        </span>
                        <span
                          className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-1.5 ${
                            cp.status === 'Selesai'
                              ? 'bg-emerald-100 text-emerald-800'
                              : cp.status === 'Dalam Perjalanan'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-neutral-200 text-neutral-700'
                          }`}
                        >
                          {cp.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
