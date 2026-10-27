'use client';
import { useEffect, useState } from 'react';
import { STATIONS, STATUS_LABELS, type StationId } from '@/lib/office/model';
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
function WorkCard({
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
        <strong>{item.code}</strong>
      </header>
      <p>
        {STATIONS.find((s) => s.id === item.stage)?.title} /{' '}
        {STATUS_LABELS[item.domainStatus] ?? 'Penerimaan tercatat'}
      </p>
      <p>
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
export default function WorkQueue({
  workflow,
  station,
  onOpen,
  referenceType,
}: {
  workflow: OfficeWorkflow;
  station?: StationId;
  referenceType?: 'penerimaan' | 'penyaluran';
  onOpen?: (path: string, title: string) => void;
}) {
  const [mine, setMine] = useState(false);
  const items =
    workflow.snapshot?.items.filter(
      (w) =>
        (!referenceType || w.referenceType === referenceType) &&
        (!station || w.stage === station) &&
        (!mine ||
          w.assignedUserId === workflow.snapshot?.actor.id ||
          w.eligibleUserIds.includes(workflow.snapshot!.actor.id)),
    ) ?? [];
  return (
    <section className="zo-work-queue" aria-label="Antrean pekerjaan bersama">
      <p className="zo-eyebrow">ANTREAN TIM</p>
      <p role="status">
        {workflow.connection === 'live'
          ? 'Terhubung'
          : workflow.connection === 'loading'
            ? 'Menghubungkan...'
            : workflow.connection === 'paused'
              ? 'Koneksi dijeda'
              : 'Koneksi belum tersedia; data terakhir dapat berubah.'}
      </p>
      {workflow.error && (
        <p className="zo-notice" role="alert">
          {workflow.error}
        </p>
      )}
      {workflow.connection !== 'live' && (
        <button className="zo-text-button" onClick={workflow.reconnect}>
          Hubungkan ulang
        </button>
      )}
      <label className="zo-filter">
        <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Tugas
        saya dan yang dapat saya ambil
      </label>
      {workflow.snapshot && (
        <small>
          Menampilkan maksimal 200 pekerjaan terbaru; proses aktif didahulukan. Penugasan bukan
          persetujuan transaksi.
        </small>
      )}
      <div className="zo-task-list">
        {items.map((item) => (
          <WorkCard item={item} workflow={workflow} onOpen={onOpen} key={item.id} />
        ))}
        {workflow.snapshot && !items.length && (
          <p>Belum ada tugas bersama sesuai filter. Mulai melalui formulir pencatatan bersama.</p>
        )}
      </div>
    </section>
  );
}
