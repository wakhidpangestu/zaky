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
    title: 'Catat Zakat,',
    accent: 'Pisahkan Hak\nAmil.',
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
    title: 'Siapkan Bantuan,',
    accent: 'Untuk yang\nBerhak.',
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
    title: 'Dua Unit Saksi,',
    accent: 'Satu Amanah\nDijaga.',
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
    title: 'Bukti Diperiksa,',
    accent: 'Baru Boleh\nDisahkan.',
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
    title: 'Satu Catatan,',
    accent: 'Amanah Bisa\nDitelusuri.',
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
// Pauses and short transitions reconstructed from source frames 0/6/11/16/21/26s.
// These are presentation coordinates, never task state or financial data.
type Point = [number, number, number];
interface Stop {
  target: Point;
  position: Point;
  character: Point;
  zoom: number;
  offset: number;
}
const keys = [0, 0.16, 0.36, 0.56, 0.76, 0.96];
const stops: Stop[] = [
  {
    target: [1, 3.2, 0],
    position: [19, 18.5, 28],
    character: [-0.6, 0, 6.5],
    zoom: 1.18,
    offset: 0.26,
  },
  {
    target: [0, 1.25, 0],
    position: [4.6, 17, 28],
    character: [1.6, 0, 0.4],
    zoom: 1.95,
    offset: 0.27,
  },
  {
    target: [14, 1.4, 0],
    position: [18.6, 17, 28],
    character: [12.9, 0, 1.5],
    zoom: 1.95,
    offset: 0.27,
  },
  {
    target: [28, 1.2, 0.3],
    position: [32.6, 17, 28],
    character: [30.6, 0, -2.2],
    zoom: 1.95,
    offset: 0.27,
  },
  {
    target: [42, 1.3, 0],
    position: [46.6, 17, 28],
    character: [41.8, 0, 0.2],
    zoom: 2.05,
    offset: 0.27,
  },
  {
    target: [46, 1.3, 0],
    position: [50.6, 17, 28],
    character: [48.4, 0, 0.2],
    zoom: 2.1,
    offset: 0.1,
  },
];
export function chapterProgress(index: number) {
  return keys[Math.max(0, Math.min(5, Math.round(index)))] ?? 0;
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const point = (a: Point, b: Point, t: number): Point => [
  mix(a[0], b[0], t),
  mix(a[1], b[1], t),
  mix(a[2], b[2], t),
];
export function journeyPose(
  value: number,
  reduced = false,
): Stop & { chapter: number; facing: number; inside: boolean } {
  const p = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  let chapter = 0;
  for (let i = 1; i < keys.length; i++) if (p >= keys[i] - 0.04) chapter = i;
  if (reduced) return journeyPose(chapterProgress(chapter));
  let segment = 0;
  for (let i = 1; i < keys.length; i++) if (p >= keys[i - 1]) segment = i;
  while (segment < 5 && p >= keys[segment]) segment++;
  const previous = stops[segment - 1],
    next = stops[segment];
  const end = keys[segment],
    start = end - 0.08;
  const u = Math.max(0, Math.min(1, (p - start) / 0.08)),
    t = u * u * (3 - 2 * u);
  const control: Point = [
    mix(previous.character[0], next.character[0], 0.5),
    0,
    segment === 1 ? 5 : 8,
  ];
  if (segment === 5) control[2] = 4.5;
  const a = point(previous.character, control, t),
    b = point(control, next.character, t);
  const character = point(a, b, t);
  const moving = u > 0 && u < 1;
  return {
    chapter,
    target: point(previous.target, next.target, t),
    position: point(previous.position, next.position, t),
    character,
    zoom: mix(previous.zoom, next.zoom, t),
    offset: mix(previous.offset, next.offset, t),
    facing: moving ? Math.atan2(b[0] - a[0], b[2] - a[2]) : Math.PI,
    inside: p >= 0.12,
  };
}
/** Keep the desired screen-space shift constant while zoom changes. */
export function journeyFrustum(aspect: number, zoom: number, offset: number) {
  const width = 12 * (Number.isFinite(aspect) && aspect > 0 ? aspect : 1);
  const scale = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  const shift = (width * Math.max(-0.8, Math.min(0.8, offset))) / scale;
  return { left: -width - shift, right: width - shift, top: 12, bottom: -12 };
}
/** Settle rotations too: reduced motion must not leave a turn-only render loop. */
export function journeyHeading(current: number, desired: number, dt: number, reduced = false) {
  const turn = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
  if (reduced || Math.abs(turn) <= 0.001) return { angle: desired, moving: false };
  return { angle: current + turn * (1 - Math.exp(-dt * 12)), moving: true };
}
