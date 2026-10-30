'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  BookOpen,
  Check,
  CircleDashed,
  FileSearch,
  KeyRound,
  Network,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import SiteNavbar from '@/components/site/site-navbar';
import SiteFooter from '@/components/site/site-footer';
import type { PapanSilang, StatusPapan } from '@/lib/jaringan/papan';
import '@/components/site/site.css';
import './silang.css';

type Papan = PapanSilang & { pilihanTanggal: string[] };

const STATUS: Record<StatusPapan, { label: string; short: string; icon: LucideIcon }> = {
  terkonfirmasi: { label: 'Terkonfirmasi · 2 saksi', short: 'Cocok', icon: ShieldCheck },
  belum_cukup_saksi: { label: 'Belum cukup saksi', short: 'Kurang saksi', icon: Users },
  tidak_cocok: { label: 'Tidak cocok · terdeteksi perubahan', short: 'Tidak cocok', icon: ShieldAlert },
  belum_diterbitkan: { label: 'Belum diterbitkan', short: 'Belum terbit', icon: CircleDashed },
};

const short = (hash: string) => (hash.length > 20 ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : hash);
const tglLabel = (t: string) =>
  new Date(t + 'T12:00:00+07:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const jamWib = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }) + ' WIB';

/** Node status on the network figure: the publisher's verdict, or whether a witness signed a match. */
function nodeStatus(papan: Papan, kode: 'A' | 'B' | 'C'): StatusPapan {
  if (kode === 'A') return papan.status;
  const s = papan.saksi.find((x) => x.kode === kode);
  if (!s) return 'belum_diterbitkan';
  return s.tandaTanganValid && s.cocok ? 'terkonfirmasi' : 'tidak_cocok';
}

export default function PapanSilangPage() {
  const [tanggal, setTanggal] = useState<string | null>(null);
  const [simulasi, setSimulasi] = useState(false);
  const [papan, setPapan] = useState<Papan | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const c = new AbortController();
    const q = new URLSearchParams();
    if (tanggal) q.set('tanggal', tanggal);
    if (simulasi) q.set('simulasi', '1');
    queueMicrotask(() => setLoading(true));
    fetch('/api/publik/papan-silang?' + q, { cache: 'no-store', signal: c.signal })
      .then(async (r) => {
        const text = await r.text();
        let body: (Papan & { error?: string }) | null = null;
        try {
          body = JSON.parse(text);
        } catch {
          throw new Error("Gagal memuat data: Basis data Supabase belum terhubung di server (Periksa DATABASE_URL di Vercel).");
        }
        if (!body) throw new Error("Respons server kosong.");
        if (!r.ok) throw new Error(body.error ?? "Papan silang belum bisa dimuat.");
        setPapan(body);
        setError('');
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e instanceof Error ? e.message : 'Papan silang belum bisa dimuat.');
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [tanggal, simulasi]);

  useEffect(() => {
    if (detail && !dialog.current?.open) dialog.current?.showModal();
  }, [detail]);

  const dates = papan?.pilihanTanggal.slice(0, 3) ?? [];
  const selected = papan?.tanggal ?? tanggal ?? '';
  const sah = papan ? papan.saksi.filter((s) => s.tandaTanganValid && s.cocok).length : 0;
  const alert = papan?.status === 'tidak_cocok';

  return (
    <div className="zs-page zx">
      <SiteNavbar />
      <main className="zs-main zx-main">
        {/* Hero: claim + live network */}
        <section className="zx-hero">
          <div>
            <span className="zs-eyebrow">
              <Network size={14} aria-hidden="true" /> Papan silang
            </span>
            <h1 className="zs-title">
              Saling menyaksikan. <em>Antarlembaga.</em>
            </h1>
            <p className="zs-lead">
              Lembaga A menutup buku setiap hari dan menandatangani hash kepala rantai auditnya.
              Lembaga B dan C menghitung ulang rantai itu secara mandiri, lalu menandatangani
              kesaksian bila hasilnya sama.
            </p>
            <div className="zx-controls">
              <div className="zx-segment" role="radiogroup" aria-label="Tanggal hash harian">
                {dates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={selected === d}
                    onClick={() => setTanggal(d)}
                  >
                    {tglLabel(d)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={simulasi}
                className="zx-switch"
                onClick={() => setSimulasi((v) => !v)}
              >
                <span className="zx-switch-track" aria-hidden="true">
                  <span />
                </span>
                Simulasikan perubahan log
              </button>
            </div>
          </div>

          <figure className={'zx-net' + (alert ? ' is-alert' : '')} aria-busy={loading}>
            <svg viewBox="0 0 400 340" role="img" aria-label={`Lembaga A disaksikan ${sah} dari 2 lembaga.`}>
              <line className={'zx-edge' + (alert ? ' bad' : papan && nodeStatus(papan, 'B') !== 'terkonfirmasi' ? ' idle' : '')} x1="110" y1="90" x2="300" y2="120" />
              <line className={'zx-edge' + (alert ? ' bad' : papan && nodeStatus(papan, 'C') !== 'terkonfirmasi' ? ' idle' : '')} x1="110" y1="90" x2="170" y2="270" />
              <line className="zx-edge idle" x1="300" y1="120" x2="170" y2="270" />
            </svg>
            {papan &&
              (
                [
                  ['A', 27.5, 26.5],
                  ['B', 75, 35.3],
                  ['C', 42.5, 79.4],
                ] as const
              ).map(([kode, x, y]) => {
                const st = nodeStatus(papan, kode);
                return (
                  <div key={kode} className={'zx-node ' + st} style={{ left: x + '%', top: y + '%' }}>
                    <b>LZ-{kode}</b>
                    <small>{kode === 'A' ? STATUS[st].short : st === 'terkonfirmasi' ? 'Bersaksi' : st === 'tidak_cocok' ? 'Berbeda' : 'Belum'}</small>
                  </div>
                );
              })}
            <figcaption>
              <span className="zx-dot ok" /> Cocok <span className="zx-dot bad" /> Tidak cocok{' '}
              <span className="zx-dot idle" /> Belum terbit
            </figcaption>
          </figure>
        </section>

        {error && (
          <p className="zs-alert zs-alert-error" role="alert">
            {error}
          </p>
        )}

        {/* Summary */}
        <section className="zx-stats" aria-label="Ringkasan">
          <div>
            <strong>
              {sah}
              <small>/2</small>
            </strong>
            <span>kesaksian bertanda tangan sah</span>
          </div>
          <div>
            <strong>{papan?.terbit?.jumlahEntri ?? '—'}</strong>
            <span>entri log ditutup hari itu</span>
          </div>
          <div>
            <strong>{papan ? STATUS[papan.status].short : '—'}</strong>
            <span>status Lembaga A</span>
          </div>
          <div>
            <strong className="zx-date">{selected ? tglLabel(selected) : '—'}</strong>
            <span>tanggal hash harian</span>
          </div>
        </section>

        {alert && papan?.terbit && papan.hitungUlang && (
          <section className="zx-alert" role="alert">
            <ShieldAlert size={22} aria-hidden="true" />
            <div>
              <h2>Ketidakcocokan terdeteksi pada Lembaga A</h2>
              <p>
                {papan.hitungUlang.diubahNomor
                  ? `Simulasi mengubah entri #${papan.hitungUlang.diubahNomor} (di memori, tabel tidak disentuh). `
                  : ''}
                Hitung ulang log 1–{papan.hitungUlang.jumlah} menghasilkan hash yang berbeda dari hash
                harian yang sudah disaksikan Lembaga B dan C
                {papan.hitungUlang.rusakDi ? `, mulai dari entri #${papan.hitungUlang.rusakDi}` : ''}.
              </p>
              <dl>
                <div>
                  <dt>Diterbitkan &amp; disaksikan</dt>
                  <dd className="ok">{short(papan.terbit.hashKepala)}</dd>
                </div>
                <div>
                  <dt>Hitung ulang sekarang</dt>
                  <dd className="bad">{short(papan.hitungUlang.hash)}</dd>
                </div>
              </dl>
            </div>
          </section>
        )}

        {/* Board */}
        <section className="zx-board" aria-labelledby="zx-board-title" aria-busy={loading}>
          <header>
            <h2 id="zx-board-title">Hash harian &amp; kesaksian</h2>
            <p>
              Dibaca langsung dari tabel <code>hash_harian</code> dan <code>kesaksian</code>, diverifikasi
              ulang dengan kunci publik di direktori anggota.
            </p>
          </header>
          {papan && (
            <div className="zx-cards">
              <article className={'zx-card ' + papan.status}>
                <header>
                  <span className="zx-avatar">A</span>
                  <div>
                    <h3>{papan.anggota[0].nama}</h3>
                    <small>
                      Penerbit ·{' '}
                      {papan.terbit
                        ? `${papan.terbit.jumlahEntri} entri · ${jamWib(papan.terbit.diterbitkanPada)}`
                        : 'belum tutup buku'}
                    </small>
                  </div>
                </header>
                <StatusChip status={papan.status} />
                {papan.terbit && papan.hitungUlang ? (
                  <>
                    <dl className="zx-hashes">
                      <div>
                        <dt>Diterbitkan</dt>
                        <dd>{short(papan.terbit.hashKepala)}</dd>
                      </div>
                      <div>
                        <dt>Hitung ulang</dt>
                        <dd className={papan.hitungUlang.hash === papan.terbit.hashKepala ? 'ok' : 'bad'}>
                          {papan.hitungUlang.hash === papan.terbit.hashKepala ? (
                            <Check size={13} aria-hidden="true" />
                          ) : (
                            <X size={13} aria-hidden="true" />
                          )}
                          {short(papan.hitungUlang.hash)}
                        </dd>
                      </div>
                    </dl>
                    <button type="button" className="zs-btn zs-btn-ghost zs-btn-sm" onClick={() => setDetail(true)}>
                      <FileSearch size={15} aria-hidden="true" /> Lihat bukti
                    </button>
                  </>
                ) : (
                  <p className="zx-empty">Belum ada hash harian untuk tanggal ini.</p>
                )}
              </article>

              {(['B', 'C'] as const).map((kode) => {
                const info = papan.anggota.find((a) => a.kode === kode)!,
                  s = papan.saksi.find((x) => x.kode === kode),
                  st = nodeStatus(papan, kode);
                return (
                  <article key={kode} className={'zx-card ' + st}>
                    <header>
                      <span className="zx-avatar">{kode}</span>
                      <div>
                        <h3>{info.nama}</h3>
                        <small>Saksi · {info.kota}</small>
                      </div>
                    </header>
                    {s ? (
                      <>
                        <span className={'zx-status ' + st}>
                          {s.cocok && s.tandaTanganValid ? (
                            <BadgeCheck size={15} aria-hidden="true" />
                          ) : (
                            <ShieldAlert size={15} aria-hidden="true" />
                          )}
                          {s.tandaTanganValid ? 'Tanda tangan valid' : 'Tanda tangan tidak valid'}
                          {s.cocok ? '' : ' · rantai sekarang berbeda'}
                        </span>
                        <dl className="zx-hashes">
                          <div>
                            <dt>Hash disaksikan</dt>
                            <dd className={s.cocok ? 'ok' : 'bad'}>{short(s.hashDisaksikan)}</dd>
                          </div>
                          <div>
                            <dt>Diamati</dt>
                            <dd>{jamWib(s.diamatiPada)}</dd>
                          </div>
                        </dl>
                      </>
                    ) : (
                      <p className="zx-empty">Belum ada kesaksian untuk tanggal ini.</p>
                    )}
                    <small className="zx-key-id">
                      <KeyRound size={13} aria-hidden="true" /> Kunci publik {short(info.kunciPublik)}
                    </small>
                  </article>
                );
              })}
            </div>
          )}
          {papan?.kunciDemo && (
            <p className="zx-demo-note">
              Instance demo: kunci Ed25519 diturunkan dari seed terbuka. Produksi memakai kunci
              masing-masing lembaga (ZAKY_ED25519_SEED_A/B/C).
            </p>
          )}
          {loading && (
            <p className="zx-loading" role="status">
              <RefreshCw size={14} aria-hidden="true" /> Menghitung ulang rantai...
            </p>
          )}
        </section>

        {/* How it works */}
        <section className="zx-how" aria-labelledby="zx-how-title">
          <h2 id="zx-how-title">Cara kerja papan silang</h2>
          <ol>
            <li>
              <span className="zx-key">1</span>
              <h3>Hash harian ditandatangani</h3>
              <p>
                Pukul 00.00 WIB Lembaga A menyusun hash kepala log audit (JCS, RFC 8785) dan
                menandatanganinya dengan kunci Ed25519.
              </p>
            </li>
            <li>
              <span className="zx-key">2</span>
              <h3>Lembaga lain bersaksi</h3>
              <p>
                Lembaga B dan C memeriksa tanda tangan itu, menghitung ulang rantai, lalu menandatangani
                kesaksian hanya jika hasilnya sama.
              </p>
            </li>
            <li>
              <span className="zx-key">3</span>
              <h3>Dihitung ulang setiap dibuka</h3>
              <p>
                Papan ini menghitung ulang hash dari transaksi. Jika baris basis data diubah paksa,
                hasilnya tidak lagi sama dengan yang disaksikan.
              </p>
            </li>
          </ol>
          <div className="zx-how-cta">
            <Link href="/verifikasi" className="zs-btn zs-btn-green">
              <Search size={17} aria-hidden="true" /> Cek kode catatan
            </Link>
            <Link href="/docs#papan-silang" className="zs-btn zs-btn-ghost">
              <BookOpen size={17} aria-hidden="true" /> Detail teknis
            </Link>
          </div>
        </section>
      </main>

      <dialog
        ref={dialog}
        className="zx-dialog"
        aria-labelledby="zx-dialog-title"
        onClose={() => setDetail(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        {detail && papan?.terbit && papan.hitungUlang && (
          <div className="zx-dialog-body">
            <header>
              <div>
                <h2 id="zx-dialog-title">{papan.anggota[0].nama}</h2>
                <p>Bukti kriptografis &amp; salinan kesaksian · {tglLabel(papan.tanggal)}</p>
              </div>
              <button type="button" className="zx-close" aria-label="Tutup" onClick={() => dialog.current?.close()}>
                <X size={20} />
              </button>
            </header>
            <h3>Hash kepala yang diterbitkan (Ed25519 {papan.terbit.tandaTanganValid ? 'valid' : 'TIDAK valid'})</h3>
            <code className="zs-code">{papan.terbit.hashKepala}</code>
            <h3>Hasil hitung ulang log 1–{papan.hitungUlang.jumlah} (SHA-256)</h3>
            <code className={'zs-code' + (papan.hitungUlang.hash === papan.terbit.hashKepala ? '' : ' zx-code-bad')}>
              {papan.hitungUlang.hash}
            </code>
            <h3>Salinan kesaksian disimpan oleh</h3>
            <ul className="zx-dialog-witness">
              {papan.saksi.map((s) => (
                <li key={s.kode}>
                  <div>
                    <b>{s.nama}</b>
                    <small>Diamati {jamWib(s.diamatiPada)}</small>
                  </div>
                  <span>
                    <BadgeCheck size={16} aria-hidden="true" />{' '}
                    {s.tandaTanganValid ? 'Tanda tangan valid' : 'Tanda tangan tidak valid'}
                  </span>
                </li>
              ))}
            </ul>
            <p className="zx-dialog-api">
              Data mentah: <code>/api/publik/hash-harian/LEMBAGA_A/{papan.tanggal}</code>
            </p>
            <div className="zx-dialog-foot">
              <button type="button" className="zs-btn zs-btn-sm" onClick={() => dialog.current?.close()}>
                Tutup
              </button>
            </div>
          </div>
        )}
      </dialog>
      <SiteFooter />
    </div>
  );
}

function StatusChip({ status }: { status: StatusPapan }) {
  const st = STATUS[status],
    Icon = st.icon;
  return (
    <span className={'zx-status ' + status}>
      <Icon size={15} aria-hidden="true" />
      {st.label}
    </span>
  );
}
