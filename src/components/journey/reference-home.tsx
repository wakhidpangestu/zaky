'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Menu,
  X,
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
} from 'lucide-react';
import type { SessionPayload } from '@/lib/auth';
import Journey from './journey';
import WorkWizard from '@/components/workflow/work-wizard';
import HalftoneWordmarkFooter, { type FooterColumn } from '@/components/ui/halftone-wordmark-footer';
import './reference.css';
// Emerald Sun: dark green ground (--sidebar), cream dots (--background) that warm to sun yellow
// (--secondary). The canvas needs literal hex colours, not CSS variables.
const FOOTER_PALETTE = { background: '#15281f', ink: '#fbfbf8', warm: '#facc14' };
const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Layanan',
    links: [
      { label: 'Pelacakan', href: '#pelacakan' },
      { label: 'Alat kerja', href: '#layanan' },
      { label: 'Peran', href: '#peran' },
      { label: 'Cara kerja', href: '#cara-kerja' },
    ],
  },
  {
    title: 'Ruang kerja',
    links: [
      { label: 'Masuk', href: '/login' },
      { label: 'Dasbor', href: '/dasbor' },
      { label: 'Zaky Simulator', href: '/dasbor?mode=3d' },
      { label: 'Profil', href: '/profil' },
    ],
  },
  {
    title: 'Keterbukaan',
    links: [
      { label: 'Verifikasi kode', href: '/verifikasi' },
      { label: 'Papan silang', href: '/silang' },
      { label: 'Dokumentasi', href: '/docs' },
    ],
  },
];
const roles = [
  {
    title: 'Amil penerimaan',
    tag: 'Amil',
    desc: 'Mencatat dana masuk dan memisahkan alokasi hak amil.',
    initial: 'A',
    color: 'var(--secondary)',
  },
  {
    title: 'Amil penyaluran',
    tag: 'Amil',
    desc: 'Menyiapkan draf, mustahik terdaftar, dan berkas bukti.',
    initial: 'P',
    color: 'var(--accent)',
  },
  {
    title: 'Saksi independen',
    tag: 'Saksi',
    desc: 'Kapabilitas amil dari unit berbeda untuk memeriksa penyerahan.',
    initial: 'S',
    color: 'var(--muted)',
  },
  {
    title: 'Penyetuju',
    tag: 'Penyetuju',
    desc: 'Memeriksa konfirmasi sebelum mengesahkan penyaluran.',
    initial: 'K',
    color: 'var(--border)',
  },
  {
    title: 'Admin lembaga',
    tag: 'Admin',
    desc: 'Mengelola pengaturan sesuai kewenangan lembaga.',
    initial: 'L',
    color: 'var(--accent)',
  },
];
function RouteArt({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={'zj-route-art' + (small ? ' small' : '')}
      viewBox="0 0 600 340"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={small ? 'route-grid-small' : 'route-grid'}
          width="58"
          height="58"
          patternTransform="skewY(-18)"
          patternUnits="userSpaceOnUse"
        >
          <path d="M0 1h58M1 0v58" fill="none" stroke="#e0ebe6" strokeWidth="1" />
        </pattern>
      </defs>
      <path
        fill={'url(#' + (small ? 'route-grid-small' : 'route-grid') + ')'}
        d="M20 40h560v260H20z"
      />
      <path
        d="M40 255C160 255 130 120 260 120S330 270 450 210 480 70 565 90"
        fill="none"
        stroke="#e0ebe6"
        strokeWidth="42"
      />
      <path
        d="M40 255C160 255 130 120 260 120S330 270 450 210 480 70 565 90"
        fill="none"
        stroke="#16a249"
        strokeWidth="5"
      />
      {[
        [100, 80],
        [250, 210],
        [420, 60],
        [500, 240],
      ].map(([x, y], i) => (
        <g transform={`translate(${x} ${y})`} key={x}>
          <path d="M-30-10 0-28 34-10 5 8Z" fill="#dcf9e7" />
          <path d="m-30-10 35 18v42l-35-18Z" fill="#e0ebe6" />
          <path d="M5 8 34-10v42L5 50Z" fill="#e0ebe6" />
          <path d="M-17 0v10M-4 8v10M-17 20v10" stroke="#5c7066" strokeWidth="5" />
          {i === 1 && <path d="m5 8 29-18v14L5 22Z" fill="#facc14" />}
        </g>
      ))}
      {[
        [48, 160],
        [206, 58],
        [360, 270],
        [560, 165],
      ].map(([x, y]) => (
        <g transform={`translate(${x} ${y})`} key={x}>
          <path d="M0 10v25" stroke="#5c7066" strokeWidth="4" />
          <circle cy="5" r="17" fill="#16a249" />
          <circle cx="10" cy="-2" r="11" fill="#12873d" />
        </g>
      ))}
      <circle cx="260" cy="120" r="12" fill="#15281f" />
      <circle cx="260" cy="120" r="4" fill="#ffffff" />
    </svg>
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
        <RouteArt />
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
export default function ReferenceHome({ session }: { session: SessionPayload | null }) {
  const [wizard, setWizard] = useState<'receipt' | 'distribution' | null>(null),
    [menu, setMenu] = useState(false),
    [category, setCategory] = useState('Semua'),
    [compare, setCompare] = useState(false);
  const start = (kind: 'receipt' | 'distribution' = 'receipt') => setWizard(kind);
  return (
    <div className="zj-home">
      <header className="zj-nav">
        <Link className="zj-brand" href="/">
          zaky<span>.</span>
        </Link>
        <nav aria-label="Menu utama" className={menu ? 'open' : ''}>
          <a href="#pelacakan" onClick={() => setMenu(false)}>
            Pelacakan
          </a>
          <a href="#layanan" onClick={() => setMenu(false)}>
            Layanan
          </a>
          <a href="#peran" onClick={() => setMenu(false)}>
            Peran
          </a>
          <a href="#aplikasi" onClick={() => setMenu(false)}>
            Aplikasi
          </a>
          <a href="#cara-kerja" onClick={() => setMenu(false)}>
            Cara kerja
          </a>
        </nav>
        <div className="zj-nav-actions">
          <Link href={session ? '/dasbor' : '/login'}>{session ? 'Ruang kerja' : 'Masuk'}</Link>
          <button className="zj-dark" onClick={() => start()}>
            Mulai mencatat <ArrowRight size={12} />
          </button>
          <button
            className="zj-mobile-menu"
            aria-label={menu ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menu}
            onClick={() => setMenu((v) => !v)}
          >
            {menu ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>
      <main>
        <Journey onStart={start} />
        <div className="zj-after">
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
                },
                {
                  title: 'Penyaluran',
                  desc: 'Draf, mustahik, dan berkas bukti.',
                  Icon: FileCheck2,
                  kind: 'distribution',
                },
                {
                  title: 'Konfirmasi',
                  desc: 'Pemeriksaan saksi yang independen.',
                  Icon: Users,
                  href: '/dasbor?mode=standard',
                },
                {
                  title: 'Verifikasi',
                  desc: 'Periksa kode dan jejak catatan.',
                  Icon: ShieldCheck,
                  href: '/verifikasi',
                },
              ].map((s, i) => (
                <article key={s.title}>
                  <div className={'zj-service-art art-' + i}>
                    <s.Icon size={48} strokeWidth={1.2} />
                    <span />
                  </div>
                  <div className="zj-round-icon">
                    <s.Icon size={13} />
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
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
                </article>
              ))}
            </div>
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
                      <div className="zj-person-art" style={{ background: r.color }}>
                        <div className="zj-person-head" />
                        <div className="zj-person-body" />
                        <span>Ilustrasi peran</span>
                      </div>
                      <small>
                        <span /> {r.tag}
                      </small>
                      <h3>{r.title}</h3>
                      <p>{r.desc}</p>
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
              <div className="zj-phone">
                <header>
                  <span>09.41</span>
                  <span>● ▰</span>
                </header>
                <div className="zj-brand">
                  zaky<span>.</span>
                </div>
                <small>RUANG KERJA ANDA</small>
                <div className="zj-phone-card">
                  <small>Antrean bersama</small>
                  <strong>Tugas Hari Ini.</strong>
                  <span>Periksa sebelum melanjutkan.</span>
                </div>
                {[
                  ['Penerimaan', 'Catat dana masuk'],
                  ['Penyaluran', 'Periksa kelengkapan'],
                  ['Konfirmasi', 'Tinjau bukti penyerahan'],
                ].map(([a, b]) => (
                  <div className="zj-phone-row" key={a}>
                    <span>
                      <Check size={12} />
                    </span>
                    <div>
                      <strong>{a}</strong>
                      <small>{b}</small>
                    </div>
                  </div>
                ))}
                <footer>Standar　　Simulator　　Tim</footer>
              </div>
              <div className="zj-phone-note">
                <ShieldCheck size={20} />
                <strong>Satu catatan bersama</strong>
                <p>Antrean tersinkron setelah perubahan tersimpan.</p>
                <small>Ilustrasi tampilan</small>
              </div>
              <span className="zj-handnote">
                Tetap dekat,
                <br />
                tetap tercatat.
              </span>
            </div>
          </section>
          <section className="zj-section zj-mode-section" id="cara-kerja">
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
                  subtitle: 'Latihan jadi amil',
                  tag: 'Game latihan',
                  path: '/dasbor?mode=3d',
                  items: [
                    'Jaga lima meja dalam satu shift',
                    'Data simulasi, aman dicoba',
                    'Skor amanah di setiap keputusan',
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
                      ['Catatan lembaga', 'Ya', 'Tidak, data latihan', 'Ringkasan publik'],
                      ['Mencatat transaksi', 'Sesuai peran', 'Simulasi saja', 'Tidak'],
                      ['Grafis WebGL', 'Tidak perlu', 'Diperlukan', 'Tidak perlu'],
                      ['Pemeriksaan server', 'Ya', 'Tidak, di browser', 'Baca saja'],
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
                },
                {
                  title: 'Bukti tetap terhubung.',
                  desc: 'Berkas dan jejak audit mengacu pada catatan sumber.',
                  Icon: LockKeyhole,
                },
                {
                  title: 'Penolakan tetap terlihat.',
                  desc: 'Tidak disamarkan menjadi proses berhasil atau dana tersalurkan.',
                  Icon: FileCheck2,
                },
              ].map((c) => (
                <article key={c.title}>
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
            <RouteArt small />
          </section>
          <section className="zj-faq">
            <details>
              <summary>Apakah Zaky Simulator memakai data asli?</summary>
              <p>
                Tidak. Nama dan nominal di simulator dibuat oleh game di browser dan tidak mengubah
                catatan lembaga. Pekerjaan nyata dilakukan di mode Standar.
              </p>
            </details>
            <details>
              <summary>Apakah Zaky memindahkan uang otomatis?</summary>
              <p>
                Tidak. Pencatatan, reservasi, konfirmasi dan persetujuan mengikuti aturan lembaga.
                Tidak ada klaim pembayaran bank berhasil hanya dari sebuah tombol.
              </p>
            </details>
            <details>
              <summary>Mengapa data belum tersedia setelah masuk?</summary>
              <p>
                Pengelola perlu mengaktifkan layanan dan migrasi database lembaga. Aplikasi tidak
                mengganti data yang belum tersedia dengan transaksi palsu.
              </p>
            </details>
          </section>
        </div>
      </main>
      <HalftoneWordmarkFooter
        wordmark="zaky"
        label="Zaky · Catat amanah, saling menjaga"
        meta="© 2026 · Ilustrasi menjelaskan proses; aktivitas nyata mengikuti data lembaga"
        columns={FOOTER_COLUMNS}
        backToTopLabel="Kembali ke atas ↑"
        palette={FOOTER_PALETTE}
        fontFamily='"Outfit", system-ui, sans-serif'
        monoFamily='"JetBrains Mono", ui-monospace, monospace'
        height="clamp(440px, 46vw, 600px)"
      />
      {wizard && <WorkWizard initial={wizard} onClose={() => setWizard(null)} />}
    </div>
  );
}
