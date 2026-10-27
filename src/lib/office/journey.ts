import type { StationId } from './model.ts';
export const JOURNEY_CHAPTERS: {
  label: string;
  station: StationId | null;
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  cardTitle: string;
  rows: [string, string][];
  action: string;
}[] = [
  {
    label: 'Pusat Zaky',
    station: null,
    eyebrow: 'AMANAH YANG BISA DITELUSURI',
    title: 'Zakat Tercatat.',
    accent: 'Amanah Terjaga.',
    description:
      'Dari penerimaan hingga pencatatan akhir. Setiap tahap punya petugas, bukti, dan jejak pemeriksaannya.',
    cardTitle: 'Pilih cara Anda bekerja',
    rows: [
      ['Standar', 'Cepat dan langsung'],
      ['Kantor 3D', 'Jelajahi setiap meja'],
    ],
    action: 'Mulai bekerja',
  },
  {
    label: 'Penerimaan',
    station: 'penerimaan',
    eyebrow: 'LANGKAH 1 / PENERIMAAN',
    title: 'Catat Penerimaan.',
    accent: 'Pisahkan Hak Amil.',
    description:
      'Pilih pos dana, catat penerimaan yang sudah terjadi, lalu periksa alokasi hak amil sebelum menyimpan.',
    cardTitle: 'Penerimaan yang tertata',
    rows: [
      ['Pos dana', 'Dipilih petugas'],
      ['Hak amil', 'Mengikuti batas lembaga'],
      ['Bukti catatan', 'Terbit setelah tersimpan'],
    ],
    action: 'Catat penerimaan',
  },
  {
    label: 'Penyaluran',
    station: 'penyaluran',
    eyebrow: 'LANGKAH 2 / PENYALURAN',
    title: 'Siapkan Bantuan.',
    accent: 'Jaga Ketersediaan.',
    description:
      'Mustahik berasal dari data terdaftar. Lampirkan bukti dan cadangkan dana; draf belum berarti bantuan sudah diterima.',
    cardTitle: 'Draf penyaluran',
    rows: [
      ['Penerima', 'Mustahik terdaftar'],
      ['Bukti', 'Berkas yang diunggah'],
      ['Dana', 'Dicadangkan saat tersimpan'],
    ],
    action: 'Buat draf penyaluran',
  },
  {
    label: 'Konfirmasi',
    station: 'saksi',
    eyebrow: 'LANGKAH 3 / KONFIRMASI',
    title: 'Diperiksa Saksi.',
    accent: 'Dikonfirmasi Penerima.',
    description:
      'Gunakan tautan penerima atau dua saksi independen. Petugas yang membuat draf tidak dapat bersaksi atas pekerjaannya sendiri.',
    cardTitle: 'Pemeriksaan independen',
    rows: [
      ['Saksi pertama', 'Akun dan unit berbeda'],
      ['Saksi kedua', 'Independen dari saksi pertama'],
      ['Penolakan', 'Tidak dianggap selesai'],
    ],
    action: 'Buka tugas konfirmasi',
  },
  {
    label: 'Persetujuan',
    station: 'persetujuan',
    eyebrow: 'LANGKAH 4 / PERSETUJUAN',
    title: 'Periksa Buktinya.',
    accent: 'Baru Sahkan.',
    description:
      'Penyetuju memeriksa konfirmasi dan bukti sumber. Kewenangan dipisahkan dari pembuat draf dan seluruh saksi.',
    cardTitle: 'Sebelum disahkan',
    rows: [
      ['Konfirmasi', 'Sudah tercatat'],
      ['Penyetuju', 'Akun dan unit independen'],
      ['Saldo', 'Diperiksa bersama transaksi'],
    ],
    action: 'Buka persetujuan',
  },
  {
    label: 'Catatan',
    station: 'catatan',
    eyebrow: 'LANGKAH 5 / CATATAN',
    title: 'Satu Catatan.',
    accent: 'Bisa Ditelusuri.',
    description:
      'Status, penanggung jawab, bukti, dan riwayat tetap terhubung. Mode Standar dan Kantor 3D membuka catatan yang sama.',
    cardTitle: 'Jejak amanah',
    rows: [
      ['Kode catatan', 'Mengacu ke record tersimpan'],
      ['Riwayat', 'Setiap pergantian penanganan'],
      ['Bukti digital', 'Dapat dibuka dan dicetak'],
    ],
    action: 'Lihat catatan bersama',
  },
];
const keys = [0, 0.14, 0.34, 0.54, 0.74, 0.94];
export function chapterProgress(index: number) {
  return keys[Math.max(0, Math.min(5, Math.round(index)))] ?? 0;
}
export function journeyPose(
  value: number,
  reduced = false,
): {
  chapter: number;
  target: [number, number, number];
  position: [number, number, number];
  character: [number, number, number];
  zoom: number;
  inside: boolean;
} {
  const p = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  let chapter = 0;
  for (let i = 1; i < keys.length; i++) if (p >= keys[i] - 0.055) chapter = i;
  if (reduced) return journeyPose(chapterProgress(chapter));
  const t = Math.min(1, p / 0.14),
    smooth = t * t * (3 - 2 * t);
  const x = p < 0.14 ? 0 : p >= 0.94 ? 56 : ((p - 0.14) / 0.8) * 56;
  return {
    chapter,
    target: [x, 4.3 * (1 - smooth) + 1.2 * smooth, 0],
    position: [x + 18, 19, 25],
    character: [p < 0.14 ? -3 * (1 - smooth) : x, 0, 4.5],
    zoom: 1 + smooth * 1.1,
    inside: p > 0.09,
  };
}
