'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Check, HandHeart, ShieldCheck, TriangleAlert, X } from 'lucide-react';
import { formatMoney } from '@/lib/office/operations';
import '@/components/site/site.css';
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
    // The decision waiting for a second, explicit tap (replaces window.confirm).
    [pending, setPending] = useState<boolean | null>(null),
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
    if (busy) return;
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
      setPending(null);
      setRevision((n) => n + 1);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Hasil belum terkonfirmasi. Ulangi keputusan yang sama.',
      );
    } finally {
      setBusy(false);
    }
  }
  const open = data?.status === 'menunggu_konfirmasi' && !data.decision;
  return (
    <section className="zs-confirm">
      <figure className="zs-art">
        <Image
          src="/scenes/konfirmasi.webp"
          alt="Ruang konfirmasi di pusat layanan Zaky"
          width={1400}
          height={1328}
          priority
        />
      </figure>
      <div className="zs-card">
        <span className="zs-eyebrow">
          <HandHeart size={14} /> Konfirmasi penerima
        </span>
        <h1 className="zs-title" style={{ fontSize: 'clamp(32px, 4.4vw, 46px)' }}>
          Pastikan amanah <em>sampai di tangan Anda.</em>
        </h1>
        {error && (
          <p role="alert" className="zs-alert zs-alert-error">
            <TriangleAlert size={18} />
            {error}
          </p>
        )}
        {data ? (
          <>
            <div className="zs-amount">
              <small>Bantuan untuk kode {data.code}</small>
              <strong>{formatMoney(data.amount)}</strong>
              <span className="zs-badge">{data.status.replaceAll('_', ' ')}</span>
            </div>
            {!open ? (
              <p className="zs-alert zs-alert-info">
                <Check size={18} />
                Keputusan sudah tercatat. Tahap berikutnya mengikuti pemeriksaan lembaga.
              </p>
            ) : pending === null ? (
              <>
                <p>
                  Konfirmasi hanya bila Anda adalah penerima yang dimaksud. Jangan nyatakan diterima
                  sebelum bantuan benar-benar Anda terima.
                </p>
                <div className="zs-actions">
                  <button className="zs-btn zs-btn-green" onClick={() => setPending(true)}>
                    <Check size={18} /> Sudah saya terima
                  </button>
                  <button className="zs-btn zs-btn-ghost" onClick={() => setPending(false)}>
                    <X size={18} /> Tolak konfirmasi
                  </button>
                </div>
              </>
            ) : (
              <div className={'zs-alert ' + (pending ? 'zs-alert-info' : 'zs-alert-error')}>
                <ShieldCheck size={18} />
                <div>
                  <b>
                    {pending
                      ? 'Apakah bantuan benar-benar sudah Anda terima?'
                      : 'Tolak konfirmasi penerimaan ini?'}
                  </b>
                  <p style={{ margin: '4px 0 0', color: 'inherit' }}>
                    Keputusan tercatat permanen dan diperiksa lembaga.
                  </p>
                  <div className="zs-actions">
                    <button
                      className={'zs-btn' + (pending ? ' zs-btn-green' : '')}
                      disabled={busy}
                      autoFocus
                      onClick={() => void decide(pending)}
                    >
                      {busy ? 'Menyimpan...' : pending ? 'Ya, sudah diterima' : 'Ya, tolak'}
                    </button>
                    <button
                      className="zs-btn zs-btn-ghost"
                      disabled={busy}
                      onClick={() => setPending(null)}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          !error && (
            <div aria-busy="true" style={{ marginTop: 24 }}>
              <div className="zs-skeleton" style={{ width: '50%', height: 30 }} />
              <div className="zs-skeleton" style={{ width: '90%', marginTop: 16 }} />
              <p className="sr-only">Memeriksa tautan...</p>
            </div>
          )
        )}
        <p className="zs-note">Tautan ini hanya untuk Anda. Jangan bagikan kepada orang lain.</p>
      </div>
    </section>
  );
}
