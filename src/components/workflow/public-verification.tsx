'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatMoney } from '@/lib/office/operations';
import './workflow.css';
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
    [error, setError] = useState('');
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
  return (
    <main className="zw-page">
      <Link href="/">← Beranda</Link>
      <article className="zw-record">
        <small>ZAKY / VERIFIKASI PUBLIK</small>
        <h1>Periksa catatan.</h1>
        <p>
          Gunakan kode yang diterbitkan lembaga. Identitas dan berkas pribadi tidak ditampilkan pada
          halaman publik.
        </p>
        <form
          className="zw-actions"
          onSubmit={(e) => {
            e.preventDefault();
            const clean = value.trim().toUpperCase();
            if (!/^(ZK|RC)[A-Z0-9]{10}$/.test(clean)) {
              setError('Gunakan 12 karakter kode ZK atau RC.');
              return;
            }
            router.push('/verifikasi/' + clean);
          }}
        >
          <input
            aria-label="Kode verifikasi"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={12}
            placeholder="Kode ZK / RC"
            required
          />
          <button className="zw-primary">Periksa kode</button>
        </form>
        {error && (
          <p role="alert" className="zw-error">
            {error}
          </p>
        )}
        {data && (
          <>
            <h2>{data.kode_unik}</h2>
            <dl className="zw-review">
              <dt>Status</dt>
              <dd>{data.status.replaceAll('_', ' ')}</dd>
              <dt>Nominal tercatat</dt>
              <dd>{formatMoney(data.nominal)}</dd>
              <dt>Pos dana</dt>
              <dd>{data.pos_dana}</dd>
              <dt>Tahap kerja</dt>
              <dd>{data.stage}</dd>
            </dl>
            <h3>Hash audit sumber</h3>
            <code className="zw-hash">{data.hash_transaksi ?? 'Belum tersedia'}</code>
            <p>
              Hash ini mengacu pada catatan sumber. Status transaksi tidak otomatis membuktikan
              adanya tanda tangan atau kesaksian silang yang belum diterbitkan.
            </p>
          </>
        )}
        {code && !data && !error && <p>Memeriksa catatan...</p>}
      </article>
    </main>
  );
}
