'use client';
import { useState } from 'react';
import { Check, X, Eye, Lock } from 'lucide-react';
import { STATIONS, type StationId } from '@/lib/office/model';
import {
  AMIL_LIMIT,
  ASNAF,
  ROLE_LABEL,
  STATION_ROLE,
  WITNESSES_NEEDED,
  amilShare,
  deskReport,
  type Case,
  type Receipt,
  type SimAction,
  type SimView,
} from '@/lib/office/simulator';

export const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
export const when = (at: number) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(at);

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={'zo-sim-row' + (warn ? ' warn' : '')}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

const STEPS = ['Petugas', 'Saksi', 'Penyetuju', 'Terbit'];
/** Where a distribution is in the chain, so every role sees the whole process at a glance. */
export function Steps({ stage }: { stage: Case['stage'] | 'petugas' }) {
  const at = { petugas: 0, saksi: 1, persetujuan: 2, terbit: 3, ditolak: -1, dikembalikan: -1 }[stage];
  return (
    <ol className="zo-sim-steps" aria-label="Tahap proses">
      {STEPS.map((s, i) => (
        <li key={s} data-state={at < 0 ? 'stop' : i < at ? 'done' : i === at ? 'now' : 'next'}>
          <span>{i < at || (at === 3 && i === 3) ? <Check size={11} /> : i + 1}</span>
          {s}
        </li>
      ))}
    </ol>
  );
}

function Choice({
  busy,
  no,
  yes,
  onNo,
  onYes,
}: {
  busy: boolean;
  no: string;
  yes: string;
  onNo: () => void;
  onYes: () => void;
}) {
  return (
    <div className="zo-sim-actions">
      <button className="zo-btn zo-btn-secondary" disabled={busy} onClick={onNo}>
        <X size={16} /> {no}
      </button>
      <button className="zo-btn" disabled={busy} onClick={onYes}>
        <Check size={16} /> {yes}
      </button>
    </div>
  );
}

function Task({ view, station, busy, onAct }: { view: SimView; station: StationId; busy: boolean; onAct: (a: SimAction) => void }) {
  if (station === 'penerimaan') {
    const d = view.deposits[0];
    if (!d) return <p>Belum ada muzakki di meja ini.</p>;
    return (
      <>
        <dl>
          <Row label="Muzakki" value={d.name} />
          <Row label="Jenis setoran" value={d.jenis} />
          <Row label="Nominal" value={rupiah(d.nominal)} />
        </dl>
        <p className="zo-sim-hint">
          Pilih pos dana. Hak amil dihitung otomatis: zakat {AMIL_LIMIT.zakat}%, infak{' '}
          {AMIL_LIMIT.infak}%.
        </p>
        <div className="zo-sim-actions">
          {(['zakat', 'infak'] as const).map((fund) => (
            <button key={fund} className="zo-btn" disabled={busy} onClick={() => onAct({ type: 'receive', id: d.id, fund })}>
              Pos {fund} · amil {rupiah(amilShare(d.nominal, fund))}
            </button>
          ))}
        </div>
      </>
    );
  }
  if (station === 'penyaluran') {
    const r = view.requests[0];
    if (!r) return <p>Belum ada mustahik yang mengajukan.</p>;
    return (
      <>
        <Steps stage="petugas" />
        <dl>
          <Row label="Mustahik" value={r.name} />
          <Row label="Kategori" value={r.asnaf} warn={!ASNAF.includes(r.asnaf)} />
          <Row label="Data mustahik" value={r.registered ? 'Terdaftar' : 'Belum terdaftar'} warn={!r.registered} />
          <Row label="Berkas bukti" value={r.evidence ? 'Dilampirkan' : 'Tidak ada'} warn={!r.evidence} />
          <Row label="Nominal" value={rupiah(r.nominal)} warn={r.nominal > view.funds.zakat} />
          <Row label="Saldo pos zakat" value={rupiah(view.funds.zakat)} />
        </dl>
        <p className="zo-sim-hint">Buat draf hanya jika semua baris di atas memenuhi syarat.</p>
        <Choice
          busy={busy}
          no="Tolak"
          yes="Buat draf"
          onNo={() => onAct({ type: 'distribute', id: r.id, choice: 'reject' })}
          onYes={() => onAct({ type: 'distribute', id: r.id, choice: 'draft' })}
        />
      </>
    );
  }
  if (station === 'saksi') {
    const c = view.cases.find((x) => x.stage === 'saksi' && !x.witnesses.some((w) => w.id === view.me.id));
    if (!c) return <p>Tidak ada draf yang menunggu kesaksianmu.</p>;
    return (
      <>
        <Steps stage="saksi" />
        <dl>
          <Row label="Penerima" value={`${c.name} · ${c.asnaf}`} />
          <Row label="Nominal draf" value={rupiah(c.nominal)} />
          <Row label="Nominal tanda terima" value={rupiah(c.receiptNominal)} warn={c.receiptNominal !== c.nominal} />
          <Row label="Tanda tangan penerima" value={c.signed ? 'Ada' : 'Tidak ada'} warn={!c.signed} />
          <Row label="Saksi" value={`${c.witnesses.length}/${WITNESSES_NEEDED}${c.witnesses.length ? ' · ' + c.witnesses.map((w) => w.nama).join(', ') : ''}`} />
        </dl>
        <Choice
          busy={busy}
          no="Tolak bukti"
          yes="Konfirmasi"
          onNo={() => onAct({ type: 'witness', id: c.id, choice: 'reject' })}
          onYes={() => onAct({ type: 'witness', id: c.id, choice: 'confirm' })}
        />
      </>
    );
  }
  if (station === 'persetujuan') {
    const c = view.cases.find((x) => x.stage === 'persetujuan');
    if (!c) return <p>Tidak ada berkas yang menunggu persetujuan.</p>;
    return (
      <>
        <Steps stage="persetujuan" />
        <dl>
          <Row label="Penerima" value={`${c.name} · ${c.asnaf}`} />
          <Row label="Nominal draf" value={rupiah(c.nominal)} />
          <Row label="Nominal saat konfirmasi" value={rupiah(c.confirmedNominal)} warn={c.confirmedNominal !== c.nominal} />
          <Row label="Saksi" value={c.witnesses.map((w) => w.nama).join(' & ')} />
          <Row label="Pembuat draf" value={c.maker.nama} />
        </dl>
        <Choice
          busy={busy}
          no="Kembalikan"
          yes="Setujui"
          onNo={() => onAct({ type: 'approve', id: c.id, choice: 'return' })}
          onYes={() => onAct({ type: 'approve', id: c.id, choice: 'approve' })}
        />
      </>
    );
  }
  return null;
}

const STAGE_LABEL: Record<Case['stage'], string> = {
  saksi: 'Menunggu saksi',
  persetujuan: 'Menunggu persetujuan',
  terbit: 'Terbit',
  ditolak: 'Ditolak saksi',
  dikembalikan: 'Dikembalikan',
};

/** One report entry; opening it shows who did what, in order. */
export function CaseReport({ c }: { c: Case }) {
  return (
    <details className="zo-sim-report">
      <summary>
        <span>
          <strong>{c.name}</strong>
          <small>
            {c.asnaf} · {rupiah(c.nominal)}
          </small>
        </span>
        <em data-stage={c.stage}>{STAGE_LABEL[c.stage]}</em>
      </summary>
      <Steps stage={c.stage} />
      <ol className="zo-sim-history">
        {c.history.map((h, i) => (
          <li key={i} className={h.ok ? '' : 'bad'}>
            <time>{when(h.at)}</time> {h.action} · <b>{h.actor}</b>
          </li>
        ))}
      </ol>
      {c.code && (
        <p className="zo-sim-hash">
          Kode <code>{c.code}</code> · hash <code>{c.hash?.slice(0, 16)}…</code>
        </p>
      )}
    </details>
  );
}
function ReceiptReport({ r }: { r: Receipt }) {
  return (
    <li className="zo-sim-receipt">
      <span>
        <strong>{r.name}</strong>
        <small>
          {r.jenis} · pos {r.fund} · oleh {r.by}
        </small>
      </span>
      <span>
        <b>{rupiah(r.nominal)}</b>
        <small>{when(r.at)}</small>
      </span>
    </li>
  );
}

export function DeskReport({ view, station }: { view: SimView; station: StationId }) {
  const items = deskReport(view, station);
  if (!items.length) return <p className="zo-sim-hint">Belum ada laporan di meja ini.</p>;
  return station === 'penerimaan' ? (
    <ul className="zo-sim-reports">
      {(items as Receipt[]).slice(0, 25).map((r) => (
        <ReceiptReport key={r.id} r={r} />
      ))}
    </ul>
  ) : (
    <div className="zo-sim-reports">
      {(items as Case[]).slice(0, 25).map((c) => (
        <CaseReport key={c.id} c={c} />
      ))}
    </div>
  );
}

export default function StationPanel({
  view,
  station,
  busy,
  onAct,
  onClose,
}: {
  view: SimView;
  station: StationId;
  busy: boolean;
  onAct: (a: SimAction) => void;
  onClose: () => void;
}) {
  const info = STATIONS.find((s) => s.id === station)!,
    owner = STATION_ROLE[station],
    mine = owner === view.me.role;
  const [tab, setTab] = useState<'task' | 'report'>(mine ? 'task' : 'report');
  return (
    <section className="zo-sim-panel" role="dialog" aria-labelledby="zo-sim-panel-title">
      <header>
        <div>
          <p className="zo-eyebrow">{owner ? ROLE_LABEL[owner] : 'Laporan bersama'}</p>
          <h2 id="zo-sim-panel-title">{info.title}</h2>
        </div>
        <button className="zo-icon" aria-label="Tutup" onClick={onClose}>
          <X size={18} />
        </button>
      </header>
      {mine && (
        <div className="zo-segment" role="group" aria-label="Isi meja">
          <button aria-pressed={tab === 'task'} onClick={() => setTab('task')}>
            Tugas saya
          </button>
          <button aria-pressed={tab === 'report'} onClick={() => setTab('report')}>
            <Eye size={14} /> Laporan
          </button>
        </div>
      )}
      {!mine && (
        <p className="zo-sim-note">
          <Lock size={14} /> {owner ? `Meja ini dikerjakan ${ROLE_LABEL[owner].toLowerCase()}.` : 'Catatan terbit otomatis.'}{' '}
          Kamu bisa membaca laporannya.
        </p>
      )}
      {mine && tab === 'task' ? (
        <Task view={view} station={station} busy={busy} onAct={onAct} />
      ) : (
        <DeskReport view={view} station={station} />
      )}
    </section>
  );
}
