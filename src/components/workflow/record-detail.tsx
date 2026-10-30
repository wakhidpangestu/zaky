'use client';
import { useEffect, useState, useRef } from 'react';
import { Download } from 'lucide-react';
import { formatMoney, type OperationResult } from '@/lib/office/operations';
import type { OfficeWorkflow } from '@/components/office/use-office-workflow';
import Receipt from './receipt';
interface Detail extends OperationResult {
  workStatus: string;
  version: number;
  stage: string;
  assignedUserId: string | null;
  eligible: boolean;
  actorId: string;
  canCancel: boolean;
  fundName: string;
  donorName: string | null;
  note: string | null;
  recipient: string | null;
  destination: string | null;
  method: string | null;
  amilAmount: string | null;
  fundAmount: string | null;
  channel: string | null;
  amount: string;
  evidence: { id: string; filename: string; hash: string }[];
  audit: { nomor: string; aksi: string; hash: string; waktu: string }[];
  witnesses: { nama: string; unit: string; hasil: string; time: string }[];
}
export default function RecordDetail({ id, workflow }: { id: string; workflow?: OfficeWorkflow }) {
  const [data, setData] = useState<Detail | null>(null),
    [error, setError] = useState(''),
    [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false);
  const pending = useRef<{ key: string; id: string } | null>(null),
    guard = useRef(false),
    controller = useRef<AbortController | null>(null);
  const liveVersion = workflow?.snapshot?.items.find((w) => w.id === id)?.version;
  useEffect(() => {
    const c = new AbortController();
    void fetch('/api/office/records/' + id, { cache: 'no-store', signal: c.signal })
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw new Error(b.error);
        if (!c.signal.aborted) {
          setData(b);
          setError('');
        }
      })
      .catch((e) => {
        if (!c.signal.aborted)
          setError(e instanceof Error ? e.message : 'Catatan tidak dapat dimuat.');
      });
    return () => c.abort();
  }, [id, revision, liveVersion]);
  useEffect(() => () => controller.current?.abort(), []);
  async function act(kind: 'witness' | 'approve' | 'cancel', accept?: boolean) {
    if (!data || guard.current) return;
    if (
      !window.confirm(
        kind === 'cancel'
          ? 'Batalkan draf dan lepaskan reservasi sesuai aturan domain?'
          : kind === 'approve'
            ? 'Sahkan penyaluran ini setelah memeriksa seluruh bukti?'
            : accept
              ? 'Nyatakan bahwa penyerahan sudah diperiksa dan diterima?'
              : 'Tolak konfirmasi penyerahan ini?',
      )
    )
      return;
    guard.current = true;
    setBusy(true);
    setError('');
    const input = {
        kind,
        itemId: id,
        version: data.version,
        ...(kind === 'witness' ? { accept } : {}),
      },
      key = JSON.stringify(input);
    if (pending.current?.key !== key) pending.current = { key, id: crypto.randomUUID() };
    const c = new AbortController();
    controller.current = c;
    try {
      const r = await fetch('/api/office/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, requestId: pending.current.id }),
        signal: AbortSignal.any([c.signal, AbortSignal.timeout(20000)]),
      });
      const b = await r.json();
      if (!r.ok) {
        if (r.status < 500) pending.current = null;
        throw new Error(b.error);
      }
      pending.current = null;
      setRevision((n) => n + 1);
      await workflow?.refresh();
    } catch (e) {
      if (!c.signal.aborted)
        setError(e instanceof Error ? e.message : 'Tindakan belum terkonfirmasi.');
    } finally {
      guard.current = false;
      if (!c.signal.aborted) setBusy(false);
    }
  }
  if (!data || data.workItemId !== id)
    return (
      <div className="zw-record">
        {error ? (
          <p className="zw-error" role="alert">
            {error}
          </p>
        ) : (
          <p role="status">Memuat catatan...</p>
        )}
      </div>
    );
  const currentItem = workflow?.snapshot?.items.find((w) => w.id === id);
  const mine = data.assignedUserId === data.actorId,
    invalidOwner =
      !!data.assignedUserId && !currentItem?.eligibleUserIds.includes(data.assignedUserId);
  const canClaim =
    currentItem?.eligibleUserIds.includes(data.actorId) && (!data.assignedUserId || invalidOwner);
  return (
    <article className="zw-record">
      <small>CATATAN LEMBAGA</small>
      <h2>{data.code}</h2>
      <p>
        {data.fundName} / {data.status.replaceAll('_', ' ')}
      </p>
      {error && (
        <p className="zw-error" role="alert">
          {error}
        </p>
      )}
      <dl className="zw-review">
        <dt>Nominal</dt>
        <dd>{formatMoney(data.amount)}</dd>
        {data.recipient && (
          <>
            <dt>Mustahik</dt>
            <dd>
              {data.recipient} / {data.destination}
            </dd>
          </>
        )}
        {data.channel && (
          <>
            <dt>Kanal</dt>
            <dd>{data.channel}</dd>
            <dt>Muzakki</dt>
            <dd>{data.donorName ?? 'Anonim'}</dd>
            {data.note && (
              <>
                <dt>Keterangan</dt>
                <dd>{data.note}</dd>
              </>
            )}
            <dt>Hak amil</dt>
            <dd>{formatMoney(data.amilAmount ?? '0')}</dd>
            <dt>Masuk pos</dt>
            <dd>{formatMoney(data.fundAmount ?? '0')}</dd>
          </>
        )}
        <dt>Tahap kerja</dt>
        <dd>{data.stage}</dd>
      </dl>
      {data.evidence.length > 0 && (
        <section>
          <h3>Bukti terlampir</h3>
          {data.evidence.map((e) => (
            <p key={e.id}>
              <a href={'/api/office/evidence/' + e.id}>{e.filename} <Download size={12} className="inline" aria-hidden="true" /></a>
              <small className="zw-hash">SHA-256: {e.hash}</small>
            </p>
          ))}
        </section>
      )}
      {data.method === 'saksi' && (
        <section>
          <h3>Konfirmasi saksi</h3>
          {data.witnesses.length ? (
            data.witnesses.map((w, i) => (
              <p key={i}>
                {w.nama} / {w.unit} — {w.hasil}
              </p>
            ))
          ) : (
            <p>Belum ada kesaksian akun yang tercatat.</p>
          )}
        </section>
      )}
      {data.workStatus === 'open' && (
        <div className="zw-actions">
          {canClaim && (
            <button
              disabled={workflow?.sending || workflow?.connection !== 'live'}
              onClick={async () => {
                await workflow?.mutate(id, data.version, 'claim');
                setRevision((n) => n + 1);
              }}
            >
              {invalidOwner ? 'Pulihkan dan ambil tugas' : 'Ambil tugas'}
            </button>
          )}
          {mine && data.eligible && data.stage === 'saksi' && (
            <>
              <button
                className="zw-primary"
                disabled={busy}
                onClick={() => void act('witness', true)}
              >
                Konfirmasi diterima
              </button>
              <button disabled={busy} onClick={() => void act('witness', false)}>
                Tolak penyerahan
              </button>
            </>
          )}
          {mine && data.eligible && data.stage === 'persetujuan' && (
            <button className="zw-primary" disabled={busy} onClick={() => void act('approve')}>
              Sahkan penyaluran
            </button>
          )}
          {data.canCancel && (
            <button disabled={busy} onClick={() => void act('cancel')}>
              Batalkan draf
            </button>
          )}
        </div>
      )}
      <section>
        <h3>Jejak audit sumber</h3>
        {data.audit.length ? (
          data.audit.map((a) => (
            <p key={a.nomor}>
              #{a.nomor} {a.aksi}
              <small className="zw-hash">{a.hash}</small>
            </p>
          ))
        ) : (
          <p>Belum ada hash audit untuk record ini.</p>
        )}
        <small>
          Hash audit sumber tidak sama dengan bukti tanda tangan atau saksi silang yang belum
          diterbitkan.
        </small>
      </section>
      <details>
        <summary>
          {data.confirmationUrl
            ? 'Bukti pencatatan, tautan mustahik dan cetak'
            : 'Bukti pencatatan dan cetak'}
        </summary>
        <Receipt result={data} amount={data.amount} />
      </details>
    </article>
  );
}
