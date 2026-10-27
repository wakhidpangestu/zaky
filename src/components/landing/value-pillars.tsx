
import React from 'react';
import {
  Server,
  UserCheck,
  Split,
  Eye,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import Card3D from './card-3d';

export default function ValuePillars() {
  const pillars = [
    {
      icon: Server,
      title: 'Kedaulatan Data Penuh',
      badge: 'Instance Mandiri',
      description:
        'Setiap lembaga mengelola server dan basis datanya sendiri. Tidak ada vendor tunggal yang memegang kendali data umat, dan tidak ada ketergantungan yang menciptakan titik kegagalan tunggal.',
      points: [
        'Kunci privat Ed25519 dikuasai sendiri oleh tiap LAZ',
        'Basis data PostgreSQL independen tanpa campur tangan luar',
        'Tahan terhadap gangguan koneksi atau kegagalan pihak ketiga',
      ],
    },
    {
      icon: UserCheck,
      title: 'Konfirmasi Langsung Mustahik',
      badge: 'Bebas Penyaluran Fiktif',
      description:
        'Penyaluran hanya sah jika dikonfirmasi langsung oleh penerima manfaat melalui tautan sekali pakai tanpa login. Bagi mustahik tanpa ponsel, diverifikasi oleh 2 saksi independen dari unit berbeda.',
      points: [
        'Tautan SMS/WhatsApp aman tanpa perlu instalasi aplikasi',
        'Batas waktu konfirmasi 72 jam dengan hitung mundur otomatis',
        'Dukungan metode 2 saksi terverifikasi untuk daerah pelosok',
      ],
    },
    {
      icon: Split,
      title: 'Pemisahan Kewenangan (Segregation)',
      badge: 'Anti-Kolusi Struktural',
      description:
        'Amil yang membuat draf dilarang mengonfirmasi atau menyetujui penyaluran yang dibuatnya. Persetujuan akhir wajib dilakukan oleh personel dari unit kerja yang terpisah (misalnya Unit Keuangan).',
      points: [
        'Pencegahan benturan kepentingan di level kode dan otorisasi',
        'Validasi ketat 4 akun dan 2 unit pada metode saksi',
        'Pesan penolakan transparan dengan kode error teknis',
      ],
    },
    {
      icon: Eye,
      title: 'Pemeriksaan Silang Kriptografis',
      badge: 'Merkle Tree & Ed25519',
      description:
        'Setiap tengah malam, hash kepala dari seluruh mutasi harian diterbitkan dan disaksikan lembaga anggota lain. Upaya mengubah catatan di masa lalu akan langsung terdeteksi di Papan Silang nasional.',
      points: [
        'Hash rantai audit SHA-256 yang saling mengunci',
        'Tanda tangan digital Ed25519 yang dapat diuji siapa pun',
        'Deteksi manipulasi data lokal dalam hitungan detik',
      ],
    },
  ];

  return (
    <section id="prinsip" className="z-cv py-20 md:py-28 bg-white border-b border-neutral-300/80 relative scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 gsap-fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neo-convex text-primary-900 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-700" />
            <span>Fondasi Arsitektur Zaky</span>
          </div>
          <h2 className="z-display-2 text-neutral-900">
            Empat Pilar Kepercayaan Tanpa Keraguan
          </h2>
          <p className="mt-3 text-neutral-600 text-sm sm:text-base leading-relaxed">
            Dirancang dengan prinsip "Tenang, bukan ramai. Bukti selalu terlihat." Zaky menggabungkan
            keteguhan fiqih amanah dengan disiplin kriptografi modern.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 gsap-stagger-group">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <Card3D key={index} className="gsap-stagger-item h-full">
                <div
                  className="neo-card-3d p-6 sm:p-8 rounded-3xl h-full flex flex-col justify-between"
                  style={{ borderRadius: '24px' }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl neo-convex text-primary-700 flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold text-primary-700 neo-convex px-3.5 py-1 rounded-full">
                        {pillar.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-neutral-900 mb-2.5">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="border-t border-neutral-100 pt-5 space-y-2.5">
                    {pillar.points.map((pt, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2.5 text-xs text-neutral-700">
                        <CheckCircle2 className="w-4 h-4 text-primary-700 flex-shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
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
