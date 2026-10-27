'use client';
import Link from 'next/link';
import { useState } from 'react';
import TeamChat from './team-chat';
import TeamPresence from './team-presence';
import WorkQueue from './work-queue';
import WorkPanel from './work-panel';
import { WORK_TOOLS, type OfficeUser } from '@/lib/office/model';
import { formatMoney } from '@/lib/office/operations';
import type { OfficeData } from './use-office-data';
export default function StandardView({ data }: { data: OfficeData; user: OfficeUser }) {
  const [chat, setChat] = useState(false),
    [panel, setPanel] = useState<{ path: string; title: string } | null>(null);
  const financial = data.workflow.snapshot?.financial;
  const open = (path: string, title: string) => setPanel({ path, title });
  return (
    <div className="zo-standard">
      <nav className="zo-tools" aria-label="Alat kerja standar">
        <button onClick={() => open('/penerimaan/buat', 'Penerimaan')}>Catat penerimaan</button>
        <button onClick={() => open('/penyaluran/buat', 'Penyaluran')}>Buat draf penyaluran</button>
        {WORK_TOOLS.map((t) => (
          <Link key={t.path} href={t.path}>
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="zo-metrics">
        {(
          [
            ['total', 'Total masuk'],
            ['available', 'Tersedia'],
            ['reserved', 'Dicadangkan'],
            ['delivered', 'Tersalurkan'],
          ] as const
        ).map(([key, label]) => (
          <article key={key}>
            <p>{label}</p>
            <strong>{financial ? formatMoney(financial.totals[key]) : '—'}</strong>
          </article>
        ))}
      </div>
      <div className="zo-standard-grid">
        <section className="zo-card">
          <p className="zo-eyebrow">DANA LEMBAGA</p>
          <h2>Pos dana</h2>
          {financial ? (
            financial.funds.map((f) => (
              <article className="zo-fund" key={f.id}>
                <h3>{f.nama}</h3>
                <dl>
                  <dt>Tersedia</dt>
                  <dd>{formatMoney(f.available)}</dd>
                  <dt>Dicadangkan</dt>
                  <dd>{formatMoney(f.reserved)}</dd>
                  <dt>Tersalurkan</dt>
                  <dd>{formatMoney(f.delivered)}</dd>
                </dl>
              </article>
            ))
          ) : (
            <p>
              Saldo ditampilkan setelah layanan lembaga tersambung. Data simulasi browser tidak
              dicampur ke saldo ini.
            </p>
          )}
          <button className="zo-btn" onClick={() => open('/penerimaan/buat', 'Catat penerimaan')}>
            Catat penerimaan
          </button>
        </section>
        <section className="zo-card">
          <h2>Antrean pekerjaan</h2>
          <WorkQueue workflow={data.workflow} onOpen={open} />
        </section>
      </div>
      <section className="zo-card" style={{ marginTop: 20 }}>
        <button
          className="zo-btn zo-btn-secondary"
          aria-expanded={chat}
          onClick={() => setChat((v) => !v)}
        >
          Koordinasi tim {chat ? '(tutup)' : '(buka)'}
        </button>
        <TeamPresence workflow={data.workflow} />
        {chat && <TeamChat />}
      </section>
      {panel && (
        <WorkPanel
          key={panel.path}
          {...panel}
          onClose={() => setPanel(null)}
          onRefresh={data.refresh}
          workflow={data.workflow}
          onNavigate={open}
        />
      )}
    </div>
  );
}
