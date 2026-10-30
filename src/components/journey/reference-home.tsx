'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Wallet,
  Users,
  FileCheck2,
  Check,
  ArrowDown,
  Monitor,
  ExternalLink,
  LockKeyhole,
  Route,
  HandCoins,
  ClipboardCheck,
  BadgeCheck,
  Link2,
  Fingerprint,
  Lock,
  CircleX,
  Clock3,
  Scale,
  UserCog,
  Stamp,
  CircleCheck,
  type LucideIcon,
} from 'lucide-react';
import Journey from './journey';
import dynamic from 'next/dynamic';
// Wizard baru dibutuhkan saat dibuka; jangan ikut di bundle awal beranda.
const WorkWizard = dynamic(() => import('@/components/workflow/work-wizard'), { ssr: false });
import SiteFooter from '@/components/site/site-footer';
import FAQs, { type FaqItem } from '@/components/ui/text-reveal-faqs';
import { LayoutGrid, Workflow, Network, House, BookOpenText } from 'lucide-react';
import SiteNavbar, { type SiteNavItem } from '@/components/site/site-navbar';
import './reference.css';
import './home-content.css';
import './home-motion.css';
const NAV_ITEMS: SiteNavItem[] = [
  { label: 'Beranda', href: '#', icon: House },
  { label: 'Layanan', href: '#layanan', icon: LayoutGrid },
  { label: 'Cara kerja', href: '#cara-kerja', icon: Workflow },
  { label: 'Cek Kode', href: '/verifikasi', icon: ShieldCheck },
  { label: 'Papan Silang', href: '/silang', icon: Network },
  { label: 'Dokumentasi', href: '/docs', icon: BookOpenText },
];
/** Index of the nav item whose section sits under the navbar, 0 while still in the hero. */
function useActiveSection() {
  const [active, setActive] = useState(0);
  // After a menu click the page glides past other sections; hold the clicked item
  // until scrolling settles so the active pill does not flicker across the menu.
  const locked = useRef<number | null>(null);
  const settle = useRef(0);
  const choose = useCallback((i: number) => {
    locked.current = i;
    setActive(i);
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => (locked.current = null), 1200);
  }, []);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      if (locked.current !== null) {
        // Still gliding: push the release back until 160 ms pass with no scroll.
        window.clearTimeout(settle.current);
        settle.current = window.setTimeout(() => {
          locked.current = null;
          update();
        }, 160);
        return;
      }
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        let next = 0;
        NAV_ITEMS.forEach((item, i) => {
          const el = item.href.length > 1 && item.href.startsWith('#') && document.getElementById(item.href.slice(1));
          if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.35) next = i;
        });
        setActive(next);
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle.current);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return [active, choose] as const;
}
// The questions muzaki, amil, and lembaga ask most; every answer matches the domain rules.
const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'cek-zakat',
    question: 'Bagaimana saya tahu zakat saya benar-benar tersalurkan?',
    answer:
      'Setiap catatan punya kode 12 karakter dari lembaga. Masukkan kode itu di halaman Cek Kode untuk melihat status terakhir, nominal, pos dana, dan hash audit catatan tersebut, tanpa perlu masuk.',
  },
  {
    id: 'privasi',
    question: 'Apakah data pribadi muzaki dan mustahik ditampilkan ke publik?',
    answer:
      'Tidak. Halaman publik hanya menampilkan status, nominal, pos dana, dan asnaf. Mustahik dicatat dengan nama samaran, dan nomor telepon hanya disimpan dalam bentuk HMAC, bukan teks asli.',
  },
  {
    id: 'hak-amil',
    question: 'Berapa bagian yang boleh diambil sebagai hak amil?',
    answer:
      'Paling banyak 12,5% (1/8) dari zakat dan 20% dari infak. Batas ini dikunci saat penerimaan dicatat, sehingga alokasi melebihi batas ditolak sistem.',
  },
  {
    id: 'konfirmasi',
    question: 'Bagaimana penyaluran dikonfirmasi?',
    answer:
      'Melalui tautan yang dibuka langsung oleh penerima, atau dua saksi independen dari unit yang berbeda dengan pembuat draf. Pembuat draf tidak dapat bersaksi atas pekerjaannya sendiri.',
  },
  {
    id: 'kedaluwarsa',
    question: 'Apa yang terjadi bila penyaluran tidak dikonfirmasi?',
    answer:
      'Draf mencadangkan saldo selama 72 jam. Bila tidak dikonfirmasi sampai batas itu, statusnya menjadi kedaluwarsa dan saldo cadangan kembali ke saldo tersedia. Penolakan dan kedaluwarsa tetap tercatat di jejak audit.',
  },
  {
    id: 'silang',
    question: 'Apa itu papan silang antarlembaga?',
    answer:
      'Setiap hari lembaga menerbitkan hash rantai audit yang ditandatangani. Lembaga anggota lain bersaksi atas hash itu, sehingga perubahan diam-diam pada catatan lama akan terlihat tidak cocok.',
  },
  {
    id: 'uang',
    question: 'Apakah Zaky memindahkan uang secara otomatis?',
    answer:
      'Tidak. Zaky mencatat, mencadangkan saldo, dan memeriksa konfirmasi sesuai aturan lembaga. Tidak ada klaim pembayaran bank berhasil hanya dari sebuah tombol.',
  },
  {
    id: 'simulator',
    question: 'Apa bedanya mode Standar dan Zaky Simulator?',
    answer:
      'Keduanya memakai catatan lembaga yang sama secara realtime. Mode Standar menampilkan formulir dan antrean biasa; Zaky Simulator menyajikan pekerjaan yang sama sebagai kantor 3D yang bisa dijelajahi dengan keyboard atau sentuhan.',
  },
];
interface Role {
  title: string;
  tag: string;
  desc: string;
  Icon: LucideIcon;
  tone: 'sun' | 'leaf' | 'mint' | 'ink' | 'sand';
  can: string;
  cannot: string;
}
// Each role shows one thing it may do and one it may not: segregation of duties made concrete.
const roles: Role[] = [
  {
    title: 'Amil penerimaan',
    tag: 'Amil',
    desc: 'Mencatat dana masuk dan memisahkan alokasi hak amil.',
    Icon: HandCoins,
    tone: 'sun',
    can: 'Mencatat zakat & infak',
    cannot: 'Mengesahkan penyaluran',
  },
  {
    title: 'Amil penyaluran',
    tag: 'Amil',
    desc: 'Menyiapkan draf, mustahik terdaftar, dan berkas bukti.',
    Icon: ClipboardCheck,
    tone: 'leaf',
    can: 'Membuat draf & unggah bukti',
    cannot: 'Bersaksi atas draf sendiri',
  },
  {
    title: 'Saksi independen',
    tag: 'Saksi',
    desc: 'Amil dari unit berbeda yang memeriksa penyerahan.',
    Icon: BadgeCheck,
    tone: 'mint',
    can: 'Mengonfirmasi penyerahan',
    cannot: 'Bersaksi dari unit pembuat',
  },
  {
    title: 'Penyetuju',
    tag: 'Penyetuju',
    desc: 'Memeriksa konfirmasi sebelum mengesahkan penyaluran.',
    Icon: Stamp,
    tone: 'ink',
    can: 'Mengesahkan atau mengembalikan',
    cannot: 'Mengubah isi draf',
  },
  {
    title: 'Admin lembaga',
    tag: 'Admin',
    desc: 'Mengelola unit dan akun sesuai kewenangan lembaga.',
    Icon: UserCog,
    tone: 'sand',
    can: 'Mengatur unit & akun',
    cannot: 'Menghapus jejak audit',
  },
];
/** Key facts shown under the hero; each one is enforced by the domain rules. */
const PROOF = [
  { value: '4 mata', label: 'Pembuat, dua saksi, dan penyetuju selalu orang berbeda.', Icon: Users },
  { value: '12,5%', label: 'Batas hak amil dari zakat (1/8) dikunci sejak pencatatan.', Icon: Scale },
  { value: '8 asnaf', label: 'Penerima mengikuti kategori QS At-Taubah: 60.', Icon: BadgeCheck },
  { value: 'Harian', label: 'Hash audit ditandatangani dan disaksikan lembaga lain.', Icon: Fingerprint },
];
/** The five stages every record passes through, in order. */
const FLOW = [
  {
    title: 'Catat penerimaan',
    who: 'Amil penerimaan',
    desc: 'Dana masuk ke pos zakat atau infak; hak amil dipisahkan dan dibatasi otomatis.',
    Icon: HandCoins,
  },
  {
    title: 'Siapkan draf penyaluran',
    who: 'Amil penyaluran',
    desc: 'Mustahik terdaftar dan berkas bukti dilampirkan; saldo langsung dicadangkan 72 jam.',
    Icon: ClipboardCheck,
  },
  {
    title: 'Konfirmasi independen',
    who: 'Penerima / 2 saksi',
    desc: 'Lewat tautan penerima atau dua saksi dari unit yang berbeda dengan pembuat.',
    Icon: BadgeCheck,
  },
  {
    title: 'Persetujuan',
    who: 'Penyetuju',
    desc: 'Konfirmasi diperiksa lalu disahkan; penolakan tetap tercatat apa adanya.',
    Icon: Stamp,
  },
  {
    title: 'Hash harian & kesaksian silang',
    who: 'Jaringan lembaga',
    desc: 'Rantai audit diterbitkan setiap hari dan disaksikan lembaga anggota lain.',
    Icon: Link2,
  },
];
/** The four rooms a record passes, rendered from the same 3D office as the hero. */
const STAGE_SCENES = [
  { id: 'penerimaan', label: 'Penerimaan', img: '/scenes/penerimaan.webp' },
  { id: 'penyaluran', label: 'Penyaluran', img: '/scenes/penyaluran.webp' },
  { id: 'saksi', label: 'Konfirmasi', img: '/scenes/konfirmasi.webp' },
  { id: 'persetujuan', label: 'Persetujuan', img: '/scenes/persetujuan.webp' },
];
function StageRail({ current }: { current?: string }) {
  // A checked record lights its stage; "catatan" means every room is behind it.
  const at = current === 'catatan' ? STAGE_SCENES.length : STAGE_SCENES.findIndex((s) => s.id === current);
  return (
    <div className="zj-rail" aria-hidden="true">
      <svg className="zj-rail-path" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M27 20 C 55 18, 60 30, 73 36 S 40 52, 27 62 S 60 76, 73 80" />
      </svg>
      {STAGE_SCENES.map((s, i) => (
        <figure
          key={s.id}
          className={'zj-rail-stop' + (i === at ? ' is-now' : '') + (at >= 0 && i < at ? ' is-done' : '')}
          style={{ '--i': i } as React.CSSProperties}
        >
          <Image src={s.img} alt="" width={1400} height={1328} sizes="(max-width: 760px) 44vw, 230px" />
          <figcaption>
            <b>{i + 1}</b>
            {s.label}
            {i === at && <em>Tahap saat ini</em>}
            {at >= 0 && i < at && <CircleCheck size={13} />}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
/** iPhone with Dynamic Island showing the real mobile dashboard, gently scrolling. */
function IPhone() {
  return (
    <div className="zj-iphone">
      <span className="zj-iphone-key action" aria-hidden="true" />
      <span className="zj-iphone-key vol-up" aria-hidden="true" />
      <span className="zj-iphone-key vol-down" aria-hidden="true" />
      <span className="zj-iphone-key power" aria-hidden="true" />
      <div className="zj-iphone-bezel">
        <div className="zj-iphone-screen">
          <div className="zj-statusbar" aria-hidden="true">
            <span className="zj-sb-time">9:41</span>
            <span className="zj-island" />
            <span className="zj-sb-icons">
              <svg viewBox="0 0 18 12" width="17" height="11">
                <rect x="0" y="8" width="3" height="4" rx="1" />
                <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
                <rect x="10" y="3" width="3" height="9" rx="1" />
                <rect x="15" y="0" width="3" height="12" rx="1" />
              </svg>
              <svg viewBox="0 0 16 12" width="15" height="11">
                <path d="M8 2.3c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .5 10.4 10.4 0 0 0 .8 3.4L2 4.7a8.6 8.6 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.3-1.3A6.6 6.6 0 0 0 8 4.1a6.6 6.6 0 0 0-4.7 1.8l1.3 1.3c.9-.8 2.1-1.3 3.4-1.3Zm0 3.5c.5 0 .9.2 1.2.5L8 11.2 6.8 9.9c.3-.3.7-.5 1.2-.5Z" />
              </svg>
              <span className="zj-battery">
                <span />
              </span>
            </span>
          </div>
          <div className="zj-iphone-view">
            <Image
              src="/scenes/app-workspace-v3.webp"
              alt="Ruang kerja Zaky di ponsel: sapaan amil, ikhtisar amanah, dan saldo pos dana"
              width={780}
              height={2913}
              sizes="(max-width: 760px) 250px, 290px"
            />
          </div>
          <span className="zj-home-bar" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
/** The headquarters render on a tilted glass stage with chips floating at different depths. */
function FinalArt() {
  return (
    <div className="zj-final-art" aria-hidden="true">
      <div className="zj-final-stage">
        <div className="zj-final-window">
          <Image src="/scenes/gedung.webp" alt="" width={1400} height={1328} sizes="(max-width: 760px) 80vw, 420px" />
        </div>
        <span className="zj-float f1">
          <CircleCheck size={14} /> 2/2 saksi independen
        </span>
        <span className="zj-float f2">
          <Link2 size={14} /> Hash harian #168 disaksikan
        </span>
        <span className="zj-float f3">
          <Lock size={14} /> Rp 700.000 dicadangkan
        </span>
      </div>
    </div>
  );
}
// Miniature product UI for the service cards: each shows what the tool actually records.
function ReceiptMini() {
  return (
    <div className="zj-mini">
      <div className="zj-mini-row">
        <small>Zakat maal · Bu Ratna</small>
        <strong>Rp 2.000.000</strong>
      </div>
      <div className="zj-split" role="presentation">
        <span style={{ width: '87.5%' }} />
        <span style={{ width: '12.5%' }} />
      </div>
      <div className="zj-mini-legend">
        <span>
          <i className="dot-primary" /> Pos zakat 87,5%
        </span>
        <span>
          <i className="dot-sun" /> Hak amil 12,5%
        </span>
      </div>
    </div>
  );
}
function DraftMini() {
  return (
    <div className="zj-mini">
      <div className="zj-mini-person">
        <span className="zj-avatar">TN</span>
        <div>
          <strong>Teh Nia</strong>
          <small>Fakir · Kab. Bandung</small>
        </div>
        <em>Rp 700rb</em>
      </div>
      <div className="zj-chip-row">
        <span className="zj-chip">
          <Lock size={10} /> Saldo dicadangkan
        </span>
        <span className="zj-chip muted">
          <Clock3 size={10} /> 72 jam
        </span>
      </div>
    </div>
  );
}
function WitnessMini() {
  return (
    <div className="zj-mini">
      {[
        ['DW', 'Saksi Dewi', 'Unit Penyaluran'],
        ['RN', 'Saksi Rian', 'Unit Pengawasan'],
      ].map(([i, n, u]) => (
        <div className="zj-mini-person compact" key={n}>
          <span className="zj-avatar">{i}</span>
          <div>
            <strong>{n}</strong>
            <small>{u}</small>
          </div>
          <CircleCheck size={15} className="zj-ok" />
        </div>
      ))}
      <span className="zj-chip">2/2 saksi independen</span>
    </div>
  );
}
function VerifyMini() {
  return (
    <div className="zj-mini">
      <span className="zj-code">ZK4M8Q2T7W1A</span>
      <div className="zj-mini-row">
        <small>Status</small>
        <span className="zj-chip">
          <CircleCheck size={10} /> Tersalurkan
        </span>
      </div>
      <small className="zj-hash">sha256 · 6ab1caccc3e8…</small>
    </div>
  );
}
function Tracking() {
  const [code, setCode] = useState(''),
    [data, setData] = useState<{
      kode_unik: string;
      status: string;
      nominal: string;
      stage: string;
    } | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function find(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setData(null);
    try {
      const c = code.trim().toUpperCase();
      if (!/^[A-Z0-9]{12}$/.test(c))
        throw new Error('Masukkan 12 karakter kode yang diterbitkan lembaga.');
      const r = await fetch('/api/publik/verifikasi/' + c, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      setData(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status belum dapat dimuat.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="zj-section zj-tracking" id="pelacakan">
      <div className="zj-section-copy">
        <p className="zj-eyebrow">TELUSURI SETIAP TAHAP</p>
        <h2>
          Amanah Bergerak.
          <br />
          Catatannya Mengikuti.
        </h2>
        <p>
          Periksa kode catatan yang Anda terima. Status mengikuti data lembaga, bukan perkiraan
          perjalanan atau lokasi kendaraan.
        </p>
        <form className="zj-inline-form" onSubmit={find}>
          <input
            name="kode-lacak"
            autoComplete="off"
            aria-label="Kode untuk melacak catatan"
            placeholder="Masukkan kode catatan"
            maxLength={12}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button disabled={busy}>
            {busy ? 'Memeriksa...' : 'Periksa'}
            <ArrowRight size={14} />
          </button>
        </form>
        {error && (
          <p className="zj-error" role="alert">
            {error}
          </p>
        )}
        <Link className="zj-text-link" href="/verifikasi">
          Cara memeriksa catatan <ArrowRight size={13} />
        </Link>
      </div>
      <div className="zj-tracking-visual">
        <StageRail current={data?.stage} />
        <div className="zj-track-card">
          <div className="zj-icon-badge">
            <Route size={17} />
          </div>
          <strong>{data ? data.kode_unik : 'Jejak yang terhubung'}</strong>
          <small>
            {data ? 'Status dari catatan tersimpan' : 'Ilustrasi tahapan, bukan pelacakan GPS'}
          </small>
          {data ? (
            <>
              <p className="zj-status">{data.status.replaceAll('_', ' ')}</p>
              <p>Tahap: {data.stage}</p>
              <Link href={'/verifikasi/' + data.kode_unik}>
                Lihat rincian <ArrowRight size={12} />
              </Link>
            </>
          ) : (
            <ol>
              <li>Pencatatan oleh petugas</li>
              <li>Konfirmasi independen</li>
              <li>Persetujuan dan riwayat</li>
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
export default function ReferenceHome() {
  const [wizard, setWizard] = useState<'receipt' | 'distribution' | null>(null),
    [category, setCategory] = useState('Semua'),
    [compare, setCompare] = useState(false),
    [section, setSection] = useActiveSection();
  const start = (kind: 'receipt' | 'distribution' = 'receipt') => setWizard(kind);
  return (
    <div className="zj-home">
      <SiteNavbar
        items={NAV_ITEMS}
        active={section}
        onChange={setSection}
      />
      <main>
        <Journey onStart={start} />
        <div className="zj-after">
          <section className="zj-proof" aria-label="Prinsip yang dijaga Zaky">
            {PROOF.map(({ value, label, Icon }) => (
              <article key={value}>
                <span className="zj-proof-icon">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <strong>{value}</strong>
                <p>{label}</p>
              </article>
            ))}
          </section>
          <Tracking />
          <section className="zj-section zj-service-section" id="layanan">
            <div className="zj-section-copy">
              <p className="zj-eyebrow">ALAT KERJA ZAKY</p>
              <h2>
                Satu Tempat.
                <br />
                Untuk Setiap Amanah.
              </h2>
              <p>
                Dari dana masuk sampai catatan penyaluran. Buka alat yang sesuai dengan tanggung
                jawab Anda.
              </p>
              <Link className="zj-pill" href="/pekerjaan">
                Semua catatan <ArrowRight size={12} />
              </Link>
            </div>
            <div className="zj-service-grid">
              {[
                {
                  title: 'Penerimaan',
                  desc: 'Pos dana dan alokasi hak amil.',
                  Icon: Wallet,
                  kind: 'receipt',
                  art: <ReceiptMini />,
                },
                {
                  title: 'Penyaluran',
                  desc: 'Draf, mustahik, dan berkas bukti.',
                  Icon: FileCheck2,
                  kind: 'distribution',
                  art: <DraftMini />,
                },
                {
                  title: 'Konfirmasi',
                  desc: 'Pemeriksaan saksi yang independen.',
                  Icon: Users,
                  href: '/dasbor?mode=standard',
                  art: <WitnessMini />,
                },
                {
                  title: 'Verifikasi',
                  desc: 'Periksa kode dan jejak catatan.',
                  Icon: ShieldCheck,
                  href: '/verifikasi',
                  art: <VerifyMini />,
                },
              ].map((s) => (
                <article key={s.title}>
                  <div className="zj-service-art" aria-hidden="true">
                    {s.art}
                  </div>
                  <div className="zj-service-body">
                    <span className="zj-round-icon">
                      <s.Icon size={14} />
                    </span>
                    <div>
                      <h3>{s.title}</h3>
                      <p>{s.desc}</p>
                    </div>
                    {s.kind ? (
                      <button
                        aria-label={'Buka ' + s.title}
                        onClick={() => start(s.kind as 'receipt' | 'distribution')}
                      >
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <Link aria-label={'Buka ' + s.title} href={s.href!}>
                        <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="zj-section zj-flow-section" id="cara-kerja">
            <div className="zj-section-copy">
              <p className="zj-eyebrow">ALUR AMANAH</p>
              <h2>
                Lima Langkah.
                <br />
                Tanpa Jalan Pintas.
              </h2>
              <p>
                Setiap catatan melewati tahap yang sama. Tahap berikutnya hanya terbuka bila tahap
                sebelumnya sah.
              </p>
              <Link className="zj-pill" href="/docs">
                Baca alur lengkap <ArrowRight size={12} />
              </Link>
            </div>
            <ol className="zj-flow">
              {FLOW.map(({ title, who, desc, Icon }, i) => (
                <li key={title}>
                  <span className="zj-flow-step" aria-hidden="true">
                    <Icon size={18} />
                    <b>{i + 1}</b>
                  </span>
                  <div>
                    <div className="zj-flow-head">
                      <h3>{title}</h3>
                      <span className="zj-chip muted">{who}</span>
                    </div>
                    <p>{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section className="zj-section zj-role-section" id="peran">
            <div className="zj-section-copy">
              <p className="zj-eyebrow">PERAN YANG SALING MEMERIKSA</p>
              <h2>
                Ditangani Petugas.
                <br />
                Dijaga Bersama.
              </h2>
              <p>
                Tugas berikutnya diterima peran yang berwenang. Riwayat penanganan tetap mengikuti
                catatan.
              </p>
              <Link className="zj-pill" href="/dasbor">
                Lihat tim lembaga <ArrowRight size={12} />
              </Link>
            </div>
            <div className="zj-directory">
              <div className="zj-role-filters" role="group" aria-label="Filter peran">
                {['Semua', 'Amil', 'Saksi', 'Penyetuju', 'Admin'].map((c) => (
                  <button aria-pressed={category === c} onClick={() => setCategory(c)} key={c}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="zj-role-grid">
                {roles
                  .filter((r) => category === 'Semua' || r.tag === category)
                  .slice(0, category === 'Semua' ? 3 : 5)
                  .map((r) => (
                    <article key={r.title}>
                      <div className={'zj-role-badge tone-' + r.tone} aria-hidden="true">
                        <span>
                          <r.Icon size={26} strokeWidth={1.8} />
                        </span>
                      </div>
                      <small>
                        <span /> {r.tag}
                      </small>
                      <h3>{r.title}</h3>
                      <p>{r.desc}</p>
                      <ul className="zj-rights">
                        <li>
                          <CircleCheck size={13} aria-hidden="true" />
                          <span className="sr-only">Boleh:</span> {r.can}
                        </li>
                        <li className="no">
                          <CircleX size={13} aria-hidden="true" />
                          <span className="sr-only">Tidak boleh:</span> {r.cannot}
                        </li>
                      </ul>
                      <Link href="/dasbor">
                        Buka ruang kerja <ArrowRight size={12} />
                      </Link>
                    </article>
                  ))}
              </div>
            </div>
          </section>
          <section className="zj-section zj-app-section" id="aplikasi">
            <div className="zj-section-copy">
              <p className="zj-eyebrow">RUANG KERJA ZAKY</p>
              <h2>
                Antrean dalam
                <br />
                Genggaman.
              </h2>
              <p>
                Buka tugas, lihat penanggung jawab, dan periksa catatan yang sama dari browser.
                Pilih tampilan yang nyaman untuk Anda.
              </p>
              <Link className="zj-dark zj-app-link" href="/dasbor?mode=standard">
                <Monitor size={16} /> Buka versi web <ArrowRight size={12} />
              </Link>
              <small className="zj-caption">Tidak perlu memasang aplikasi tambahan.</small>
            </div>
            <div className="zj-phone-area">
              <IPhone />
              <div className="zj-phone-note">
                <ShieldCheck size={20} />
                <strong>Satu catatan bersama</strong>
                <p>Antrean tersinkron setelah perubahan tersimpan.</p>
                <small>Tampilan asli dasbor Zaky</small>
              </div>
              <span className="zj-handnote">
                Tetap dekat,
                <br />
                tetap tercatat.
              </span>
            </div>
          </section>
          <section className="zj-section zj-mode-section" id="mode">
            <div className="zj-section-copy">
              <p className="zj-eyebrow">PILIH CARA BEKERJA</p>
              <h2>
                Alurnya Sama.
                <br />
                Caranya Fleksibel.
              </h2>
              <p>
                Tidak ada pekerjaan yang wajib diselesaikan lewat 3D. Pemeriksaan dan aturan lembaga
                tetap sama.
              </p>
              <button
                className="zj-pill"
                onClick={() => setCompare((v) => !v)}
                aria-expanded={compare}
              >
                Bandingkan tampilan <ArrowDown size={12} />
              </button>
            </div>
            <div className="zj-mode-cards">
              {[
                {
                  title: 'Standar',
                  subtitle: 'Langsung ke pekerjaan',
                  tag: 'Tanpa 3D',
                  path: '/dasbor?mode=standard',
                  items: ['Formulir langsung', 'Antrean bersama', 'Nyaman di perangkat ringan'],
                },
                {
                  title: 'Zaky Simulator',
                  subtitle: 'Bekerja sambil bermain',
                  tag: 'Kantor 3D',
                  path: '/dasbor?mode=3d',
                  items: [
                    'Lima meja, satu antrean nyata',
                    'Data realtime dari buku lembaga',
                    'Bisa dengan keyboard atau sentuhan',
                  ],
                },
                {
                  title: 'Verifikasi',
                  subtitle: 'Periksa kode catatan',
                  tag: 'Akses publik',
                  path: '/verifikasi',
                  items: ['Kode dari lembaga', 'Status yang tercatat', 'Tanpa kewenangan mengubah'],
                },
              ].map((m, i) => (
                <article key={m.title} className={i === 1 ? 'featured' : ''}>
                  <small>{m.tag}</small>
                  <h3>{m.title}</h3>
                  <p>{m.subtitle}</p>
                  <ul>
                    {m.items.map((item) => (
                      <li key={item}>
                        <Check size={12} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link href={m.path}>
                    Buka {m.title}
                    <ArrowRight size={12} />
                  </Link>
                </article>
              ))}
            </div>
            {compare && (
              <div className="zj-comparison">
                <table>
                  <caption>Perbandingan cara kerja</caption>
                  <thead>
                    <tr>
                      <th>Fungsi</th>
                      <th>Standar</th>
                      <th>Simulator</th>
                      <th>Verifikasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Catatan lembaga', 'Ya', 'Ya, realtime', 'Ringkasan publik'],
                      ['Mencatat transaksi', 'Sesuai peran', 'Sesuai peran', 'Tidak'],
                      ['Grafis WebGL', 'Tidak perlu', 'Diperlukan', 'Tidak perlu'],
                      ['Pemeriksaan server', 'Ya', 'Ya', 'Baca saja'],
                    ].map((row) => (
                      <tr key={row[0]}>
                        {row.map((v, i) => (i ? <td key={i}>{v}</td> : <th key={i}>{v}</th>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <section className="zj-section zj-trust-section">
            <div className="zj-section-copy">
              <p className="zj-eyebrow">KEPERCAYAAN DARI PROSES</p>
              <h2>
                Bukan Sekadar
                <br />
                Tanda Selesai.
              </h2>
              <p>Setiap pernyataan di aplikasi harus mengikuti hasil yang benar-benar tersimpan.</p>
            </div>
            <div className="zj-trust-grid">
              {[
                {
                  title: 'Petugas yang berbeda.',
                  desc: 'Pembuat, saksi, dan penyetuju mengikuti aturan pemisahan kewenangan.',
                  Icon: Users,
                  art: (
                    <div className="zj-trust-people">
                      {['AB', 'DW', 'RN', 'HR'].map((i) => (
                        <span className="zj-avatar" key={i}>
                          {i}
                        </span>
                      ))}
                    </div>
                  ),
                },
                {
                  title: 'Bukti tetap terhubung.',
                  desc: 'Berkas dan jejak audit mengacu pada catatan sumber.',
                  Icon: LockKeyhole,
                  art: (
                    <div className="zj-chain">
                      {['#166', '#167', '#168'].map((n) => (
                        <span key={n}>
                          <b>{n}</b>
                          <i>prev <Check size={10} aria-hidden="true" /></i>
                        </span>
                      ))}
                    </div>
                  ),
                },
                {
                  title: 'Penolakan tetap terlihat.',
                  desc: 'Tidak disamarkan menjadi proses berhasil atau dana tersalurkan.',
                  Icon: FileCheck2,
                  art: (
                    <div className="zj-chip-row">
                      <span className="zj-chip danger">
                        <CircleX size={10} /> Dikembalikan
                      </span>
                      <span className="zj-chip muted">Alasan tercatat</span>
                    </div>
                  ),
                },
              ].map((c) => (
                <article key={c.title}>
                  <div className="zj-trust-art" aria-hidden="true">
                    {c.art}
                  </div>
                  <c.Icon size={20} />
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                  <Link href="/docs">
                    Pelajari alurnya <ExternalLink size={11} />
                  </Link>
                </article>
              ))}
            </div>
          </section>
          <section className="zj-final">
            <div>
              <p className="zj-eyebrow">MULAI DARI SATU CATATAN</p>
              <h2>
                Amanah Hari Ini.
                <br />
                Terjaga Sampai Akhir.
              </h2>
              <p>Masuk ke ruang kerja, pilih tugas, dan lanjutkan bersama tim lembaga Anda.</p>
              <button className="zj-sun" onClick={() => start()}>
                Mulai mencatat <ArrowRight size={14} />
              </button>
              <Link href="/dasbor?mode=3d">
                Main Zaky Simulator <ArrowRight size={12} />
              </Link>
            </div>
            <FinalArt />
          </section>
          <FAQs
            eyebrow="PERTANYAAN UMUM"
            title="Masih Ada Pertanyaan?"
            description="Jawaban singkat tentang cara Zaky mencatat dan memeriksa amanah."
            items={FAQ_ITEMS}
            help={{
              text: 'Belum menemukan jawabannya? Baca',
              label: 'dokumentasi alur kerja',
              href: '/docs',
            }}
          />
        </div>
      </main>
      <SiteFooter />
      {wizard && <WorkWizard initial={wizard} onClose={() => setWizard(null)} />}
    </div>
  );
}
