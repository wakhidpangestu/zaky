
import React from 'react';
import Link from 'next/link';
import {
  Layers,
  ShieldCheck,
  Server,
  ArrowRightLeft,
  Key,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
  CheckCircle2,
} from 'lucide-react';
import Card3D from './card-3d';

export default function FederationNetwork() {
  const nodes = [
    {
      code: 'LZ-A',
      name: 'Lembaga Zakat A',
      location: 'Node D.I. Yogyakarta',
      status: 'Aktif & Menyaksikan',
      entries: 24,
      signedHash: '9f2c8d1e...e41a',
    },
    {
      code: 'LZ-B',
      name: 'Lembaga Zakat B',
      location: 'Node Jawa Tengah (Semarang)',
      status: 'Aktif & Menyaksikan',
      entries: 18,
      signedHash: '7ab01f3e...33d1',
    },
    {
      code: 'LZ-C',
      name: 'Lembaga Zakat C',
      location: 'Node Jawa Timur (Surabaya)',
      status: 'Aktif & Menyaksikan',
      entries: 31,
      signedHash: '3f8e12a0...def4',
    },
  ];

  return (
    <section className="z-cv py-20 md:py-28 bg-[#F7F4ED] border-b border-neutral-300/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 gsap-fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neo-convex text-primary-900 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5 text-primary-700" />
            <span>Topologi Federasi Terdesentralisasi</span>
          </div>
          <h2 className="z-display-2 text-neutral-900">
            Jaringan Verifikasi Lintas Lembaga
          </h2>
          <p className="mt-3 text-neutral-600 text-sm sm:text-base leading-relaxed">
            Tidak ada basis data tunggal yang mengontrol segalanya. Setiap lembaga anggota menyimpan
            salinan hash kepala dari lembaga lain sebagai saksi sah yang tidak dapat diubah sepihak.
          </p>
        </div>

        {/* 3D Network Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative gsap-stagger-group">
          {nodes.map((node) => (
            <Card3D key={node.code} className="gsap-stagger-item h-full">
              <div
                className="neo-card-3d p-5 sm:p-6 rounded-3xl h-full flex flex-col justify-between"
                style={{ borderRadius: '24px' }}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl neo-convex flex items-center justify-center font-bold text-xs font-mono text-primary-700">
                        {node.code}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-neutral-900">{node.name}</h3>
                        <p className="text-[11px] text-neutral-500">{node.location}</p>
                      </div>
                    </div>
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  </div>

                  <div className="py-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between text-neutral-600">
                      <span>Arsitektur Server:</span>
                      <span className="font-semibold text-neutral-900 flex items-center gap-1">
                        <Database className="w-3.5 h-3.5 text-neutral-500" />
                        PostgreSQL Mandiri
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-neutral-600">
                      <span>Entri Terverifikasi:</span>
                      <span className="font-bold text-neutral-900 font-mono">{node.entries} penyaluran</span>
                    </div>

                    <div className="flex items-center justify-between text-neutral-600">
                      <span>Protokol Tanda Tangan:</span>
                      <span className="font-mono text-[11px] font-semibold text-primary-700">Ed25519 (Valid)</span>
                    </div>

                    <div className="pt-2 border-t border-neutral-100">
                      <span className="text-neutral-500 block text-[11px]">Hash Disaksikan Hari Ini:</span>
                      <code className="font-mono text-[11px] neo-inset p-2 rounded-xl block truncate mt-1 text-neutral-800">
                        {node.signedHash}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Saling Menyaksikan
                  </span>
                  <Link
                    href="/silang"
                    className="text-primary-700 hover:text-primary-600 font-bold flex items-center gap-1"
                  >
                    <span>Papan Silang</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </Card3D>
          ))}
        </div>

        {/* Cross-Witness Explanation Flow */}
        <div className="mt-10">
          <Card3D maxRotate={3}>
            <div
              className="neo-card-3d p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6"
              style={{ borderRadius: '24px' }}
            >
              <div className="space-y-1.5 max-w-2xl text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 text-primary-700 font-bold text-sm">
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Siklus Otomatis Pukul 00.00 WIB</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-neutral-900">
                  Penerbitan Hash Harian & Saksi Antarlembaga
                </h4>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Tiap tengah malam, setiap instance menghitung hash kepala dari seluruh audit_log hari tersebut,
                  menandatanganinya dengan kunci privat lembaga, dan mengirimkannya ke seluruh lembaga anggota lain.
                  Setiap lembaga menyimpan salinan bukti saksi, sehingga perubahan data di masa depan mustahil disembunyikan.
                </p>
              </div>

              <Link
                href="/silang"
                className="py-3 px-6 rounded-full neo-btn text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer flex-shrink-0"
              >
                <Layers className="w-4 h-4" />
                <span>Buka Papan Silang Hari Ini</span>
              </Link>
            </div>
          </Card3D>
        </div>
      </div>
    </section>
  );
}
