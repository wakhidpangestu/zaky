'use client';
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  ArrowRight,
  RotateCcw,
  Maximize2,
  ClipboardList,
  Wrench,
  MessageSquare,
  Monitor,
} from 'lucide-react';
import { STATIONS, WORK_TOOLS, type StationId, type OfficeUser } from '@/lib/office/model';
import OfficeScene from './scene';
import WorkPanel from './work-panel';
import TeamChat from './team-chat';
import WorkQueue from './work-queue';
import TeamPresence from './team-presence';
import type { OfficeData } from './use-office-data';
export default function OfficeView({
  user,
  data,
  onExit,
}: {
  user: OfficeUser;
  data: OfficeData & { refresh: () => void };
  onExit: () => void;
}) {
  const [selected, setSelected] = useState<StationId>('penerimaan'),
    [tab, setTab] = useState<'tasks' | 'tools' | 'team'>('tasks');
  const [panel, setPanel] = useState<{ path: string; title: string } | null>(null);
  const [reset, setReset] = useState(0),
    [failed, setFailed] = useState(false),
    [notice, setNotice] = useState('');
  const root = useRef<HTMLDivElement>(null),
    station = STATIONS.find((s) => s.id === selected)!;
  const counts = useMemo(
    () =>
      Object.fromEntries(
        STATIONS.map((s) => [
          s.id,
          data.tasks.filter((t) => t.station === s.id && !t.terminal).length,
        ]),
      ) as Record<StationId, number>,
    [data.tasks],
  );
  const select = useCallback((id: StationId) => {
    setSelected(id);
    setTab('tasks');
  }, []);
  const setStation = data.workflow.setStation;
  useEffect(() => {
    setStation(selected);
    return () => setStation(null);
  }, [selected, setStation]);
  const fail = useCallback(() => setFailed(true), []);
  function open(path: string, title: string) {
    setPanel({ path, title });
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {
      setNotice('Layar penuh tidak tersedia. Kantor tetap dapat digunakan.');
    }
  }
  const role = data.workflow.snapshot?.actor.peran ?? user.peran;
  const writable =
    selected === 'persetujuan'
      ? role === 'penyetuju'
      : selected === 'penerimaan' || selected === 'penyaluran'
        ? role === 'amil'
        : true;
  return (
    <div className="zo-office" ref={root}>
      <p className="zo-demo">
        Antrean, bukti, dan formulir memakai catatan lembaga yang sama. Figur 3D menjelaskan peran;
        status online ada di panel Tim.
      </p>
      {data.warning && (
        <p className="zo-notice" role="alert">
          {data.warning}
        </p>
      )}
      {notice && (
        <p className="zo-notice" role="status">
          {notice}
        </p>
      )}
      <div className="zo-room-bar">
        <div>
          <strong>Zaky Virtual Office</strong>
          <span>
            {user.nama} / {user.peran}
          </span>
        </div>
        <div className="zo-room-controls">
          <button
            className="zo-icon"
            aria-label="Reset kamera"
            onClick={() => setReset((v) => v + 1)}
          >
            <RotateCcw size={18} />
          </button>
          <button className="zo-icon" aria-label="Ganti layar penuh" onClick={fullscreen}>
            <Maximize2 size={18} />
          </button>
          <button className="zo-btn zo-btn-secondary" onClick={onExit}>
            <Monitor size={16} /> Standar
          </button>
        </div>
      </div>
      <div className="zo-office-grid">
        <section className="zo-room" aria-label="Kantor virtual">
          {failed ? (
            <div className="zo-webgl-fallback" role="alert">
              <h2>Grafis 3D tidak tersedia</h2>
              <p>
                Gunakan daftar meja di bawah atau kembali ke mode standar. Data pekerjaan tidak
                diubah.
              </p>
              <button className="zo-btn" onClick={onExit}>
                Mode standar
              </button>
            </div>
          ) : (
            <OfficeScene
              selected={selected}
              counts={counts}
              reset={reset}
              tasks={data.workflow.snapshot?.items}
              onTask={(id) => open('/pekerjaan?item=' + id, 'Catatan pekerjaan')}
              onSelect={select}
              onError={fail}
            />
          )}
          <div className="zo-room-caption">
            <span>Klik meja untuk melihat tugas</span>
            <span>Pilih meja di bawah untuk berpindah ruang</span>
          </div>
          <nav className="zo-stations" aria-label="Navigasi meja dengan keyboard">
            {STATIONS.map((s, i) => (
              <button key={s.id} aria-pressed={selected === s.id} onClick={() => select(s.id)}>
                <span className="zo-station-num">{i + 1}</span>
                <span>{s.title.replace('Meja ', '')}</span>
                {counts[s.id] > 0 && (
                  <b aria-label={`${counts[s.id]} tugas aktif`}>{counts[s.id]}</b>
                )}
              </button>
            ))}
          </nav>
        </section>
        <aside className="zo-sidebar">
          <nav className="zo-tabs" aria-label="Panel kantor">
            <button aria-pressed={tab === 'tasks'} onClick={() => setTab('tasks')}>
              <ClipboardList size={16} /> Tugas
            </button>
            <button aria-pressed={tab === 'tools'} onClick={() => setTab('tools')}>
              <Wrench size={16} /> Alat
            </button>
            <button aria-pressed={tab === 'team'} onClick={() => setTab('team')}>
              <MessageSquare size={16} /> Tim
            </button>
          </nav>
          {tab === 'tasks' && (
            <div className="zo-sidebar-body">
              <p className="zo-eyebrow">{station.role}</p>
              <h2>{station.title}</h2>
              <p>{station.description}</p>
              <button
                className="zo-btn"
                disabled={!writable}
                onClick={() => open(station.path, station.title)}
              >
                Buka alat kerja <ArrowRight size={16} />
              </button>
              {!writable && <small>Peran akun tidak sesuai tindakan di meja ini.</small>}
              <WorkQueue workflow={data.workflow} station={selected} onOpen={open} />
            </div>
          )}
          {tab === 'tools' && (
            <div className="zo-sidebar-body">
              <p className="zo-eyebrow">ALAT KERJA</p>
              <h2>Semua menu, tetap dekat.</h2>
              <p>Alat yang sama dengan dashboard standar. Tidak ada saldo kedua.</p>
              <div className="zo-tool-list">
                {WORK_TOOLS.map((t) => (
                  <button key={t.path} onClick={() => open(t.path, t.label)}>
                    {t.label}
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
              <button className="zo-text-button" onClick={data.refresh}>
                Segarkan data
              </button>
            </div>
          )}
          {tab === 'team' && (
            <div>
              <TeamPresence workflow={data.workflow} />
              <TeamChat />
            </div>
          )}
        </aside>
      </div>
      {panel && (
        <WorkPanel
          key={panel.path}
          workflow={data.workflow}
          onNavigate={open}
          path={panel.path}
          title={panel.title}
          onClose={() => setPanel(null)}
          onRefresh={data.refresh}
        />
      )}
    </div>
  );
}
