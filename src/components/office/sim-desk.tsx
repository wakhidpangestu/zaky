'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FilePlus, HandHeart, ShieldCheck, X } from 'lucide-react';
import { STATIONS, type StationId } from '@/lib/office/model';
import type { WorkItem } from '@/lib/office/workflow';
import type { SimView } from '@/lib/office/simulator';
import type { OfficeWorkflow } from './use-office-workflow';
import { WorkCard, friendly } from './work-queue';
import RecordDetail from '@/components/workflow/record-detail';
import { rupiah } from './format';

const title = (id: StationId) => STATIONS.find((s) => s.id === id)!.title;

/** Open work waiting at a desk, newest first. */
export function deskItems(items: WorkItem[], station: StationId) {
  return items
    .filter((w) => w.status === 'open' && w.stage === station)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Work at a desk the signed-in officer may take right now (same rule as the database). */
export function deskQueue(items: WorkItem[], actorId: string, station: StationId) {
  return deskItems(items, station).filter((w) => w.eligibleUserIds.includes(actorId)).length;
}

const LEAD: Record<StationId, string> = {
  penerimaan: 'Catat zakat, infak, atau sedekah yang baru diterima. Saldo pos dana langsung bertambah.',
  penyaluran: 'Buat draf penyaluran untuk mustahik terdaftar. Dana dicadangkan sampai disahkan.',
  saksi: 'Konfirmasi penyerahan dana. Butuh dua saksi dari unit yang berbeda dengan pembuat draf.',
  persetujuan: 'Periksa bukti dan kesaksian, lalu sahkan penyaluran agar dana tercatat tersalurkan.',
  catatan: 'Setiap tindakan tercatat berantai dengan hash. Siapa pun bisa memeriksa kodenya.',
};

/**
 * A desk in Zaky Simulator: the same real records and actions as the standard dashboard.
 * Every button here writes to the institution's database.
 */
export default function SimDesk({
  station,
  workflow,
  view,
  onClose,
  onWizard,
}: {
  station: StationId;
  workflow: OfficeWorkflow;
  view: SimView | null;
  onClose: () => void;
  onWizard: (kind: 'receipt' | 'distribution') => void;
}) {
  const [record, setRecord] = useState<string | null>(null);
  const snapshot = workflow.snapshot;
  const items = snapshot ? deskItems(snapshot.items, station) : [];
  const mine = snapshot ? deskQueue(snapshot.items, snapshot.actor.id, station) : 0;
  const recent = snapshot
    ? snapshot.items
        .filter((w) => w.referenceType === (station === 'penerimaan' ? 'penerimaan' : 'penyaluran'))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 4)
    : [];

  return (
    <section className="zo-sim-panel zo-desk" role="dialog" aria-labelledby="zo-desk-title">
      <header>
        <div>
          <div className="zo-sim-panel-role-chip">
            <span className="zo-sim-badge">Data nyata · realtime</span>
            {mine > 0 && <span className="zo-sim-badge-count">{mine} untuk Anda</span>}
          </div>
          <h2 id="zo-desk-title">{title(station)}</h2>
        </div>
        <button className="zo-icon" aria-label="Tutup meja (Esc)" onClick={onClose}>
          <X size={18} />
        </button>
      </header>

      {record ? (
        <div className="zo-desk-record">
          <button className="zo-text-button" onClick={() => setRecord(null)}>
            <ArrowLeft size={15} aria-hidden="true" /> Kembali ke antrean meja
          </button>
          <RecordDetail id={record} workflow={workflow} />
        </div>
      ) : (
        <>
          <p className="zo-desk-lead">{LEAD[station]}</p>

          {station === 'penerimaan' && (
            <button className="zo-btn zo-desk-main" onClick={() => onWizard('receipt')}>
              <FilePlus size={18} aria-hidden="true" /> Catat penerimaan baru
            </button>
          )}
          {station === 'penyaluran' && (
            <button className="zo-btn zo-desk-main" onClick={() => onWizard('distribution')}>
              <HandHeart size={18} aria-hidden="true" /> Buat draf penyaluran
            </button>
          )}

          {workflow.error && <p className="zo-notice">{friendly(workflow.error)}</p>}
          {!snapshot && !workflow.error && <p role="status">Memuat antrean meja...</p>}

          {station === 'catatan' ? (
            <>
              <ol className="zo-sim-log">
                {view?.audit.slice(0, 8).map((a) => (
                  <li key={a.seq}>
                    <span>{a.detail}</span>
                    <small>
                      #{a.seq} · {a.actor} · <code>{a.hash.slice(0, 10)}</code>
                    </small>
                  </li>
                ))}
              </ol>
              <Link className="zo-btn zo-btn-secondary" href="/verifikasi">
                <ShieldCheck size={16} aria-hidden="true" /> Cek kode di halaman publik
              </Link>
            </>
          ) : station === 'saksi' || station === 'persetujuan' ? (
            items.length ? (
              <div className="zo-desk-list">
                {items.map((item) => (
                  <WorkCard
                    key={item.id}
                    item={item}
                    workflow={workflow}
                    onOpen={(path) => setRecord(new URL(path, location.origin).searchParams.get('item'))}
                  />
                ))}
              </div>
            ) : (
              snapshot && <p className="zo-desk-empty">Tidak ada berkas yang menunggu di meja ini.</p>
            )
          ) : (
            snapshot && (
              <>
                <h3 className="zo-desk-sub">Terbaru dari meja ini</h3>
                {recent.length ? (
                  <ul className="zo-desk-recent">
                    {recent.map((w) => (
                      <li key={w.id}>
                        <button onClick={() => setRecord(w.id)}>
                          <b>{w.code}</b>
                          <span>{rupiah(Number(w.amount))}</span>
                          <small>{w.status === 'open' ? 'Berjalan' : 'Selesai'}</small>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="zo-desk-empty">Belum ada catatan.</p>
                )}
              </>
            )
          )}
        </>
      )}
    </section>
  );
}
