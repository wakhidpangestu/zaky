'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Scale,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Users2,
  Lock,
  Leaf,
  Coins,
} from 'lucide-react';
import Card3D from './card-3d';

export default function SyariahGovernance() {
  const [selectedAsnaf, setSelectedAsnaf] = useState<string>('fakir');

  const asnafList = [
    {
      id: 'fakir',
      name: 'Fakir',
      desc: 'Orang yang tidak memiliki harta atau mata pencaharian untuk memenuhi kebutuhan pokok primer.',
    },
    {
      id: 'miskin',
      name: 'Miskin',
      desc: 'Orang yang memiliki pekerjaan tetapi penghasilannya belum mencukupi kebutuhan pokok minimum.',
    },
    {
      id: 'amil',
      name: 'Amil',
      desc: 'Pengelola zakat yang ditugaskan resmi; hak amil dipisah secara proporsional sesuai kaidah fiqih.',
    },
    {
      id: 'muallaf',
      name: 'Muallaf',
      desc: 'Orang yang baru masuk Islam atau yang hatinya perlu dilembutkan untuk memperkuat keimanan.',
    },
    {
      id: 'riqab',
      name: 'Riqab',
      desc: 'Pembebasan belenggu perbudakan, eksploitasi manusia, atau pembebasan beban tawanan.',
    },
    {
      id: 'gharimin',
      name: 'Gharimin',
      desc: 'Orang yang berutang untuk kebutuhan hidup mendesak atau untuk mendamaikan sengketa masyarakat.',
    },
    {
      id: 'fisabilillah',
      name: 'Fisabilillah',
      desc: 'Aktivitas perjuangan di jalan Allah demi kemaslahatan dakwah, pendidikan, dan syiar Islam.',
    },
    {
      id: 'ibnu_sabil',
      name: 'Ibnu Sabil',
      desc: 'Musafir yang kehabisan bekal dalam perjalanan yang bukan bertujuan untuk kemaksiatan.',
    },
  ];

  return (
    <section id="syariah" className="z-cv py-20 md:py-28 bg-white border-b border-neutral-300/80 relative scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 gsap-fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neo-convex text-primary-900 text-xs font-semibold mb-3">
            <Scale className="w-3.5 h-3.5 text-primary-700" />
            <span>Kaidah Fiqih & Perlindungan Hukum</span>
          </div>
          <h2 className="z-display-2 text-neutral-900">
            Kepatuhan Syariah & Regulasi Hukum
          </h2>
          <p className="mt-3 text-neutral-600 text-sm sm:text-base leading-relaxed">
            Zaky dibangun di atas fondasi fiqih zakat yang ketat dan mematuhi payung hukum nasional
            Republik Indonesia, khususnya UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Asnaf Guide (7 Cols) */}
          <div className="lg:col-span-7">
            <Card3D>
              <div
                className="neo-card-3d p-6 sm:p-8 rounded-3xl space-y-6"
                style={{ borderRadius: '24px' }}
              >
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">
                      8 Asnaf Fiqih yang Dikunci Ketat
                    </h3>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      Setiap penyaluran zakat wajib diverifikasi sesuai salah satu dari 8 golongan asnaf:
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-primary-100 text-primary-800">
                    QS. At-Taubah: 60
                  </span>
                </div>

                {/* Asnaf Grid Selection */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {asnafList.map((asnaf) => (
                    <button
                      key={asnaf.id}
                      type="button"
                      onClick={() => setSelectedAsnaf(asnaf.id)}
                      className={`p-3 rounded-2xl text-center transition-all cursor-pointer ${
                        selectedAsnaf === asnaf.id
                          ? 'neo-btn text-white font-bold'
                          : 'neo-convex text-neutral-800 hover:scale-[1.02] font-medium'
                      }`}
                    >
                      <div className="text-xs capitalize">{asnaf.name}</div>
                    </button>
                  ))}
                </div>

                {/* Selected Asnaf Details */}
                {(() => {
                  const current = asnafList.find((a) => a.id === selectedAsnaf)!;
                  return (
                    <div className="p-5 rounded-2xl neo-inset text-xs text-neutral-700 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-primary-700">
                        <BookOpen className="w-4 h-4" />
                        <span>Kategori Asnaf: {current.name}</span>
                      </div>
                      <p className="leading-relaxed">{current.desc}</p>
                      <div className="text-[11px] text-neutral-600 font-mono pt-2 border-t border-neutral-200">
                        Sistem Zaky memvalidasi bahwa asnaf saat draf penyaluran harus sesuai dengan asnaf pada data mustahik terdaftar.
                      </div>
                    </div>
                  );
                })()}

                {/* Separation of Hak Amil */}
                <div className="p-4 rounded-2xl neo-convex text-xs text-primary-950 space-y-1.5 border border-primary-200">
                  <div className="flex items-center gap-2 font-bold text-sm text-primary-900">
                    <Coins className="w-4 h-4 text-accent-500" />
                    <span>Pemisahan Hak Amil Otomatis</span>
                  </div>
                  <p className="leading-relaxed">
                    Setiap penerimaan bruto zakat dipisahkan menjadi hak amil (maksimal 1/8 atau konfigurasi lembaga) dan kas masuk pos. Invariant <code>bruto = hak_amil + masuk_pos</code> ditegakkan langsung oleh basis data.
                  </p>
                </div>
              </div>
            </Card3D>
          </div>

          {/* Privacy & Zero-Gas Architecture (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card3D>
              <div
                className="neo-card-3d p-6 sm:p-7 rounded-3xl space-y-3"
                style={{ borderRadius: '24px' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl neo-convex text-primary-700 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">
                      UU No. 27 Tahun 2022 (PDP)
                    </h3>
                    <p className="text-xs text-neutral-500">Perlindungan Data Pribadi Mustahik</p>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed pt-1">
                  Zaky tidak mengekspos identitas mustahik ke publik atau lembaga lain. Nama penerima disamarkan (misalnya <code>S***</code>) dan nomor kontak di-mask. Yang saling diuji silang antarlembaga hanyalah hash SHA-256 berkas bukti dan integritas ledger.
                </p>
              </div>
            </Card3D>

            <Card3D>
              <div
                className="neo-card-3d p-6 sm:p-7 rounded-3xl space-y-3"
                style={{ borderRadius: '24px' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl neo-convex text-accent-500 flex items-center justify-center flex-shrink-0">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">
                      Bukan Blockchain Spekulatif
                    </h3>
                    <p className="text-xs text-neutral-500">Tanpa Gas Fee & Ramah Lingkungan</p>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed pt-1">
                  Zaky sengaja tidak menggunakan blockchain publik (seperti Ethereum atau Solana). Dana umat tidak boleh terpotong oleh biaya gas kripto yang fluktuatif atau dikaitkan dengan transaksi spekulatif. Zaky menerapkan protokol federasi Ed25519 berbiaya nol.
                </p>
              </div>
            </Card3D>
          </div>
        </div>
      </div>
    </section>
  );
}
