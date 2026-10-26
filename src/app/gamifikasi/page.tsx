'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Flag,
  LockKeyhole,
  Medal,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';

type Mission = {
  id: string;
  label: string;
  title: string;
  description: string;
  question: string;
  options: readonly string[];
  correct: number;
  explanation: string;
  xp: number;
};

const STORAGE_KEY = 'zaky:gamifikasi:edukasi:v1';

// Seluruh materi mengikuti prinsip pencatatan Zaky. Tidak ada transaksi atau hadiah uang.
const MISSIONS: readonly Mission[] = [
  {
    id: 'saldo',
    label: 'Misi 01',
    title: 'Jaga keseimbangan dana',
    description: 'Pelajari mengapa setiap rupiah harus bisa ditelusuri.',
    question: 'Dalam pos dana Zaky, total penerimaan harus sama dengan apa?',
    options: [
      'Saldo tersedia + saldo dicadangkan + total tersalurkan',
      'Saldo tersedia + jumlah akun amil',
      'Total tersalurkan saja',
    ],
    correct: 0,
    explanation: 'Zaky menjaga invariant saldo agar dana yang sudah dicadangkan tidak dipakai dua kali.',
    xp: 50,
  },
  {
    id: 'konfirmasi',
    label: 'Misi 02',
    title: 'Dengar suara penerima',
    description: 'Kenali peran konfirmasi mustahik dan saksi.',
    question: 'Jika mustahik memiliki ponsel, bagaimana konfirmasi dicatat?',
    options: [
      'Cukup diklaim oleh amil yang mencatat',
      'Melalui tautan sekali pakai yang berlaku 72 jam',
      'Langsung dianggap selesai ketika draf dibuat',
    ],
    correct: 1,
    explanation: 'Token konfirmasi hanya dipakai sekali. Jika mustahik tidak memiliki ponsel, tersedia mekanisme dua saksi dengan aturan pemisahan peran.',
    xp: 50,
  },
  {
    id: 'persetujuan',
    label: 'Misi 03',
    title: 'Pisahkan kewenangan',
    description: 'Pahami mengapa satu orang tidak boleh menyelesaikan semua tahap.',
    question: 'Siapa yang boleh menyetujui sebuah penyaluran?',
    options: [
      'Pembuat draf, agar proses lebih cepat',
      'Saksi yang sebelumnya mengonfirmasi',
      'Akun penyetuju berwenang dari unit lain, bukan pihak sebelumnya',
    ],
    correct: 2,
    explanation: 'Pemisahan pembuat, pengonfirmasi, dan penyetuju membantu mencegah persetujuan sepihak.',
    xp: 50,
  },
  {
    id: 'audit',
    label: 'Misi 04',
    title: 'Baca jejak audit',
    description: 'Bedakan bukti konsistensi data dengan bukti fisik penyerahan.',
    question: 'Apa yang dapat dibuktikan oleh pemeriksaan rantai hash Zaky?',
    options: [
      'Bahwa uang pasti sudah sampai secara fisik',
      'Konsistensi catatan digital terhadap rantai dan jangkar pembanding',
      'Bahwa setiap penerima hanya menerima bantuan satu kali seumur hidup',
    ],
    correct: 1,
    explanation: 'Verifikasi kriptografis menguji konsistensi catatan, bukan bukti bahwa uang benar-benar diterima secara fisik.',
    xp: 50,
  },
];

const BADGES = [
  { id: 'pertama', title: 'Langkah Pertama', detail: 'Selesaikan 1 misi', threshold: 1 },
  { id: 'penjaga', title: 'Penjaga Amanah', detail: 'Selesaikan 2 misi', threshold: 2 },
  { id: 'transparansi', title: 'Sahabat Transparansi', detail: 'Selesaikan semua misi', threshold: 4 },
] as const;

function readSavedProgress(): string[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return MISSIONS.filter((mission) => parsed.includes(mission.id)).map((mission) => mission.id);
  } catch {
    return [];
  }
}

export default function GamifikasiPage() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [activeId, setActiveId] = useState(MISSIONS[0].id);
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);

  useEffect(() => {
    setCompleted(readSavedProgress());
    setReady(true);
  }, []);

  const activeMission = MISSIONS.find((item) => item.id === activeId) ?? MISSIONS[0];
  const isCompleted = completed.includes(activeMission.id);
  const xp = MISSIONS.filter((item) => completed.includes(item.id)).reduce(
    (sum, item) => sum + item.xp,
    0
  );
  const level = Math.floor(xp / 100) + 1;
  const levelProgress = xp % 100;
  const progress = (completed.length / MISSIONS.length) * 100;

  function selectMission(id: string) {
    setActiveId(id);
    setSelected(null);
    setMessage(null);
  }

  function submitAnswer() {
    if (selected === null || isCompleted) return;
    if (selected !== activeMission.correct) {
      setMessage({ ok: false, text: 'Belum tepat. Baca kembali petunjuk, lalu coba jawaban lain.' });
      return;
    }
    const next = [...completed, activeMission.id];
    setCompleted(next);
    setMessage({ ok: true, text: activeMission.explanation });
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStorageWarning(false);
    } catch {
      setStorageWarning(true);
    }
  }

  function resetProgress() {
    if (!window.confirm('Ulangi semua misi edukasi dari awal?')) return;
    setCompleted([]);
    setSelected(null);
    setMessage(null);
    setActiveId(MISSIONS[0].id);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      setStorageWarning(false);
    } catch {
      setStorageWarning(true);
    }
  }

  const nextMission = MISSIONS.find((item) => !completed.includes(item.id));

  return (
    <main className="min-h-screen bg-[#F6F8F7] text-[#14201D]">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-7 sm:px-6 lg:px-8">
        <nav className="mb-9 flex flex-wrap items-center justify-between gap-3" aria-label="Navigasi gamifikasi">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#0F5C4D] hover:underline">
            <ArrowLeft aria-hidden="true" size={18} /> Beranda Zaky
          </Link>
          <span className="rounded-full border border-[#B2E3D4] bg-[#D7F0E8] px-4 py-2 text-xs font-semibold text-[#0F5C4D]">
            Mode edukasi · prototipe
          </span>
        </nav>

        <section className="rounded-3xl bg-[#0F5C4D] px-6 py-8 text-white sm:px-9 sm:py-10">
          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold">
                <Sparkles aria-hidden="true" size={15} /> Jelajah Amanah
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Belajar zakat lewat 4 misi interaktif</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#E2F6EE] sm:text-base">
                Jelajahi bagaimana Zaky menjaga saldo, melibatkan penerima, memisahkan persetujuan,
                dan memverifikasi jejak audit. Kumpulkan XP edukasi tanpa melibatkan dana zakat.
              </p>
            </div>
            <div className="w-full max-w-xs shrink-0 rounded-2xl border border-white/25 bg-white/10 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Zap aria-hidden="true" size={18} /> Level {ready ? level : '—'}
              </div>
              <div className="mt-2 text-3xl font-bold tabular-nums">{ready ? xp : '—'} <span className="text-sm font-medium">XP</span></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label="Kemajuan level" aria-valuenow={ready ? levelProgress : 0} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-[#EED29C]" style={{ width: String(ready ? levelProgress : 0) + '%' }} />
              </div>
              <p className="mt-2 text-xs text-[#E2F6EE]">100 XP per level · maksimal 200 XP pada prototipe</p>
            </div>
          </div>
        </section>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-[#C9D3D0] bg-white p-5 sm:p-6" aria-labelledby="mission-list-title">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="mission-list-title" className="text-xl font-bold">Peta perjalanan</h2>
                  <p className="mt-1 text-sm text-[#4B5A56]">Pilih misi mana pun untuk mulai belajar.</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-[#0F5C4D]">{ready ? completed.length : '—'}/{MISSIONS.length} selesai</span>
              </div>
              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#EEF2EF]" role="progressbar" aria-label="Misi selesai" aria-valuenow={ready ? progress : 0} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-[#137A66]" style={{ width: String(ready ? progress : 0) + '%' }} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {MISSIONS.map((mission) => {
                  const done = completed.includes(mission.id);
                  const active = mission.id === activeId;
                  return (
                    <button
                      key={mission.id}
                      type="button"
                      onClick={() => selectMission(mission.id)}
                      aria-pressed={active}
                      className={'min-h-32 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F5C4D] ' +
                        (active ? 'border-[#0F5C4D] bg-[#EDF8F3]' : 'border-[#C9D3D0] bg-white hover:border-[#0F5C4D]')}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#4B5A56]">{mission.label}</span>
                        {done ? <CheckCircle2 aria-label="Selesai" size={19} className="text-[#0F5C4D]" /> : <Flag aria-label="Belum selesai" size={19} className="text-[#4B5A56]" />}
                      </div>
                      <span className="block text-sm font-bold">{mission.title}</span>
                      <span className="mt-1 block text-xs text-[#4B5A56]">{mission.xp} XP · {done ? 'Tuntas' : 'Belum tuntas'}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-[#C9D3D0] bg-white p-5 sm:p-7" aria-labelledby="quiz-title">
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#D7F0E8] px-3 py-1.5 text-xs font-semibold text-[#0F5C4D]">
                  <BookOpen aria-hidden="true" size={15} /> {activeMission.label}
                </span>
                <span className="text-xs font-semibold text-[#4B5A56]">+{activeMission.xp} XP</span>
              </div>
              <h2 id="quiz-title" className="text-2xl font-bold">{activeMission.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#4B5A56]">{activeMission.description}</p>

              <div className="mt-7 rounded-xl bg-[#F6F8F7] p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#0F5C4D]">
                  <CircleHelp aria-hidden="true" size={18} /> Uji pemahaman
                </div>
                <p className="text-base font-semibold leading-7">{activeMission.question}</p>
              </div>

              <div className="mt-5 space-y-3" role="group" aria-label="Pilihan jawaban">
                {activeMission.options.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => { setSelected(index); if (!isCompleted) setMessage(null); }}
                    disabled={isCompleted}
                    aria-pressed={selected === index}
                    className={'flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm leading-6 transition-colors disabled:cursor-default ' +
                      (selected === index ? 'border-[#0F5C4D] bg-[#EDF8F3]' : 'border-[#C9D3D0] hover:border-[#0F5C4D]')}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#B2C5BF] text-xs font-bold">{String.fromCharCode(65 + index)}</span>
                    <span>{option}</span>
                  </button>
                ))}
              </div>

              {isCompleted && !message && (
                <p className="mt-5 rounded-xl bg-[#EDF8F3] p-4 text-sm font-medium text-[#0F5C4D]">
                  Misi sudah diselesaikan. {activeMission.explanation}
                </p>
              )}
              {message && (
                <div aria-live="polite" className={'mt-5 rounded-xl border p-4 text-sm leading-6 ' +
                  (message.ok ? 'border-[#B2E3D4] bg-[#EDF8F3] text-[#0F5C4D]' : 'border-[#E9C78E] bg-[#FFF8EB] text-[#7A5A0B]')}>
                  <p className="font-bold">{message.ok ? 'Jawaban tepat! Misi selesai.' : 'Coba lagi'}</p>
                  <p className="mt-1">{message.text}</p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#4B5A56]">XP hanya diberikan sekali untuk setiap misi.</p>
                {!isCompleted ? (
                  <button
                    type="button"
                    disabled={selected === null || !ready}
                    onClick={submitAnswer}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0F5C4D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#137A66] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Periksa jawaban <ArrowRight aria-hidden="true" size={16} />
                  </button>
                ) : nextMission ? (
                  <button
                    type="button"
                    onClick={() => selectMission(nextMission.id)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0F5C4D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#137A66]"
                  >
                    Lanjut misi berikutnya <ArrowRight aria-hidden="true" size={16} />
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-[#0F5C4D]"><Trophy aria-hidden="true" size={18} /> Semua misi tuntas</span>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-[#C9D3D0] bg-white p-5" aria-labelledby="badges-title">
              <div className="flex items-center gap-2">
                <Medal aria-hidden="true" size={21} className="text-[#0F5C4D]" />
                <h2 id="badges-title" className="text-lg font-bold">Lencana pencapaian</h2>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#4B5A56]">Lencana edukasi ini bukan sertifikasi atau bukti transaksi.</p>
              <div className="mt-5 space-y-3">
                {BADGES.map((badge) => {
                  const unlocked = completed.length >= badge.threshold;
                  return (
                    <div key={badge.id} className={'flex items-start gap-3 rounded-xl border p-3 ' +
                      (unlocked ? 'border-[#B2E3D4] bg-[#EDF8F3]' : 'border-[#E2E8E5] bg-[#F6F8F7]')}>
                      <div className={'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ' +
                        (unlocked ? 'bg-[#D7F0E8] text-[#0F5C4D]' : 'bg-[#E8EFEC] text-[#4B5A56]')}>
                        {unlocked ? <Medal aria-hidden="true" size={21} /> : <LockKeyhole aria-hidden="true" size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{badge.title}</p>
                        <p className="mt-1 text-xs text-[#4B5A56]">{badge.detail}</p>
                        <p className="mt-1 text-xs font-semibold text-[#0F5C4D]">{unlocked ? 'Terbuka' : 'Terkunci'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="rounded-2xl border border-[#C9D3D0] bg-white p-5">
              <div className="flex items-center gap-2 text-[#0F5C4D]"><ShieldCheck aria-hidden="true" size={20} /><h2 className="text-base font-bold">Batasan prototipe</h2></div>
              <p className="mt-3 text-sm leading-6 text-[#4B5A56]">
                Nilai XP tersimpan di browser perangkat ini saja. Tidak terhubung ke akun, saldo, donasi,
                database, atau hasil verifikasi penyaluran.
              </p>
              {storageWarning && <p role="alert" className="mt-3 text-sm text-[#8A4B08]">Browser menolak penyimpanan. Progres mungkin hilang setelah halaman ditutup.</p>}
              <button type="button" onClick={resetProgress} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#0F5C4D] hover:underline">
                <RotateCcw aria-hidden="true" size={16} /> Mulai dari awal
              </button>
            </section>
          </aside>
        </div>
        <p className="mt-8 text-center text-xs leading-6 text-[#4B5A56]">
          <ShieldCheck aria-hidden="true" className="mr-1 inline" size={15} />
          Materi simulasi untuk memahami sistem Zaky, bukan panduan keputusan fikih atau laporan penyaluran nyata.
        </p>
      </div>
    </main>
  );
}
