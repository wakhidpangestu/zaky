'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { formatMoney } from '@/lib/office/operations';
import './workflow.css';
export default function RecipientConfirmation() {
  const params = useParams(),
    search = useSearchParams();
  const token = String(params.token ?? ''),
    record = search.get('record');
  return <ConfirmationForm key={token + ':' + record} token={token} record={record} />;
}
function ConfirmationForm({ token, record }: { token: string; record: string | null }) {
  const [data, setData] = useState<{
      code: string;
      amount: string;
      status: string;
      decision: string | null;
    } | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    void fetch(
      '/api/office/recipient-confirmation?token=' +
        encodeURIComponent(token) +
        '&record=' +
        encodeURIComponent(record ?? ''),
      { cache: 'no-store', signal: c.signal },
    )
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw new Error(b.error);
        if (!c.signal.aborted) setData(b);
      })
      .catch((e) => {
        if (!c.signal.aborted)
          setError(e instanceof Error ? e.message : 'Tautan tidak dapat dibuka.');
      });
    return () => c.abort();
  }, [token, record, revision]);
  async function decide(accept: boolean) {
    if (
      busy ||
      !window.confirm(
        accept
          ? 'Apakah bantuan benar-benar sudah Anda terima?'
          : 'Apakah Anda ingin menolak konfirmasi penerimaan ini?',
      )
    )
      return;
    setBusy(true);
    try {
      const r = await fetch('/api/office/recipient-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, record, accept }),
        signal: AbortSignal.timeout(12000),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      setError('');
      setRevision((n) => n + 1);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Hasil belum terkonfirmasi. Ulangi keputusan yang sama.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="zw-page">
      <article className="zw-record">
        <small>ZAKY / KONFIRMASI PENERIMA</small>
        <h1>Pastikan amanah diterima.</h1>
        {error && (
          <p role="alert" className="zw-error">
            {error}
          </p>
        )}
        {data ? (
          <>
            <h2>{data.code}</h2>
            <strong>{formatMoney(data.amount)}</strong>
            <p>Status: {data.status.replaceAll('_', ' ')}</p>
            {data.status === 'menunggu_konfirmasi' && !data.decision ? (
              <>
                <p>
                  Konfirmasi hanya bila Anda adalah penerima yang dimaksud. Jangan nyatakan diterima
                  sebelum bantuan benar-benar Anda terima.
                </p>
                <div className="zw-actions">
                  <button className="zw-primary" disabled={busy} onClick={() => void decide(true)}>
                    Sudah saya terima
                  </button>
                  <button disabled={busy} onClick={() => void decide(false)}>
                    Tolak konfirmasi
                  </button>
                </div>
              </>
            ) : (
              <p>Keputusan sudah tercatat. Tahap berikutnya mengikuti pemeriksaan lembaga.</p>
            )}
          </>
        ) : (
          !error && <p>Memeriksa tautan...</p>
        )}
      </article>
    </main>
  );
}
