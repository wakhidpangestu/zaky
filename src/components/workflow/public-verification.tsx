'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  EyeOff,
  FileSearch,
  Fingerprint,
  Layers,
  Printer,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { formatMoney } from '@/lib/office/operations';
import { STATUS_LABELS } from '@/lib/office/model';
import '@/components/site/site.css';
import './verification.css';

const CODE = /^(ZK|RC)[A-Z0-9]{10}$/;
// A receipt is recorded and closed; only distributions pass witnesses and approval.
const STAGES = {
  ZK: ['Penyaluran', 'Konfirmasi', 'Persetujuan', 'Catatan'],
  RC: ['Penerimaan', 'Catatan'],
};
const stageKey: Record<string, string> = {
  penerimaan: 'Penerimaan',
  penyaluran: 'Penyaluran',
  saksi: 'Konfirmasi',
  persetujuan: 'Persetujuan',
  catatan: 'Catatan',
};
const statusLabel = (s: string) => (s === 'recorded' ? 'Tercatat' : (STATUS_LABELS[s] ?? s.replaceAll('_', ' ')));

/** What a partly typed code already tells us. */
function kindOf(code: string) {
  if (code.startsWith('ZK')) return 'Catatan penyaluran';
  if (code.startsWith('RC')) return 'Catatan penerimaan';
  return null;
}

export default function PublicVerification({ code = '' }: { code?: string }) {
  const router = useRouter(),
    [value, setValue] = useState(code),
    [data, setData] = useState<{
      kode_unik: string;
      status: string;
      nominal: string;
      pos_dana: string;
      hash_transaksi: string | null;
      stage: string;
    } | null>(null),
    [error, setError] = useState(''),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!code) return;
    const c = new AbortController();
    void fetch('/api/publik/verifikasi/' + encodeURIComponent(code), {
      cache: 'no-store',
      signal: c.signal,
    })
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw new Error(b.error);
        if (!c.signal.aborted) setData(b);
      })
      .catch((e) => {
        if (!c.signal.aborted)
          setError(e instanceof Error ? e.message : 'Verifikasi belum tersedia.');
      });
    return () => c.abort();
  }, [code]);
  const loading = !!code && !data && !error;
  const kind = kindOf(value);
  const steps = data ? STAGES[data.kode_unik.startsWith('RC') ? 'RC' : 'ZK'] : [];
  const stage = data ? steps.indexOf(stageKey[data.stage] ?? '') : -1;
  // A finished record has every step done.
  const done = data ? ['recorded', 'tersalurkan'].includes(data.status) : false;
  return (
    <div className="zv">
      <section className="zv-hero">
        <div className="zv-intro">
          <span className="zs-eyebrow">
            <ShieldCheck size={14} aria-hidden="true" /> Verifikasi publik
          </span>
          <h1 className="zs-title">
            Periksa catatan. <em>Tanpa membuka data pribadi.</em>
          </h1>
          <p className="zs-lead">
            Masukkan kode dari bukti lembaga untuk melihat status, nominal, dan jejak audit sebuah
            catatan zakat.
          </p>

          <form
            className="zv-console"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const clean = value.trim().toUpperCase();
              if (!CODE.test(clean)) {
                setError(
                  clean.length < 12
                    ? `Kode kurang ${12 - clean.length} karakter. Kode lengkap terdiri dari 12 karakter.`
                    : 'Kode diawali ZK (penyaluran) atau RC (penerimaan).',
                );
                return;
              }
              setError('');
              router.push('/verifikasi/' + clean);
            }}
          >
            <label htmlFor="zv-code" className="zv-label">
              Kode catatan
              <span className={'zv-kind' + (kind ? ' is-on' : '')} aria-live="polite">
                {kind ?? 'ZK atau RC'}
              </span>
            </label>
            <div className="zv-field">
              <input
                id="zv-code"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12));
                  setError('');
                }}
                maxLength={12}
                placeholder="ZK4M8Q2T7W1A"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-invalid={!!error}
                aria-describedby={error ? 'zv-error' : 'zv-help'}
              />
              <button className="zs-btn zs-btn-green">
                Periksa <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="zv-ticks" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} className={i < value.length ? 'on' : ''} />
              ))}
            </div>
            {error ? (
              <p id="zv-error" role="alert" className="zv-error">
                <TriangleAlert size={16} aria-hidden="true" />
                {error}
              </p>
            ) : (
              <p id="zv-help" className="zv-help">
                {value.length}/12 karakter · huruf dan angka saja
              </p>
            )}
          </form>
        </div>

        {/* Where the code lives: a sample receipt */}
        <figure className="zv-receipt" aria-label="Contoh letak kode pada bukti lembaga">
          <div className="zv-paper">
            <header>
              <b>Lembaga Zakat A</b>
              <small>Bukti penyaluran</small>
            </header>
            <dl>
              <div>
                <dt>Tanggal</dt>
                <dd>27 Okt 2026</dd>
              </div>
              <div>
                <dt>Penerima</dt>
                <dd>A.**** · Miskin</dd>
              </div>
              <div>
                <dt>Nominal</dt>
                <dd>Rp 750.000</dd>
              </div>
            </dl>
            <div className="zv-paper-code">
              <small>Kode catatan</small>
              <strong>ZK4M8Q2T7W1A</strong>
            </div>
            <div className="zv-barcode" />
            {/* Ink stamp that lands on the sample receipt. */}
            <div className="zv-stamp" aria-hidden="true">
              <svg viewBox="0 0 120 120">
                <defs>
                  <path id="zv-stamp-ring" d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" />
                  <filter id="zv-ink" x="-10%" y="-10%" width="120%" height="120%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" />
                  </filter>
                </defs>
                <g filter="url(#zv-ink)" fill="currentColor" stroke="currentColor">
                  <circle cx="60" cy="60" r="56" fill="none" strokeWidth="3.5" />
                  <circle cx="60" cy="60" r="35" fill="none" strokeWidth="1.6" />
                  <text fontSize="9.6" fontWeight="800" letterSpacing="1.6" stroke="none">
                    <textPath href="#zv-stamp-ring" textLength="276" lengthAdjust="spacing">
                      TERSALURKAN • LEMBAGA ZAKAT A •
                    </textPath>
                  </text>
                  <text x="60" y="62" textAnchor="middle" fontSize="17" fontWeight="900" stroke="none">
                    SAH
                  </text>
                  <text x="60" y="76" textAnchor="middle" fontSize="7" fontWeight="700" letterSpacing="1" stroke="none">
                    27 OKT 2026
                  </text>
                </g>
              </svg>
            </div>
          </div>
          <figcaption>
            <span>Contoh</span> Kode tercetak di bagian bawah bukti, di atas barcode.
          </figcaption>
        </figure>
      </section>

      {(loading || data) && (
        <section className="zv-ticket" aria-live="polite" aria-busy={loading}>
          {loading ? (
            <div className="zv-ticket-body">
              <div className="zs-skeleton" style={{ width: '45%', height: 28 }} />
              <div className="zs-skeleton" style={{ width: '100%', marginTop: 28 }} />
              <div className="zs-skeleton" style={{ width: '85%', marginTop: 14 }} />
              <div className="zs-skeleton" style={{ width: '60%', marginTop: 14 }} />
              <p className="sr-only">Memeriksa catatan...</p>
            </div>
          ) : (
            data && (
              <>
                <div className="zv-ticket-body">
                  <header className="zv-ticket-head">
                    <div>
                      <small>{kindOf(data.kode_unik) ?? 'Catatan'}</small>
                      <h2>{data.kode_unik}</h2>
                    </div>
                    <span className="zs-badge">
                      <Check size={14} aria-hidden="true" />
                      {statusLabel(data.status)}
                    </span>
                  </header>
                  <ol
                    className="zv-steps"
                    aria-label="Tahap kerja"
                    style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
                  >
                    {steps.map((s, i) => {
                      const ok = done || i < stage;
                      return (
                        <li
                          key={s}
                          className={ok ? 'done' : i === stage ? 'now' : ''}
                          aria-current={!done && i === stage ? 'step' : undefined}
                        >
                          <i aria-hidden="true">{ok ? <Check size={12} /> : i + 1}</i>
                          {s}
                        </li>
                      );
                    })}
                  </ol>
                  <dl className="zs-rows">
                    <div>
                      <dt>Nominal tercatat</dt>
                      <dd>{formatMoney(data.nominal)}</dd>
                    </div>
                    <div>
                      <dt>Pos dana</dt>
                      <dd>{data.pos_dana}</dd>
                    </div>
                    <div>
                      <dt>Tahap kerja</dt>
                      <dd>{stageKey[data.stage] ?? data.stage}</dd>
                    </div>
                  </dl>
                </div>
                <div className="zv-ticket-stub">
                  <div className="zs-hash">
                    <div>
                      <h3>Hash audit sumber</h3>
                      {data.hash_transaksi && (
                        <button
                          type="button"
                          className="zs-btn zs-btn-ghost zs-btn-sm"
                          onClick={() => {
                            void navigator.clipboard?.writeText(data.hash_transaksi!).then(() => {
                              setCopied(true);
                              setTimeout(() => setCopied(false), 1600);
                            });
                          }}
                        >
                          {copied ? <Check size={15} /> : <Copy size={15} />}
                          {copied ? 'Tersalin' : 'Salin'}
                        </button>
                      )}
                    </div>
                    <code className="zs-code">{data.hash_transaksi ?? 'Belum tersedia'}</code>
                  </div>
                  <p className="zs-note">
                    Hash ini mengacu pada catatan sumber. Status transaksi tidak otomatis membuktikan
                    adanya tanda tangan atau kesaksian silang yang belum diterbitkan.
                  </p>
                  <div className="zv-ticket-actions">
                    <Link href="/silang" className="zs-btn zs-btn-ghost zs-btn-sm">
                      <Layers size={15} aria-hidden="true" /> Cocokkan di papan silang
                    </Link>
                    <a
                      href={'/cetak/' + data.kode_unik + '?auto=1'}
                      target="_blank"
                      rel="noopener"
                      className="zs-btn zs-btn-green zs-btn-sm"
                    >
                      <Printer size={15} aria-hidden="true" /> Cetak bukti (PDF)
                    </a>
                  </div>
                </div>
              </>
            )
          )}
        </section>
      )}

      <section className="zv-facts" aria-labelledby="zv-facts-title">
        <h2 id="zv-facts-title" className="sr-only">
          Tentang verifikasi publik
        </h2>
        <article>
          <span>
            <FileSearch size={20} aria-hidden="true" />
          </span>
          <h3>Yang bisa dicek</h3>
          <p>Status terakhir, nominal tercatat, pos dana, dan tahap kerja sebuah catatan.</p>
        </article>
        <article>
          <span>
            <EyeOff size={20} aria-hidden="true" />
          </span>
          <h3>Yang tetap tersembunyi</h3>
          <p>Nama, alamat, dan berkas pribadi muzaki maupun mustahik tidak pernah ditampilkan.</p>
        </article>
        <article>
          <span>
            <Fingerprint size={20} aria-hidden="true" />
          </span>
          <h3>Bisa dibuktikan</h3>
          <p>Hash audit dapat dicocokkan dengan papan silang yang disaksikan lembaga lain.</p>
        </article>
      </section>

      <aside className="zv-help-strip">
        <div>
          <h2>Kode tidak ditemukan?</h2>
          <p>
            Pastikan 12 karakternya sama persis dengan bukti. Catatan baru bisa diperiksa setelah
            lembaga menyimpannya.
          </p>
        </div>
        <Link href="/docs" className="zs-btn">
          <BookOpen size={17} aria-hidden="true" /> Baca panduan
        </Link>
      </aside>
    </div>
  );
}
