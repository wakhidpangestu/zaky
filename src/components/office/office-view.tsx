'use client';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowRight, RotateCcw, Maximize2, ClipboardList, Wrench, MessageSquare, Monitor, X } from 'lucide-react';
import { STATIONS, WORK_TOOLS, assignedTo, taskProgress, type StationId, type OfficeUser } from '@/lib/office/model';
import { formatRupiah } from '@/lib/format';
import OfficeScene from './scene';
import WorkPanel from './work-panel';
import TeamChat from './team-chat';
import type { OfficeData } from './use-office-data';
export default function OfficeView({user,data,onExit}:{user:OfficeUser;data:OfficeData&{refresh:()=>void};onExit:()=>void}){
  const [selected,setSelected]=useState<StationId>('penerimaan'),[tab,setTab]=useState<'tasks'|'tools'|'team'>('tasks');
  const [mine,setMine]=useState(false),[taskId,setTaskId]=useState<string|null>(null),[panel,setPanel]=useState<{path:string;title:string}|null>(null);
  const [reset,setReset]=useState(0),[failed,setFailed]=useState(false),[notice,setNotice]=useState('');
  const root=useRef<HTMLDivElement>(null), station=STATIONS.find(s=>s.id===selected)!;
  const counts=useMemo(()=>Object.fromEntries(STATIONS.map(s=>[s.id,data.tasks.filter(t=>t.station===s.id&&!t.terminal).length])) as Record<StationId,number>,[data.tasks]);
  const tasks=data.tasks.filter(t=>t.station===selected&&(!mine||assignedTo(t,user))),current=data.tasks.find(t=>t.id===taskId);
  const select=useCallback((id:StationId)=>{setSelected(id);setTab('tasks');setTaskId(null);},[]);
  const fail=useCallback(()=>setFailed(true),[]);
  function open(path:string,title:string){setPanel({path,title});}
  async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await root.current?.requestFullscreen();}catch{setNotice('Layar penuh tidak tersedia. Kantor tetap dapat digunakan.');}}
  const writable=selected==='persetujuan'?user.peran==='penyetuju':selected==='penerimaan'||selected==='penyaluran'?user.peran==='amil':true;
  return <div className="zo-office" ref={root}>
    <p className="zo-demo">Transaksi: simulasi browser. Petugas 3D adalah ilustrasi peran, bukan indikator pengguna online.</p>
    {data.warning&&<p className="zo-notice" role="alert">{data.warning}</p>}{notice&&<p className="zo-notice" role="status">{notice}</p>}
    <div className="zo-room-bar"><div><strong>Zaky Virtual Office</strong><span>{user.nama} / {user.peran}</span></div><div className="zo-room-controls"><button className="zo-icon" aria-label="Reset kamera" onClick={()=>setReset(v=>v+1)}><RotateCcw size={18}/></button><button className="zo-icon" aria-label="Ganti layar penuh" onClick={fullscreen}><Maximize2 size={18}/></button><button className="zo-btn zo-btn-secondary" onClick={onExit}><Monitor size={16}/> Standar</button></div></div>
    <div className="zo-office-grid"><section className="zo-room" aria-label="Kantor virtual">
      {failed?<div className="zo-webgl-fallback" role="alert"><h2>Grafis 3D tidak tersedia</h2><p>Gunakan daftar meja di bawah atau kembali ke mode standar. Data pekerjaan tidak diubah.</p><button className="zo-btn" onClick={onExit}>Mode standar</button></div>:<OfficeScene selected={selected} counts={counts} reset={reset} onSelect={select} onError={fail}/>}
      <div className="zo-room-caption"><span>Klik meja untuk melihat tugas</span><span>Geser: putar / Gulir atau cubit: zoom</span></div>
      <nav className="zo-stations" aria-label="Navigasi meja dengan keyboard">{STATIONS.map((s,i)=><button key={s.id} aria-pressed={selected===s.id} onClick={()=>select(s.id)}><span className="zo-station-num">{i+1}</span><span>{s.title.replace('Meja ','')}</span>{counts[s.id]>0&&<b aria-label={`${counts[s.id]} tugas aktif`}>{counts[s.id]}</b>}</button>)}</nav>
    </section><aside className="zo-sidebar"><nav className="zo-tabs" aria-label="Panel kantor"><button aria-pressed={tab==='tasks'} onClick={()=>setTab('tasks')}><ClipboardList size={16}/> Tugas</button><button aria-pressed={tab==='tools'} onClick={()=>setTab('tools')}><Wrench size={16}/> Alat</button><button aria-pressed={tab==='team'} onClick={()=>setTab('team')}><MessageSquare size={16}/> Tim</button></nav>
      {tab==='tasks'&&<div className="zo-sidebar-body"><p className="zo-eyebrow">{station.role}</p><h2>{station.title}</h2><p>{station.description}</p>
        <button className="zo-btn" disabled={!writable} onClick={()=>open(station.path,station.title)}>Buka alat kerja <ArrowRight size={16}/></button>{!writable&&<small>Peran akun tidak sesuai tindakan di meja ini.</small>}
        <label className="zo-filter"><input type="checkbox" checked={mine} onChange={e=>setMine(e.target.checked)}/> Hanya tugas saya</label>
        {mine&&!user.unitName&&<small>Unit akun belum dipetakan. Gunakan semua tugas; filter tidak memberikan kewenangan transaksi.</small>}
        <div className="zo-task-list" aria-live="polite">{!data.ready?<p>Memuat antrean...</p>:tasks.length===0?<div className="zo-empty"><ClipboardList size={26}/><strong>Meja ini sedang kosong</strong><p>{selected==='penerimaan'?`${data.receipts} penerimaan tercatat. Buka formulir untuk mencatat zakat masuk.`:'Tidak ada pekerjaan sesuai filter.'}</p></div>:tasks.map(t=><button className={'zo-task'+(taskId===t.id?' zo-task-selected':'')} key={t.id} onClick={()=>setTaskId(t.id)}><strong>{t.code}</strong><span>{t.destination||'Tujuan belum tersedia'}</span><span>{formatRupiah(t.amount)}</span><small>{t.label}{assignedTo(t,user)?' / Tugas saya':''}</small></button>)}</div>
        {current&&<section className="zo-task-detail"><header><h3>Alur {current.code}</h3><button className="zo-icon" aria-label="Tutup rincian tugas" onClick={()=>setTaskId(null)}><X size={15}/></button></header><progress max="100" value={taskProgress(current.status)} aria-label="Tahap proses"/><p>{current.label}</p><ol><li>Draf dan reservasi dana</li><li>{current.method==='saksi'?'Konfirmasi dua saksi':'Konfirmasi mustahik'}</li><li>Persetujuan unit independen</li><li>Tercatat sebagai tersalurkan</li></ol>
          {current.terminal&&!current.done&&<p className="zo-notice">Proses berakhir tanpa dinyatakan tersalurkan.</p>}<small>Cari kode <strong>{current.code}</strong> pada daftar di panel kerja.</small><button className="zo-btn zo-btn-secondary" onClick={()=>open(current.path,`Pekerjaan ${current.code}`)}>Buka record di daftar</button><button className="zo-text-button" onClick={()=>{select(current.station);setTaskId(current.id);}}>Lihat meja penanganan saat ini</button></section>}
      </div>}
      {tab==='tools'&&<div className="zo-sidebar-body"><p className="zo-eyebrow">ALAT KERJA</p><h2>Semua menu, tetap dekat.</h2><p>Alat yang sama dengan dashboard standar. Tidak ada saldo kedua.</p><div className="zo-tool-list">{WORK_TOOLS.map(t=><button key={t.path} onClick={()=>open(t.path,t.label)}>{t.label}<ArrowRight size={16}/></button>)}</div><button className="zo-text-button" onClick={data.refresh}>Segarkan data browser</button></div>}
      {tab==='team'&&<TeamChat/>}
    </aside></div>
    {panel&&<WorkPanel path={panel.path} title={panel.title} onClose={()=>setPanel(null)} onRefresh={data.refresh}/>}
  </div>;
}
