'use client';
import { useState } from 'react';
import { CircleCheck, CircleMinus, CircleX, Cpu, Download, LoaderCircle } from 'lucide-react';
import { verifikasiBukti, type HasilVerifikasi, type StatusCek } from '@/lib/jaringan/verifikasi-bukti';

const IKON: Record<StatusCek, typeof CircleCheck> = { lulus: CircleCheck, gagal: CircleX, lewati: CircleMinus };
const LABEL: Record<StatusCek, string> = { lulus: 'Lulus', gagal: 'Gagal', lewati: 'Dilewati' };

/**
 * Verifikasi mandiri: paket bukti diunduh, lalu SHA-256 dan Ed25519 dihitung di browser
 * pengguna dengan WebCrypto. Server hanya memasok data; hasilnya tidak berasal dari server.
 */
export default function ProofCheck({ code }: { code: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [hasil, setHasil] = useState<HasilVerifikasi | null>(null);
  const [error, setError] = useState('');
  const [entri, setEntri] = useState(0);

  async function jalankan() {
    setState('loading');
    setError('');
    try {
      const r = await fetch('/api/publik/bukti/' + encodeURIComponent(code), { cache: 'no-store' });
      const bukti = await r.json();
      if (!r.ok) throw new Error(bukti.error ?? 'Paket bukti belum tersedia.');
      if (!globalThis.crypto?.subtle) throw new Error('Browser ini tidak menyediakan WebCrypto.');
      setEntri(bukti.entri.length);
      setHasil(await verifikasiBukti(bukti));
      setState('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verifikasi gagal dijalankan.');
      setState('error');
    }
  }

  const ringkasan = !hasil
    ? null
    : !hasil.sah
      ? { status: 'gagal' as const, teks: 'Ada pemeriksaan yang gagal. Catatan ini tidak sesuai dengan bukti yang diterbitkan.' }
      : hasil.terikatHashHarian
        ? { status: 'lulus' as const, teks: 'Semua pemeriksaan lulus. Catatan terikat pada hash harian bertanda tangan.' }
        : { status: 'lewati' as const, teks: 'Rantai cocok, tetapi pengikatan ke hash harian belum dapat diperiksa.' };

  return (
    <section className="zv-proof" aria-labelledby="zv-proof-title">
      <header className="zv-proof-head">
        <div>
          <h2 id="zv-proof-title">
            <Cpu size={18} aria-hidden="true" /> Verifikasi mandiri di perangkat ini
          </h2>
          <p>
            Browser Anda mengunduh paket bukti lalu menghitung ulang SHA-256 setiap entri audit dan
            memeriksa tanda tangan Ed25519 lembaga serta saksinya. Tidak ada hasil yang diambil dari server.
          </p>
        </div>
        <div className="zv-proof-actions">
          <button type="button" className="zs-btn zs-btn-green zs-btn-sm" onClick={jalankan} disabled={state === 'loading'}>
            {state === 'loading' ? (
              <LoaderCircle size={15} className="zv-spin" aria-hidden="true" />
            ) : (
              <Cpu size={15} aria-hidden="true" />
            )}
            {state === 'done' ? 'Periksa ulang' : 'Jalankan verifikasi'}
          </button>
          <a className="zs-btn zs-btn-ghost zs-btn-sm" href={'/api/publik/bukti/' + code} download={`bukti-${code}.json`}>
            <Download size={15} aria-hidden="true" /> Unduh paket
          </a>
        </div>
      </header>

      <div aria-live="polite" aria-busy={state === 'loading'}>
        {state === 'error' && (
          <p className="zv-proof-summary is-gagal" role="alert">
            <CircleX size={18} aria-hidden="true" /> {error}
          </p>
        )}
        {state === 'done' && hasil && ringkasan && (
          <>
            <p className={'zv-proof-summary is-' + ringkasan.status}>
              {(() => {
                const Icon = IKON[ringkasan.status];
                return <Icon size={18} aria-hidden="true" />;
              })()}
              {ringkasan.teks} <small>{entri} entri dihitung ulang.</small>
            </p>
            <ol className="zv-proof-list">
              {hasil.cek.map((c) => {
                const Icon = IKON[c.status];
                return (
                  <li key={c.id} className={'is-' + c.status}>
                    <Icon size={18} aria-hidden="true" />
                    <div>
                      <b>
                        {c.judul} <span className="zv-proof-tag">{LABEL[c.status]}</span>
                      </b>
                      <span>{c.rincian}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>
    </section>
  );
}
