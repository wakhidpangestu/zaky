'use client';

import { useState } from 'react';
import Link from 'next/link';
import ZakyLogo from '@/components/zaky-logo';
import PageNavbar from '@/components/navigation/page-navbar';

interface LembagaStatus {
  id: string;
  nama: string;
  kodeLembaga: string;
  hashTerbit: string;
  hashHitungUlang: string;
  jumlahEntri: number;
  waktuTerbit: string;
  status: 'terkonfirmasi' | 'belum_cukup_saksi' | 'tidak_cocok' | 'belum_diterbitkan';
  saksi: {
    lembagaNama: string;
    hashDisaksikan: string;
    tandaTanganValid: boolean;
    waktu: string;
  }[];
  catatanInsiden?: string;
}

export default function PapanSilangPage() {
  const [selectedDate, setSelectedDate] = useState('2026-10-27');
  const [simulasiSerangan, setSimulasiSerangan] = useState(false);
  const [detailLembaga, setDetailLembaga] = useState<LembagaStatus | null>(null);

  // Data status jaringan 3 instance
  const dataLembaga: LembagaStatus[] = [
    {
      id: 'lembaga-a',
      nama: 'Lembaga Zakat A',
      kodeLembaga: 'LZ-A',
      hashTerbit: '9f2c8d1e3a4b5c6d7e8f901234567890abcdef1234567890abcdef1234e41a',
      hashHitungUlang: simulasiSerangan
        ? 'c441b89ef0321a47b2c99a81230114fe56aa9021bdfc0234125b09812481aa01' // Hash berbeda akibat serangan
        : '9f2c8d1e3a4b5c6d7e8f901234567890abcdef1234567890abcdef1234e41a',
      jumlahEntri: 24,
      waktuTerbit: '27 Okt 00.01 WIB',
      status: simulasiSerangan ? 'tidak_cocok' : 'terkonfirmasi',
      catatanInsiden: simulasiSerangan
        ? 'PERINGATAN INTEGRITAS (FR-47): Hasil hitung ulang dari audit_log (1..24) menghasilkan hash c441...aa01 yang tidak sesuai dengan hash harian yang diterbitkan (9f2c...e41a). Perubahan nominal secara langsung pada basis data terdeteksi!'
        : undefined,
      saksi: [
        {
          lembagaNama: 'Lembaga Zakat B',
          hashDisaksikan: '9f2c8d1e3a4b5c6d7e8f901234567890abcdef1234567890abcdef1234e41a',
          tandaTanganValid: true,
          waktu: '27 Okt 00.04 WIB',
        },
        {
          lembagaNama: 'Lembaga Zakat C',
          hashDisaksikan: '9f2c8d1e3a4b5c6d7e8f901234567890abcdef1234567890abcdef1234e41a',
          tandaTanganValid: true,
          waktu: '27 Okt 00.05 WIB',
        },
      ],
    },
    {
      id: 'lembaga-b',
      nama: 'Lembaga Zakat B',
      kodeLembaga: 'LZ-B',
      hashTerbit: '7ab01f3e8829cd14a2bf456789012345abcdef1234567890abcdef123433d1',
      hashHitungUlang: '7ab01f3e8829cd14a2bf456789012345abcdef1234567890abcdef123433d1',
      jumlahEntri: 18,
      waktuTerbit: '27 Okt 00.02 WIB',
      status: 'terkonfirmasi',
      saksi: [
        {
          lembagaNama: 'Lembaga Zakat A',
          hashDisaksikan: '7ab01f3e8829cd14a2bf456789012345abcdef1234567890abcdef123433d1',
          tandaTanganValid: true,
          waktu: '27 Okt 00.06 WIB',
        },
        {
          lembagaNama: 'Lembaga Zakat C',
          hashDisaksikan: '7ab01f3e8829cd14a2bf456789012345abcdef1234567890abcdef123433d1',
          tandaTanganValid: true,
          waktu: '27 Okt 00.07 WIB',
        },
      ],
    },
    {
      id: 'lembaga-c',
      nama: 'Lembaga Zakat C',
      kodeLembaga: 'LZ-C',
      hashTerbit: '—',
      hashHitungUlang: '—',
      jumlahEntri: 0,
      waktuTerbit: 'Belum diterbitkan',
      status: 'belum_diterbitkan',
      saksi: [],
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <PageNavbar variant="silang" />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-24 pb-12 sm:pt-28 sm:pb-16 space-y-6">
        {/* Page Title & Tagline */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-300 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 mb-2">
              <span>🛡️ Interconnected Verification Layer</span>
            </div>
            <h1 className="z-display-2 text-neutral-900">
              Papan Silang Kesaksian Antarlembaga
            </h1>
            <p className="text-neutral-600 mt-1 text-sm max-w-2xl">
              <strong>Setiap lembaga mencatat sendiri, tetapi catatannya saling disaksikan.</strong> Perubahan catatan sepihak pada basis data lembaga langsung terdeteksi oleh salinan kesaksian lembaga anggota lain (FR-46 s/d FR-55).
            </p>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-surface p-1.5 rounded-xl border border-neutral-300 shadow-sm text-xs overflow-x-auto max-w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_88%,transparent)] sm:[mask-image:none]">
            <span className="text-neutral-500 px-2 whitespace-nowrap">Tanggal:</span>
            {['2026-10-27', '2026-10-26', '2026-10-25'].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedDate === d
                    ? 'bg-primary-700 text-white font-semibold'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {d === '2026-10-27' ? '27 Okt 2026' : d === '2026-10-26' ? '26 Okt 2026' : '25 Okt 2026'}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Demo Control (Skenario Serangan Admin Langkah 4-5) */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <span>⚡ Mode Simulasi Skenario Demo Lomba:</span>
            </span>
            <p className="text-amber-800">
              Uji ketahanan sistem terhadap perubahan catatan oleh pemilik basis data (Skenario 4: <code>serang-log.sh</code>).
            </p>
          </div>
          <button
            onClick={() => setSimulasiSerangan(!simulasiSerangan)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              simulasiSerangan
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-surface text-neutral-800 border border-amber-300 hover:bg-amber-100'
            }`}
          >
            <span>{simulasiSerangan ? '🔴 Kembalikan Data Normal' : 'Simulasikan Serangan Log'}</span>
          </button>
        </div>

        {/* Section Heading per Design System 5.7 */}
        <div>
          <h2 className="text-base font-semibold text-neutral-900 mb-1">
            Papan silang: hash harian lembaga anggota untuk tanggal 27 Oktober 2026
          </h2>
          <p className="text-xs text-neutral-600">
            Status dihitung ulang secara real-time dari riwayat transaksi dan dibandingkan dengan kesaksian Ed25519 anggota lain.
          </p>
        </div>

        {/* Desktop Table per Design System 5.7 */}
        <div className="hidden md:block bg-surface rounded-xl border border-neutral-300 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-300 text-neutral-700 font-semibold text-xs">
                <th className="py-3.5 px-4">Lembaga Anggota</th>
                <th className="py-3.5 px-4">Hash Harian (Ed25519)</th>
                <th className="py-3.5 px-4">Hitung Ulang Log</th>
                <th className="py-3.5 px-4">Kesaksian Jaringan</th>
                <th className="py-3.5 px-4">Status Konsistensi</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {dataLembaga.map((item) => {
                const isMatch = item.hashTerbit === item.hashHitungUlang;

                return (
                  <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                    {/* Lembaga */}
                    <td className="py-4 px-4 font-medium text-neutral-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary-700" />
                        <div>
                          <span>{item.nama}</span>
                          <span className="block text-xs text-neutral-500 font-normal">
                            {item.jumlahEntri > 0 ? `${item.jumlahEntri} entri transaksi` : 'Belum ada transaksi'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Hash Terbit */}
                    <td className="py-4 px-4 font-mono text-xs">
                      {item.hashTerbit === '—' ? (
                        <span className="text-neutral-400">—</span>
                      ) : (
                        <span className="bg-neutral-100 px-2 py-1 rounded text-neutral-800">
                          {item.hashTerbit.slice(0, 8)}...{item.hashTerbit.slice(-8)}
                        </span>
                      )}
                    </td>

                    {/* Hitung Ulang Log */}
                    <td className="py-4 px-4 font-mono text-xs">
                      {item.hashHitungUlang === '—' ? (
                        <span className="text-neutral-400">—</span>
                      ) : isMatch ? (
                        <span className="text-primary-700 font-medium">✓ Cocok ({item.hashHitungUlang.slice(0, 6)}...)</span>
                      ) : (
                        <span className="text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                          ≠ Beda ({item.hashHitungUlang.slice(0, 6)}...)
                        </span>
                      )}
                    </td>

                    {/* Kesaksian */}
                    <td className="py-4 px-4 text-xs">
                      {item.status === 'belum_diterbitkan' ? (
                        <span className="text-neutral-400">—</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-neutral-700">
                          <span>{item.saksi.length} dari 2 lembaga lain</span>
                        </span>
                      )}
                    </td>

                    {/* Status Badge per Design System 2.3 & 5.7 */}
                    <td className="py-4 px-4">
                      {item.status === 'terkonfirmasi' && (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: 'var(--zaky-primary-100)',
                            color: 'var(--zaky-primary-700)',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M7 1l5 2.5v4c0 3-2.5 5-5 5.5-2.5-.5-5-2.5-5-5.5v-4L7 1z" />
                            <path d="M5 7l1.5 1.5 3-3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Terkonfirmasi (2 saksi)
                        </span>
                      )}

                      {item.status === 'belum_cukup_saksi' && (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: 'var(--zaky-status-menunggu-bg)',
                            color: 'var(--zaky-status-menunggu-text)',
                          }}
                        >
                          👥 Belum cukup saksi
                        </span>
                      )}

                      {item.status === 'tidak_cocok' && (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: 'var(--zaky-status-peringatan-bg)',
                            color: 'var(--zaky-status-peringatan-text)',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M7 2l5.5 10H1.5L7 2z" />
                            <path d="M7 6v3M7 10.5v.5" strokeLinecap="round" />
                          </svg>
                          Tidak cocok (Terdeteksi manipulasi)
                        </span>
                      )}

                      {item.status === 'belum_diterbitkan' && (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: 'var(--zaky-status-kedaluwarsa-bg)',
                            color: 'var(--zaky-status-kedaluwarsa-text)',
                          }}
                        >
                          ⏳ Belum diterbitkan
                        </span>
                      )}
                    </td>

                    {/* Aksi Detail */}
                    <td className="py-4 px-4 text-right">
                      {item.status !== 'belum_diterbitkan' && (
                        <button
                          onClick={() => setDetailLembaga(item)}
                          className="text-xs text-primary-700 hover:text-primary-600 font-semibold underline cursor-pointer"
                        >
                          Lihat bukti
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards per Design System 5.7 */}
        <div className="md:hidden space-y-4">
          {dataLembaga.map((item) => (
            <div
              key={item.id}
              className="bg-surface rounded-xl border border-neutral-300 p-4 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <span className="font-semibold text-neutral-900">{item.nama}</span>
                <span className="text-xs text-neutral-500">{item.waktuTerbit}</span>
              </div>

              <div className="text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-sans">Hash Terbit:</span>
                  <span className="bg-neutral-100 px-1 rounded">
                    {item.hashTerbit === '—' ? '—' : `${item.hashTerbit.slice(0, 10)}...`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-sans">Hitung Ulang:</span>
                  <span>
                    {item.hashHitungUlang === '—' ? '—' : `${item.hashHitungUlang.slice(0, 10)}...`}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  {item.status === 'terkonfirmasi' && (
                    <span className="text-xs font-bold text-primary-700 bg-primary-100 px-2.5 py-1 rounded-full">
                      ✓ Terkonfirmasi (2 saksi)
                    </span>
                  )}
                  {item.status === 'tidak_cocok' && (
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                      ⚠️ Tidak cocok
                    </span>
                  )}
                  {item.status === 'belum_diterbitkan' && (
                    <span className="text-xs text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full">
                      ⏳ Belum diterbitkan
                    </span>
                  )}
                </div>

                {item.status !== 'belum_diterbitkan' && (
                  <button
                    onClick={() => setDetailLembaga(item)}
                    className="text-xs text-primary-700 font-semibold underline"
                  >
                    Detail Bukti
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Warning Box when Attack is Active (FR-47, FR-48) */}
        {simulasiSerangan && (
          <div
            className="p-5 rounded-xl border border-amber-300 space-y-3"
            style={{
              backgroundColor: 'var(--zaky-status-peringatan-bg)',
              color: 'var(--zaky-status-peringatan-text)',
            }}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="text-base">⚠️</span>
              <span>KETIDAKCOCOKAN TERDETEKSI PADA LEMBAGA A</span>
            </div>
            <p className="text-xs leading-relaxed">
              Papan silang menghitung ulang hash kepala dari entri log 1 sampai 24 pada basis data Lembaga A. Hasil hitung ulang log menghasilkan hash yang berbeda dengan hash harian yang telah dipublikasikan dan disaksikan oleh Lembaga B dan Lembaga C.
            </p>
            <div className="bg-surface p-3 rounded-lg border border-amber-200 text-xs font-mono space-y-1 text-neutral-900">
              <div className="flex flex-col sm:flex-row justify-between">
                <span className="text-neutral-500 font-sans">Hash yang diterbitkan (disaksikan B & C):</span>
                <span className="font-semibold text-primary-700">9f2c8d1e3a4b...e41a</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between">
                <span className="text-neutral-500 font-sans">Hash hitung ulang dari audit_log saat ini:</span>
                <span className="font-semibold text-red-700">c441b89ef032...aa01</span>
              </div>
            </div>
            <p className="text-xs italic">
              Status Lembaga A otomatis berubah menjadi <strong>Tidak cocok</strong>. Integritas jaringan terlindungi oleh kesaksian antarlembaga independen.
            </p>
          </div>
        )}

        {/* Explanation Card */}
        <div
          className="bg-surface rounded-xl border border-neutral-300 p-6 shadow-sm space-y-4"
          style={{ borderRadius: 'var(--zaky-radius-card)' }}
        >
          <h3 className="font-bold text-neutral-900 text-base">Bagaimana Cara Kerja Papan Silang Antarlembaga?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-600">
            <div className="space-y-1.5 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <span className="font-bold text-neutral-900 block">1. Hash Harian Ed25519</span>
              <p>
                Setiap hari pukul 00.00 WIB, setiap instance lembaga menyusun hash kepala audit log dalam format JCS (RFC 8785) dan menandatanganinya dengan kunci privat Ed25519.
              </p>
            </div>
            <div className="space-y-1.5 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <span className="font-bold text-neutral-900 block">2. Kesaksian Tersimpan</span>
              <p>
                Lembaga lain (B dan C) secara otomatis mengunduh hash tersebut, memverifikasi tanda tangannya, dan menyimpan salinan kesaksian independen di server masing-masing.
              </p>
            </div>
            <div className="space-y-1.5 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <span className="font-bold text-neutral-900 block">3. Hitung Ulang Independen</span>
              <p>
                Papan silang menghitung ulang hash dari transaksi riil. Bahkan jika admin superuser mengubah baris database secara paksa, perubahan tersebut langsung terbongkar.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal / Drawer */}
      {detailLembaga && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface max-w-xl w-full rounded-2xl p-6 shadow-xl border border-neutral-300 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h3 className="font-bold text-lg text-neutral-900">{detailLembaga.nama}</h3>
                <p className="text-xs text-neutral-500">Bukti Kriptografis & Salinan Kesaksian Tanggal 27 Okt 2026</p>
              </div>
              <button
                onClick={() => setDetailLembaga(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-neutral-500 font-medium">Hash Kepala yang Diterbitkan (Ed25519):</span>
                <p className="font-mono bg-neutral-100 p-2 rounded break-all mt-1 text-neutral-900">
                  {detailLembaga.hashTerbit}
                </p>
              </div>

              <div>
                <span className="text-neutral-500 font-medium">Hasil Hitung Ulang Log (SHA-256 JCS):</span>
                <p
                  className={`font-mono p-2 rounded break-all mt-1 ${
                    detailLembaga.hashTerbit === detailLembaga.hashHitungUlang
                      ? 'bg-primary-100/40 text-primary-700 font-medium'
                      : 'bg-red-100 text-red-800 font-bold'
                  }`}
                >
                  {detailLembaga.hashHitungUlang}
                </p>
              </div>

              <div>
                <span className="text-neutral-500 font-medium">Salinan Kesaksian Disimpan Oleh:</span>
                <div className="mt-1 space-y-2">
                  {detailLembaga.saksi.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-neutral-900">{s.lembagaNama}</span>
                        <p className="text-[11px] text-neutral-500">Diamati pada {s.waktu}</p>
                      </div>
                      <span className="text-primary-700 font-bold flex items-center gap-1">
                        ✓ Tanda Tangan Valid
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailLembaga(null)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium rounded-lg text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
