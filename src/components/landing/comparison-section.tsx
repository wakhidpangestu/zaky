
import React from 'react';
import { Check, X, Shield, AlertCircle } from 'lucide-react';
import Card3D from './card-3d';

export default function ComparisonSection() {
  const comparisons = [
    {
      aspect: 'Pencatatan Penyaluran',
      konvensional: 'Dicatat sepihak dalam sistem internal tanpa saksi luar.',
      zaky: 'Rantai audit SHA-256 yang saling mengunci dan diterbitkan harian.',
    },
    {
      aspect: 'Konfirmasi Penerima (Mustahik)',
      konvensional: 'Hanya tanda tangan kuitansi fisik yang rentan dipalsukan.',
      zaky: 'Konfirmasi langsung penerima via tautan atau 2 saksi akun terpisah.',
    },
    {
      aspect: 'Pemisahan Wewenang',
      konvensional: 'Satu pejabat dapat menginput sekaligus menyetujui.',
      zaky: 'Wajib unit berbeda: pembuat (Pelayanan) & penyetuju (Keuangan).',
    },
    {
      aspect: 'Pencegahan Saldo Negatif',
      konvensional: 'Hanya pengecekan logika aplikasi yang rawan race condition.',
      zaky: 'Constraint database ketat: invariant Total = Ada + Cadang + Salur.',
    },
    {
      aspect: 'Deteksi Manipulasi Data',
      konvensional: 'Hanya terdeteksi saat audit tahunan, sering terlambat.',
      zaky: 'Terdeteksi seketika di Papan Silang jika hash berbeda dengan saksi.',
    },
    {
      aspect: 'Kedaulatan & Privasi Data',
      konvensional: 'Data dipusatkan ke server vendor atau tertutup rapat.',
      zaky: 'Instance mandiri tiap LAZ; data mustahik terlindungi UU 27/2022.',
    },
  ];

  return (
    <section className="z-cv py-20 md:py-28 bg-white border-b border-neutral-300/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 gsap-fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neo-convex text-primary-900 text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5 text-primary-700" />
            <span>Kajian Transformasi Transparansi</span>
          </div>
          <h2 className="z-display-2 text-neutral-900">
            Mengapa Pendekatan Zaky Berbeda?
          </h2>
          <p className="mt-3 text-neutral-600 text-sm sm:text-base leading-relaxed">
            Perbandingan fundamental antara model pengelolaan tertutup konvensional dengan sistem
            verifikasi terdistribusi Zaky.
          </p>
        </div>

        {/* Comparison Table for Desktop with Neomorphic Card container */}
        <div className="hidden lg:block">
          <Card3D maxRotate={4}>
            <div
              className="neo-card-3d overflow-hidden rounded-3xl overflow-x-auto"
              style={{ borderRadius: '24px' }}
            >
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-neutral-200 bg-[#F7F4ED]">
                    <th className="py-4 px-6 text-xs font-bold text-neutral-700 uppercase tracking-wider w-1/4">
                      Aspek Tata Kelola
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-neutral-600 uppercase tracking-wider w-3/8">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-neutral-400" />
                        <span>Sistem Konvensional ("Kotak Hitam")</span>
                      </div>
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-primary-700 uppercase tracking-wider w-3/8 bg-primary-100/40">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-primary-700" />
                        <span>Jaringan Zaky ("Saling Memeriksa")</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {comparisons.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 1 ? 'bg-neutral-50/50' : 'bg-surface'}
                    >
                      <td className="py-4 px-6 font-semibold text-neutral-900">
                        {row.aspect}
                      </td>
                      <td className="py-4 px-6 text-neutral-600">
                        <div className="flex items-start gap-2">
                          <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <span>{row.konvensional}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-neutral-900 font-medium bg-primary-50/30">
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary-700 flex-shrink-0 mt-0.5" />
                          <span className="text-primary-950 font-semibold">{row.zaky}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card3D>
        </div>

        {/* Mobile & Tablet Comparison Cards with 3D Tilt */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 gsap-stagger-group">
          {comparisons.map((row, idx) => (
            <Card3D key={idx} className="gsap-stagger-item h-full">
              <div
                className="neo-card-3d p-5 rounded-2xl space-y-3 h-full flex flex-col justify-between"
                style={{ borderRadius: '20px' }}
              >
                <div className="font-bold text-neutral-900 text-base pb-2 border-b border-neutral-100">
                  {row.aspect}
                </div>

                <div className="p-3 rounded-xl neo-inset text-xs text-neutral-600 space-y-1">
                  <div className="font-semibold text-neutral-600 uppercase text-[10px] flex items-center gap-1">
                    <X className="w-3.5 h-3.5 text-red-500" />
                    <span>Konvensional:</span>
                  </div>
                  <p>{row.konvensional}</p>
                </div>

                <div className="p-3 rounded-xl neo-convex text-xs text-primary-950 space-y-1 border border-primary-200">
                  <div className="font-semibold text-primary-800 uppercase text-[10px] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-primary-700" />
                    <span>Pendekatan Zaky:</span>
                  </div>
                  <p className="font-semibold">{row.zaky}</p>
                </div>
              </div>
            </Card3D>
          ))}
        </div>
      </div>
    </section>
  );
}
