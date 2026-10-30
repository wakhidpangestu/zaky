'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Boxes,
  Inbox,
  CornerDownLeft,
  FilePlus,
  HandCoins,
  HandHeart,
  LayoutDashboard,
  Network,
  LayoutGrid,
  Search,
  SearchCheck,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

interface Feature {
  href: string;
  label: string;
  description: string;
  group: 'Halaman' | 'Tindakan' | 'Publik';
  icon: LucideIcon;
  /** extra words people type for this feature */
  keywords: string;
}

const FEATURES: Feature[] = [
  { href: '/dasbor?mode=standard', label: 'Pos Dana', description: 'Ringkasan saldo setiap pos dana', group: 'Halaman', icon: LayoutGrid, keywords: 'dasbor beranda saldo ringkasan dana zakat infak sedekah' },
  { href: '/penerimaan', label: 'Daftar Penerimaan', description: 'Semua zakat yang sudah dicatat masuk', group: 'Halaman', icon: HandCoins, keywords: 'penerimaan masuk muzaki riwayat setoran' },
  { href: '/penyaluran', label: 'Daftar Penyaluran', description: 'Draf, reservasi dan status penyaluran', group: 'Halaman', icon: HandHeart, keywords: 'penyaluran mustahik bantuan reservasi status keluar' },
  { href: '/pekerjaan', label: 'Antrean Pekerjaan', description: 'Tugas yang menunggu tindakan Anda', group: 'Halaman', icon: Inbox, keywords: 'antrean tugas pekerjaan saksi konfirmasi todo' },
  { href: '/persetujuan', label: 'Persetujuan', description: 'Periksa bukti lalu sahkan penyaluran', group: 'Halaman', icon: ShieldCheck, keywords: 'persetujuan setujui sahkan penyetuju approval' },
  { href: '/profil', label: 'Profil & Pengaturan', description: 'Nama, peran dan unit kerja', group: 'Halaman', icon: UserRound, keywords: 'profil akun pengaturan nama peran' },
  { href: '/penerimaan/buat', label: 'Catat Penerimaan', description: 'Pilih pos dana dan pisahkan hak amil', group: 'Tindakan', icon: FilePlus, keywords: 'catat baru tambah penerimaan hak amil setoran' },
  { href: '/penyaluran/buat', label: 'Buat Draf Penyaluran', description: 'Pilih mustahik, lampirkan bukti, cadangkan dana', group: 'Tindakan', icon: HandHeart, keywords: 'buat baru draf penyaluran mustahik bukti cadangkan' },
  { href: '/dasbor?mode=3d', label: 'Buka Zaky Simulator', description: 'Kerjakan tugas nyata di kantor 3D, data realtime', group: 'Tindakan', icon: Boxes, keywords: 'simulator 3d game kantor kerja' },
  { href: '/dasbor?mode=standard', label: 'Mode Standar', description: 'Kembali ke catatan lembaga', group: 'Tindakan', icon: LayoutDashboard, keywords: 'standar mode normal' },
  { href: '/verifikasi', label: 'Verifikasi Publik', description: 'Periksa kode ZK atau RC', group: 'Publik', icon: SearchCheck, keywords: 'verifikasi cek kode hash publik bukti' },
  { href: '/silang', label: 'Papan Silang', description: 'Kesaksian hash antarlembaga', group: 'Publik', icon: Network, keywords: 'papan silang antarlembaga hash kesaksian p2p jaringan' },
  { href: '/docs', label: 'Dokumentasi', description: 'Panduan alur kerja dan arsitektur', group: 'Publik', icon: BookOpen, keywords: 'dokumentasi docs panduan bantuan arsitektur' },
];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** Every typed word must appear; label hits rank above keyword hits. */
function search(query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return FEATURES;
  return FEATURES.map((f) => {
    const label = normalize(f.label),
      all = label + ' ' + normalize(f.description + ' ' + f.keywords);
    if (!words.every((w) => all.includes(w))) return null;
    const score = words.reduce(
      (n, w) => n + (label.startsWith(w) ? 3 : label.includes(w) ? 2 : 1),
      0,
    );
    return { f, score };
  })
    .filter((x): x is { f: Feature; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.f);
}

/** Header search for dashboard features: click, Ctrl/⌘+K or "/" to open. */
export default function FeatureSearch() {
  const router = useRouter(),
    [open, setOpen] = useState(false),
    [query, setQuery] = useState(''),
    [cursor, setCursor] = useState(0),
    input = useRef<HTMLInputElement>(null),
    list = useRef<HTMLUListElement>(null);
  const results = useMemo(() => search(query), [query]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable]');
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);
  function close() {
    setOpen(false);
    setQuery('');
    setCursor(0);
  }
  function go(f: Feature | undefined) {
    if (!f) return;
    close();
    router.push(f.href);
  }
  const groups = (['Tindakan', 'Halaman', 'Publik'] as const)
    .map((g) => ({ g, items: results.filter((f) => f.group === g) }))
    .filter((x) => x.items.length);
  const ordered = groups.flatMap((x) => x.items);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-10 pl-3 pr-2 rounded-full neo-inset text-[13px] text-[#4E625E] hover:text-primary-700 transition-colors cursor-pointer"
        aria-label="Cari fitur"
        aria-keyshortcuts="Control+K"
      >
        <Search size={16} />
        <span className="hidden sm:inline min-w-[7.5rem] text-left">Cari fitur…</span>
        <kbd className="hidden md:inline-flex items-center px-1.5 h-6 rounded-md bg-white/80 border border-black/5 text-xs font-mono font-semibold text-[#324541]">
          Ctrl K
        </kbd>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh] bg-[#0E1F1B]/40 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cari fitur"
            className="w-full max-w-xl overflow-hidden rounded-3xl bg-[#F4F8F6] border border-white shadow-[0_40px_80px_-30px_rgba(8,60,34,0.55)]"
          >
            <div className="flex items-center gap-3 px-5 h-16 border-b border-black/5">
              <Search size={20} className="text-primary-700 shrink-0" />
              <input
                ref={input}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCursor(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setCursor((c) => Math.min(ordered.length - 1, c + 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setCursor((c) => Math.max(0, c - 1));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    go(ordered[cursor]);
                  } else if (e.key === 'Escape') close();
                }}
                placeholder="Cari fitur, mis. catat penerimaan, saksi, hash…"
                className="flex-1 min-w-0 bg-transparent border-0 text-[16px] text-[#0E1F1B] placeholder:text-[#7A8C88] focus:shadow-none"
                role="combobox"
                aria-expanded="true"
                aria-controls="feature-search-list"
                aria-activedescendant={ordered[cursor] ? 'feature-' + cursor : undefined}
              />
              <kbd className="px-2 h-6 inline-flex items-center rounded-md bg-white border border-black/5 text-xs font-mono text-[#4E625E]">
                Esc
              </kbd>
            </div>
            <ul ref={list} id="feature-search-list" role="listbox" className="max-h-[56vh] overflow-y-auto p-2">
              {!ordered.length && (
                <li className="px-4 py-10 text-center text-sm text-[#4E625E]">
                  Tidak ada fitur yang cocok dengan “{query}”.
                </li>
              )}
              {groups.map(({ g, items }) => (
                <li key={g} role="presentation">
                  <p className="px-3 pt-3 pb-1.5 text-xs font-bold tracking-[0.12em] uppercase text-[#7A8C88]">
                    {g}
                  </p>
                  <ul role="presentation">
                    {items.map((f) => {
                      const i = ordered.indexOf(f),
                        Icon = f.icon,
                        on = i === cursor;
                      return (
                        <li
                          key={f.label}
                          id={'feature-' + i}
                          role="option"
                          aria-selected={on}
                          onMouseMove={() => setCursor(i)}
                          onClick={() => go(f)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer ${
                            on ? 'bg-white shadow-[0_6px_18px_-10px_rgba(8,60,34,0.4)]' : ''
                          }`}
                        >
                          <span
                            className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ${
                              on ? 'bg-primary-700 text-white' : 'bg-white text-primary-700'
                            }`}
                          >
                            <Icon size={18} />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[14px] font-semibold text-[#0E1F1B]">{f.label}</span>
                            <span className="block text-[12.5px] text-[#4E625E] truncate">{f.description}</span>
                          </span>
                          {on ? (
                            <CornerDownLeft size={16} className="text-primary-700" />
                          ) : (
                            <ArrowRight size={16} className="text-[#A6B4B0]" />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
            <div className="flex gap-4 px-5 py-3 border-t border-black/5 text-[12px] text-[#7A8C88]">
              <span className="flex items-center gap-1"><ArrowUp size={12} /><ArrowDown size={12} /> pilih</span>
              <span>Enter buka</span>
              <span>Esc tutup</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
