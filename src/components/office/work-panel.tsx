'use client';
import { useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { isAllowedWorkPath } from '@/lib/office/model';
import type { OfficeWorkflow } from './use-office-workflow';
import WorkWizard from '@/components/workflow/work-wizard';
import RecordDetail from '@/components/workflow/record-detail';
import WorkQueue from './work-queue';
import '@/components/workflow/workflow.css';
export default function WorkPanel({
  path,
  title,
  onClose,
  onRefresh,
  workflow,
  onNavigate,
}: {
  path: string;
  title: string;
  onClose: () => void;
  onRefresh: () => void;
  workflow?: OfficeWorkflow;
  onNavigate?: (path: string, title: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    allowed = isAllowedWorkPath(path),
    wizard = path === '/penerimaan/buat' || path === '/penyaluran/buat';
  useEffect(() => {
    if (allowed && !wizard) dialog.current?.showModal();
  }, [allowed, wizard]);
  function close() {
    if (window.confirm('Tutup panel catatan?')) {
      onRefresh();
      onClose();
    }
  }
  if (!allowed) return <p role="alert">Alat kerja tidak dikenali.</p>;
  if (wizard)
    return (
      <WorkWizard
        initial={path === '/penerimaan/buat' ? 'receipt' : 'distribution'}
        onClose={onClose}
        onSaved={onRefresh}
      />
    );
  const item = path.startsWith('/pekerjaan?')
    ? new URLSearchParams(path.split('?')[1]).get('item')
    : null;
  return (
    <dialog
      ref={dialog}
      className="zo-dialog zw-record-dialog"
      aria-labelledby="zo-tool-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <header>
        <h2 id="zo-tool-title">{title}</h2>
        <Link href={item ? path : '/pekerjaan'}>
          <ExternalLink size={15} /> Halaman penuh
        </Link>
        <button className="zo-icon" aria-label="Tutup panel kerja" onClick={close}>
          <X />
        </button>
      </header>
      <div className="zw-panel-body">
        {item ? (
          <RecordDetail id={item} workflow={workflow} />
        ) : workflow &&
          ['/pekerjaan', '/penerimaan', '/penyaluran', '/persetujuan'].includes(path) ? (
          <WorkQueue
            workflow={workflow}
            onOpen={onNavigate}
            referenceType={
              path === '/penerimaan'
                ? 'penerimaan'
                : path === '/penyaluran'
                  ? 'penyaluran'
                  : undefined
            }
            station={path === '/persetujuan' ? 'persetujuan' : undefined}
          />
        ) : (
          <div>
            <p>Alat ini tersedia pada halaman tersendiri.</p>
            <Link className="zo-btn" href={path}>
              Buka {title} →
            </Link>
          </div>
        )}
      </div>
    </dialog>
  );
}
