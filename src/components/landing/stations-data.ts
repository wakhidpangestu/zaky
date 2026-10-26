/**
 * Data stasiun perjalanan tata kelola zakat (7 stasiun: fasad + 6 ruang).
 * Sengaja dipisah dari zaky-journey-3d.tsx agar konsumen ringan
 * (mis. daftar langkah mode statis) tidak ikut menarik chunk Three.js.
 */

export interface JourneyStation {
  id: number;
  slug: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  unit: string;
  actor: string;
  roomName: string;
  doorName: string;
  xPosition: number;
  metricLabel: string;
  metricValue: string;
  actionText: string;
  actionHref: string;
  details: {
    label: string;
    value: string;
  }[];
}

// 7 Stasiun: Fasad Markaz Zaky (0) + 6 Ruangan Tata Kelola Zakat (1 s/d 6)
export const STATIONS: JourneyStation[] = [
  {
    id: 0,
    slug: 'overview',
    badge: 'Markaz Zaky',
    title: 'Tata Kelola Zakat Transparan',
    subtitle: 'Audit Silang & Verifikasi Kriptografis',
    description:
      'Telusuri 6 ruang tata kelola zakat: akad syariah, validasi asnaf, segregasi 4-mata, hingga konsensus silang antarkota.',
    unit: 'Gedung Utama',
    actor: 'Markaz Zaky',
    roomName: 'Fasad Utama',
    doorName: 'Gerbang Utama',
    xPosition: 0,
    metricLabel: 'Pintu Masuk',
    metricValue: '3 Kota Federasi',
    actionText: 'Mulai Jelajah Gedung',
    actionHref: '#step-1',
    details: [
      { label: 'Protokol', value: 'Segregasi 4-Mata & P2P' },
      { label: 'Audit', value: 'RFC 8785 Deterministik' },
    ],
  },
  {
    id: 1,
    slug: 'akad-penerimaan',
    badge: '01. Penerimaan',
    title: 'Akad & Pemisahan Hak Amil',
    subtitle: 'Maksimal 12.5% Hak Amil Terpisah di Awal',
    description:
      'Dana zakat langsung dipisahkan otomatis. 87.5% terkunci untuk asnaf mustahik tanpa bercampur dana operasional.',
    unit: 'Unit Pengumpulan (UPZ)',
    actor: 'Amil Budi',
    roomName: 'Lobi Muzakki',
    doorName: '01. Lobi Penerimaan',
    xPosition: 22,
    metricLabel: 'Hak Mustahik',
    metricValue: '87.5% Terkunci',
    actionText: 'Simulasi Setor Zakat',
    actionHref: '/penerimaan/buat',
    details: [
      { label: 'Dana Zakat', value: '87.5% Asnaf' },
      { label: 'Hak Amil', value: 'Maks. 12.5%' },
    ],
  },
  {
    id: 2,
    slug: 'verifikasi-asnaf',
    badge: '02. Validasi Asnaf',
    title: 'Pencocokan 8 Asnaf & Privasi PDP',
    subtitle: 'Verifikasi Syariah dengan Penyamaran NIK',
    description:
      'Memastikan penerima memenuhi kriteria 8 asnaf (QS At-Taubah:60), dengan NIK dan identitas terlindungi enkripsi HMAC-SHA256.',
    unit: 'Unit Pendataan',
    actor: 'Rian (Analis)',
    roomName: 'Ruang Validasi',
    doorName: '02. Validasi Asnaf',
    xPosition: 44,
    metricLabel: 'Kriteria Syariah',
    metricValue: '8 Asnaf Sah',
    actionText: 'Pelajari Kriteria Asnaf',
    actionHref: '/docs#syariah',
    details: [
      { label: 'Golongan', value: '8 Asnaf Sah' },
      { label: 'Privasi NIK', value: 'HMAC-SHA256' },
    ],
  },
  {
    id: 3,
    slug: 'segregasi-4-mata',
    badge: '03. Otorisasi',
    title: 'Segregasi Kewenangan 4-Mata',
    subtitle: 'Persetujuan Independen Lintas Unit',
    description:
      'Amil pembuat draf dilarang menyetujui sendiri. Wajib otorisasi terpisah Unit Keuangan sebelum dana dapat dicairkan.',
    unit: 'Unit Keuangan',
    actor: 'Hari Wibowo',
    roomName: 'Ruang Direksi',
    doorName: '03. Otorisasi 4-Mata',
    xPosition: 66,
    metricLabel: 'Kontrol Mutlak',
    metricValue: 'Anti-Kolusi 100%',
    actionText: 'Cek Aturan 4-Mata',
    actionHref: '/docs#four-eyes',
    details: [
      { label: 'Segregasi', value: 'Pembuat ≠ Penyetuju' },
      { label: 'Proteksi Saldo', value: 'FOR UPDATE Lock' },
    ],
  },
  {
    id: 4,
    slug: 'distribusi-saksi',
    badge: '04. Distribusi',
    title: 'Serah Terima & Dua Saksi Sah',
    subtitle: 'Validasi Geotag Lapangan & OTP 72 Jam',
    description:
      'Penyaluran divalidasi langsung oleh dua saksi independen atau konfirmasi mandiri mustahik dengan batas waktu OTP 72 jam.',
    unit: 'Unit Distribusi',
    actor: 'Dewi Sartika',
    roomName: 'Depot Distribusi',
    doorName: '04. Distribusi & Saksi',
    xPosition: 88,
    metricLabel: 'Validasi Penyerahan',
    metricValue: 'OTP / 2 Saksi Sah',
    actionText: 'Verifikasi Penyaluran',
    actionHref: '/verifikasi/ZKHTNU9L6XKD',
    details: [
      { label: 'Validasi', value: '2 Saksi Lintas Akun' },
      { label: 'Batas Konfirmasi', value: '72 Jam Hitung Mundur' },
    ],
  },
  {
    id: 5,
    slug: 'rantai-audit',
    badge: '05. Kriptografi',
    title: 'Audit Append-Only SHA-256',
    subtitle: 'Pencatatan Rantai Kekal Tanpa Celah Edit',
    description:
      'Setiap mutasi terhubung dalam rantai hash harian RFC 8785 deterministik yang tidak dapat diedit atau dimanipulasi surut.',
    unit: 'Biro Teknologi',
    actor: 'Sistem Rantai',
    roomName: 'Server Kriptografi',
    doorName: '05. Server Kripto',
    xPosition: 110,
    metricLabel: 'Integritas Mutasi',
    metricValue: '100% SHA-256 Rantai',
    actionText: 'Pelajari Sistem Rantai',
    actionHref: '/docs#kriptografi',
    details: [
      { label: 'Kanonikalisasi', value: 'RFC 8785 JCS' },
      { label: 'Tanda Tangan', value: 'Ed25519 Asimetris' },
    ],
  },
  {
    id: 6,
    slug: 'federasi-silang',
    badge: '06. Papan Silang',
    title: 'Konsensus Silang Tiga Lembaga',
    subtitle: 'Jakarta, Bandung, dan Surabaya Saling Bersaksi',
    description:
      'Tiga lembaga zakat independen saling menandatangani hash harian satu sama lain. Setiap anomali lokal terdeteksi seketika.',
    unit: 'Jaringan Nasional',
    actor: 'Konsensus 3 Lembaga',
    roomName: 'Observatorium P2P',
    doorName: '06. Papan Silang',
    xPosition: 132,
    metricLabel: 'Konsensus Antarkota',
    metricValue: '3 Node Valid (0 Anomali)',
    actionText: 'Pantau Papan Silang',
    actionHref: '/silang',
    details: [
      { label: 'Lembaga Penerbit', value: 'Jakarta (Pusat)' },
      { label: 'Lembaga Saksi', value: 'Bandung & Surabaya' },
    ],
  },
];
