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
      ['Zaky Simulator', 'Bekerja di lima meja'],
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
      'Status, penanggung jawab, bukti, dan riwayat tetap terhubung dalam satu catatan yang dibuka dari ruang kerja.',
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
export const ROOM_SPACING = 14;
/** Progress where the exterior swaps for the rooms: the peak of the dive, when the facade fills the view. */
export const JOURNEY_CUT = 0.073;
// The character stands in front of each desk, then follows one curved route through the side door.
const DESK_Z = 0.9,
  DOOR_Z = 4.2,
  ENTRANCE: [number, number][] = [
    [-7, 4.6],
    [-4.5, 4.6],
    [-3.5, DESK_Z],
    [0, DESK_Z],
  ];
function bezier(points: [number, number][], t: number): [number, number] {
  const u = 1 - t,
    [a, b, c, d] = points;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
}
function segment(room: number): [number, number][] {
  const x0 = room * ROOM_SPACING,
    x1 = x0 + ROOM_SPACING;
  return [
    [x0, DESK_Z],
    [x0 + 7, DOOR_Z],
    [x1 - 7, DOOR_Z],
    [x1, DESK_Z],
  ];
}
/** Floor route points shared by the 3D path and the walking character. */
export function journeyRoute(samples = 24): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= samples; i++) out.push(bezier(ENTRANCE, i / samples));
  for (let r = 0; r < 4; r++)
    for (let i = 1; i <= samples; i++) out.push(bezier(segment(r), i / samples));
  return out;
}
export function chapterProgress(index: number) {
  return keys[Math.max(0, Math.min(5, Math.round(index)))] ?? 0;
}
const ease = (t: number) => t * t * (3 - 2 * t);
/** Front door of the service centre, under the "PUSAT LAYANAN ZAKY" sign: the dive zooms into it. */
export const JOURNEY_DOOR: [number, number, number] = [-0.5, 1.55, 5];
export function journeyPose(
  value: number,
  reduced = false,
): {
  chapter: number;
  target: [number, number, number];
  position: [number, number, number];
  character: [number, number, number];
  facing: number;
  walking: boolean;
  zoom: number;
  /** 0..1: how much the zoom pivots about JOURNEY_DOOR instead of the framed target */
  pivot: number;
  inside: boolean;
} {
  const p = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  let chapter = 0;
  for (let i = 1; i < keys.length; i++) if (p >= keys[i] - 0.055) chapter = i;
  if (reduced) return journeyPose(chapterProgress(chapter));
  // Room framing: the whole room sits right of the copy, like the reference video.
  const roomZoom = 1.5;
  let points: [number, number][],
    s: number,
    cameraX: number,
    zoom: number,
    y: number,
    pivot = 0;
  if (p < keys[1]) {
    // Exterior: dive towards the entrance, then settle into the first room.
    const smooth = ease(p / keys[1]);
    points = ENTRANCE;
    s = Math.max(0, Math.min(1, (smooth - 0.55) / 0.45));
    cameraX = 0;
    y = 4.3 * (1 - smooth) + smooth;
    // Zoom about the door (it holds still on screen) until the cut, then ease back to room framing.
    const dive = Math.sin(Math.PI * smooth);
    zoom = 1 + (roomZoom - 1) * smooth + (p < JOURNEY_CUT ? 9 * dive ** 3 : 1.6 * dive);
    pivot = p < JOURNEY_CUT ? 1 : 1 - ease((p - JOURNEY_CUT) / (keys[1] - JOURNEY_CUT));
  } else {
    let room = 0;
    while (room < 4 && p >= keys[room + 2]) room++;
    // Hold at each desk while the copy is read, then walk to the next room.
    const local = room < 4 ? (p - keys[room + 1]) / (keys[room + 2] - keys[room + 1]) : 1;
    points = segment(Math.min(3, room));
    s = room < 4 ? Math.max(0, Math.min(1, (local - 0.18) / 0.64)) : 1;
    cameraX = points[0][0] + ROOM_SPACING * ease(s);
    y = 1;
    zoom = roomZoom - 0.18 * Math.sin(Math.PI * s);
  }
  const [cx, cz] = bezier(points, s),
    [nx, nz] = bezier(points, Math.min(1, s + 0.01)),
    [px, pz] = bezier(points, Math.max(0, s - 0.01)),
    walking = s > 0 && s < 1;
  return {
    chapter,
    target: [cameraX, y, -0.5],
    position: [cameraX + 18, 19 + y - 1, 24.5],
    character: [cx, 0, cz],
    facing: walking ? Math.atan2(nx - px, nz - pz) : Math.PI,
    walking,
    zoom,
    pivot,
    inside: p > JOURNEY_CUT,
  };
}
