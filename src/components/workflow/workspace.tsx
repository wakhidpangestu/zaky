'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Boxes, FilePlus, HandCoins, HandHeart, ShieldCheck, Inbox, type LucideIcon } from 'lucide-react';
import { useOfficeWorkflow } from '@/components/office/use-office-workflow';
import WorkBoard from '@/components/office/work-board';
import WorkWizard from './work-wizard';
import RecordDetail from './record-detail';
import './workflow.css';
import '@/components/office/office.css';

type Filter = 'penerimaan' | 'penyaluran' | 'persetujuan';

/** What each workspace route is for: its title, purpose, queue and main action. */
const PAGES: Record<
  Filter | 'pekerjaan',
  {
    title: string;
    lead: string;
    icon: LucideIcon;
    queue: string;
    empty: string;
    actions: ('receipt' | 'distribution')[];
  }
> = {
  pekerjaan: {
    title: 'Antrean pekerjaan',
    lead: 'Semua tugas tim yang menunggu tindakan. Ambil tugas yang sesuai dengan peran Anda.',
    icon: Inbox,
    queue: 'Tugas tim',
    empty: 'Belum ada tugas yang menunggu. Tugas baru muncul setelah ada penerimaan atau draf penyaluran.',
    actions: ['receipt', 'distribution'],
  },
  penerimaan: {
    title: 'Penerimaan zakat',
    lead: 'Zakat, infak, dan sedekah yang sudah dicatat masuk, lengkap dengan tahap pemeriksaannya.',
    icon: HandCoins,
    queue: 'Catatan penerimaan',
    empty: 'Belum ada penerimaan yang tercatat. Catat penerimaan pertama untuk memulai.',
    actions: ['receipt'],
  },
  penyaluran: {
    title: 'Penyaluran',
    lead: 'Draf penyaluran, konfirmasi penerima, dan statusnya sampai dana tersalurkan.',
    icon: HandHeart,
    queue: 'Catatan penyaluran',
    empty: 'Belum ada draf penyaluran. Buat draf untuk mustahik yang sudah terdaftar.',
    actions: ['distribution'],
  },
  persetujuan: {
    title: 'Persetujuan',
    lead: 'Penyaluran yang sudah dikonfirmasi dan menunggu pemeriksaan bukti sebelum disahkan.',
    icon: ShieldCheck,
    queue: 'Menunggu persetujuan',
    empty: 'Tidak ada penyaluran yang menunggu persetujuan Anda saat ini.',
    actions: [],
  },
};

const ACTION = {
  receipt: { label: 'Catat penerimaan', icon: FilePlus },
  distribution: { label: 'Buat draf penyaluran', icon: HandHeart },
} as const;

export default function WorkflowWorkspace({
  initialAction,
  filter,
}: {
  initialAction?: 'receipt' | 'distribution';
  filter?: Filter;
}) {
  const workflow = useOfficeWorkflow(),
    params = useSearchParams(),
    item = params.get('item'),
    [wizard, setWizard] = useState<'receipt' | 'distribution' | null>(initialAction ?? null);
  const initial = params.get('aksi');
  useEffect(() => {
    if (initial === 'receipt' || initial === 'distribution')
      queueMicrotask(() => setWizard(initial));
  }, [initial]);
  const key =
    filter ?? (initialAction === 'receipt' ? 'penerimaan' : initialAction === 'distribution' ? 'penyaluran' : 'pekerjaan');
  const page = PAGES[key];
  const PageIcon = page.icon;
  return (
    <main className="zw-page zaky-office zw-workspace">
      <header className="zw-head">
        <span className="zw-head-icon" aria-hidden="true">
          <PageIcon size={26} />
        </span>
        <div>
          <p className="zo-eyebrow">RUANG KERJA</p>
          <h1>{page.title}</h1>
          <p>{page.lead}</p>
        </div>
        {page.actions.length > 0 && (
          <div className="zw-head-actions">
            {page.actions.map((a, i) => {
              const A = ACTION[a];
              return (
                <button
                  key={a}
                  className={'zw-key' + (i === 0 ? ' zw-key-primary' : '')}
                  onClick={() => setWizard(a)}
                >
                  <A.icon size={18} strokeWidth={2.5} aria-hidden="true" />
                  {A.label}
                </button>
              );
            })}
          </div>
        )}
      </header>
      {item ? (
        <RecordDetail id={item} workflow={workflow} />
      ) : (
        <WorkBoard
          workflow={workflow}
          pageKey={key}
          referenceType={filter === 'penerimaan' || filter === 'penyaluran' ? filter : undefined}
          station={filter === 'persetujuan' ? 'persetujuan' : undefined}
          label={page.queue}
          emptyText={page.empty}
        />
      )}
      <Link className="zw-sim-link" href="/dasbor?mode=3d">
        <Boxes size={20} aria-hidden="true" />
        <span>
          <b>Lebih suka bekerja sambil bermain?</b> Kerjakan antrean yang sama di Zaky Simulator, data tetap realtime.
        </span>
      </Link>
      {wizard && (
        <WorkWizard
          initial={wizard}
          onClose={() => setWizard(null)}
          onSaved={() => void workflow.refresh()}
        />
      )}
    </main>
  );
}
