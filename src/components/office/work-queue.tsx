'use client';
import { useEffect, useState } from 'react';
import { STATIONS, STATUS_LABELS } from '@/lib/office/model';
import type { WorkItem, WorkHistory } from '@/lib/office/workflow';
import type { OfficeWorkflow } from './use-office-workflow';

const events: Record<string, string> = {
  created: 'Tugas tercatat',
  source_changed: 'Tahap mengikuti transaksi',
  claim: 'Tugas diambil',
  handoff: 'Tugas diserahkan',
  release: 'Tugas dilepas',
};
function TaskHistory({ item }: { item: WorkItem }) {
  const [history, setHistory] = useState<WorkHistory[]>([]),
    [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/office/work-items?history=' + item.id, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error);
        setHistory(body.history);
        setError('');
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Riwayat tidak tersedia.');
      });
    return () => controller.abort();
  }, [item.id, item.version]);
  return (
    <div>
      <p>Riwayat operasional; audit keuangan tetap terpisah.</p>
      {error && <p role="alert">{error}</p>}
      <ol>
        {history.map((e) => (
          <li key={e.id}>
            {events[e.type] ?? e.type} — {e.actorName ?? 'Sistem'}
            <br />
            <small>
              {new Date(e.createdAt).toLocaleString('id-ID')}
              {e.reason ? ' / ' + e.reason : ''}
            </small>
          </li>
        ))}
      </ol>
    </div>
  );
}
export function WorkCard({
  item,
  workflow,
  onOpen,
}: {
  item: WorkItem;
  workflow: OfficeWorkflow;
  onOpen?: (path: string, title: string) => void;
}) {
  const [target, setTarget] = useState(''),
    [reason, setReason] = useState(''),
    [history, setHistory] = useState(false);
  const actor = workflow.snapshot!.actor,
    members = workflow.snapshot!.members;
  const owner =
    members.find((m) => m.id === item.assignedUserId)?.nama ??
    (item.assignedUserId ? 'Akun tidak aktif' : 'Belum diambil');
  const owns = item.assignedUserId === actor.id;
  const invalidOwner = !!item.assignedUserId && !item.eligibleUserIds.includes(item.assignedUserId);
  const canClaim =
    item.status === 'open' &&
    (!item.assignedUserId || invalidOwner) &&
    item.eligibleUserIds.includes(actor.id);
  const targets = members.filter((m) => m.id !== actor.id && item.eligibleUserIds.includes(m.id));
  const enabled = !workflow.sending && workflow.connection === 'live';
  const path = '/pekerjaan?item=' + item.id;
  return (
    <article className="zo-work-card">
      <header>
        <strong className="zo-work-code">{item.code}</strong>
        <span className="zo-work-stage">{STATIONS.find((s) => s.id === item.stage)?.title}</span>
      </header>
      <p className="zo-work-status">{STATUS_LABELS[item.domainStatus] ?? 'Penerimaan tercatat'}</p>
      <p className="zo-work-owner">
        Penanggung jawab: <strong>{owner}</strong>
      </p>
      {item.destination && <small>Tujuan: {item.destination}</small>}
      <div className="zo-work-actions">
        {canClaim && (
          <button
            className="zo-btn"
            disabled={!enabled}
            onClick={() => void workflow.mutate(item.id, item.version, 'claim')}
          >
            {invalidOwner ? 'Pulihkan dan ambil tugas' : 'Ambil tugas'}
          </button>
        )}
        {owns && item.status === 'open' && (
          <button
            className="zo-btn zo-btn-secondary"
            disabled={!enabled}
            onClick={() => void workflow.mutate(item.id, item.version, 'release')}
          >
            Lepas tugas
          </button>
        )}
        {onOpen ? (
          <button className="zo-text-button" onClick={() => onOpen(path, 'Record ' + item.code)}>
            Buka catatan
          </button>
        ) : (
          <a href={path}>Buka catatan</a>
        )}
        <button
          className="zo-text-button"
          aria-expanded={history}
          onClick={() => setHistory((v) => !v)}
        >
          Riwayat
        </button>
      </div>
      <small>Catatan dan bukti dibuka langsung berdasarkan ID pekerjaan.</small>
      {owns && item.status === 'open' && (
        <form
          className="zo-handoff"
          onSubmit={(e) => {
            e.preventDefault();
            void workflow.mutate(item.id, item.version, 'handoff', target, reason);
          }}
        >
          <label>
            Serahkan kepada
            <select value={target} onChange={(e) => setTarget(e.target.value)} required>
              <option value="">Pilih petugas yang memenuhi syarat</option>
              {targets.map((m) => (
                <option value={m.id} key={m.id}>
                  {m.nama} / {m.unitName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Alasan penyerahan
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              required
            />
          </label>
          <button
            className="zo-btn"
            disabled={!enabled || !targets.some((m) => m.id === target) || !reason.trim()}
          >
            Serahkan tugas
          </button>
          {!targets.length && (
            <small>Belum ada petugas lain yang memenuhi aturan peran dan unit.</small>
          )}
        </form>
      )}
      {history && <TaskHistory item={item} />}
    </article>
  );
}
/** Server errors are written for operators; show people what happened and what to do. */
export function friendly(error: string) {
  if (/migrasi|belum diaktifkan|belum tersedia|database|koneksi/i.test(error))
    return 'Data kantor belum bisa dimuat karena server pencatatan sedang tidak terhubung. Coba lagi sebentar lagi, atau hubungi admin lembaga bila berlanjut.';
  return error;
}
