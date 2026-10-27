'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useOfficeWorkflow } from '@/components/office/use-office-workflow';
import WorkQueue from '@/components/office/work-queue';
import WorkWizard from './work-wizard';
import RecordDetail from './record-detail';
import './workflow.css';
import '@/components/office/office.css';
export default function WorkflowWorkspace({
  initialAction,
  filter,
}: {
  initialAction?: 'receipt' | 'distribution';
  filter?: 'penerimaan' | 'penyaluran' | 'persetujuan';
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
  return (
    <main className="zw-page zaky-office">
      <header>
        <Link href="/dasbor">← Ruang kerja</Link>
        <h1>Catatan bersama.</h1>
        <p>Satu catatan, ditangani petugas yang tepat.</p>
      </header>
      <div className="zw-actions">
        <button className="zw-primary" onClick={() => setWizard('receipt')}>
          Catat penerimaan
        </button>
        <button onClick={() => setWizard('distribution')}>Buat draf penyaluran</button>
      </div>
      {item ? (
        <RecordDetail id={item} workflow={workflow} />
      ) : (
        <WorkQueue
          workflow={workflow}
          referenceType={filter === 'penerimaan' || filter === 'penyaluran' ? filter : undefined}
          station={filter === 'persetujuan' ? 'persetujuan' : undefined}
        />
      )}
      <p>
        <Link href="/dasbor?mode=3d">Buka kantor 3D →</Link>
      </p>
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
