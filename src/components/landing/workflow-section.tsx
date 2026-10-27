
import React from 'react';
import {
  FileText,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  Lock,
  UserCheck,
} from 'lucide-react';
import Card3D from './card-3d';

export default function WorkflowSection() {
  const steps = [
    {
      num: '01',
      title: 'Dibuat oleh Amil (Unit Pelayanan)',
      actor: 'Amil Pelayanan',
      roleColor: 'bg-primary-100 text-primary-800',
      badge: 'Reservasi Saldo Otomatis',
      desc: 'Amil memilih mustahik terdaftar, menentukan asnaf, memasukkan nominal, dan melampirkan berkas bukti penerimaan ber-hash SHA-256.',
      invariantNote: 'Nominal langsung dipindah dari Tersedia ke Dicadangkan.',
      icon: FileText,
    },
    {
      num: '02',
      title: 'Konfirmasi Penerima (Mustahik) / Saksi',
      actor: 'Mustahik atau 2 Saksi',
      roleColor: 'bg-amber-100 text-amber-800',
      badge: 'Batas Waktu 72 Jam',
      desc: 'Penerima membuka tautan SMS/WhatsApp aman tanpa perlu instalasi aplikasi untuk menyatakan "Saya menerima", atau diverifikasi 2 saksi independen.',
      invariantNote: 'Jika kedaluwarsa atau ditolak, reservasi saldo otomatis lepas.',
      icon: Smartphone,
    },
    {
      num: '03',
      title: 'Disetujui oleh Penyetuju (Unit Keuangan)',
      actor: 'Penyetuju Keuangan',
      roleColor: 'bg-blue-100 text-blue-800',
      badge: 'Segregation of Duties',
      desc: 'Staf Unit Keuangan (wajib akun dan unit terpisah dari amil pembuat) memverifikasi bukti dan konfirmasi sebelum memberikan persetujuan final.',
      invariantNote: 'Saldo dipindah ke Tersalurkan & hash masuk ke antrean harian.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="alur" className="z-cv py-20 md:py-28 bg-white border-b border-neutral-300/80 relative scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 gsap-fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neo-convex text-primary-900 text-xs font-semibold mb-3">
            <UserCheck className="w-3.5 h-3.5 text-primary-700" />
            <span>Alur Transaksi Tiga Pihak Tanpa Kolusi</span>
          </div>
          <h2 className="z-display-2 text-neutral-900">
            Bagaimana Setiap Rupiah Disahkan
          </h2>
          <p className="mt-3 text-neutral-600 text-sm sm:text-base leading-relaxed">
            Tidak ada satu orang pun yang dapat mencairkan dana zakat secara sepihak. Setiap transaksi
            melewati tiga gerbang verifikasi independen yang saling mengunci secara matematis.
          </p>
        </div>

        {/* 3D Cards Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative gsap-stagger-group">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card3D key={step.num} className="gsap-stagger-item h-full">
                <div
                  className="neo-card-3d p-6 sm:p-8 rounded-3xl h-full flex flex-col justify-between relative group"
                  style={{ borderRadius: '24px' }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-mono text-3xl font-black text-neutral-500 group-hover:text-primary-600 transition-colors">
                        {step.num}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-full ${step.roleColor}`}
                      >
                        {step.actor}
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-2xl neo-convex flex items-center justify-center text-primary-700 mb-5">
                      <Icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-lg font-bold text-neutral-900 mb-2.5">
                      {step.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-6">
                      {step.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 text-[11px] text-neutral-700 font-mono neo-inset p-3 rounded-xl">
                    <span className="font-bold text-primary-700 block mb-0.5">Mekanisme Saldo:</span>
                    <span>{step.invariantNote}</span>
                  </div>
                </div>
              </Card3D>
            );
          })}
        </div>
      </div>
    </section>
  );
}
