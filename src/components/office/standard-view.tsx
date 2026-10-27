'use client';
import Link from 'next/link';
import { useState } from 'react';
import TeamChat from './team-chat';
import { WORK_TOOLS, assignedTo, type OfficeUser } from '@/lib/office/model';
import { formatRupiah } from '@/lib/format';
import type { OfficeData } from './use-office-data';
export default function StandardView({data,user}:{data:OfficeData;user:OfficeUser}) {
  const [chat,setChat]=useState(false);
  const total=(key:'totalMasuk'|'saldoTersedia'|'saldoDicadangkan'|'totalTersalurkan')=>data.funds.reduce((sum,r)=>sum+r[key],0);
  return <div className="zo-standard"><p className="zo-demo">Prototipe: transaksi simulasi dari browser ini, bukan saldo bank atau transaksi antarperangkat.</p>
    {data.warning && <p className="zo-notice" role="alert">{data.warning}</p>}
    <nav className="zo-tools" aria-label="Alat kerja standar">{WORK_TOOLS.map(t=><Link key={t.path} href={t.path}>{t.label}</Link>)}</nav>
    <div className="zo-metrics">{([['totalMasuk','Total masuk'],['saldoTersedia','Tersedia'],['saldoDicadangkan','Dicadangkan'],['totalTersalurkan','Tersalurkan']] as const).map(([key,label])=><article key={key}><p>{label}</p><strong>{data.ready?formatRupiah(total(key)):'Memuat...'}</strong></article>)}</div>
    <div className="zo-standard-grid"><section className="zo-card"><h2>Pos dana</h2>{data.funds.map(f=><article className="zo-fund" key={f.id}><h3>{f.nama}</h3><dl><dt>Tersedia</dt><dd>{formatRupiah(f.saldoTersedia)}</dd><dt>Dicadangkan</dt><dd>{formatRupiah(f.saldoDicadangkan)}</dd><dt>Tersalurkan</dt><dd>{formatRupiah(f.totalTersalurkan)}</dd></dl>
      {Math.abs(f.totalMasuk-f.saldoTersedia-f.saldoDicadangkan-f.totalTersalurkan)>.01 && <p role="alert" className="zo-notice">Saldo simulasi tidak seimbang. Periksa catatan.</p>}</article>)}<Link href="/penerimaan/buat" className="zo-btn">Catat penerimaan</Link></section>
    <section className="zo-card"><h2>Antrean pekerjaan</h2><p>{data.tasks.filter(t=>assignedTo(t,user)).length} tugas sesuai akun; {data.tasks.filter(t=>!t.terminal).length} proses aktif.</p><div className="zo-task-list">{data.tasks.map(t=><Link className="zo-task" href={t.path} key={t.id}><strong>{t.code}</strong><span>{t.destination} - {formatRupiah(t.amount)}</span><small>{t.label}</small></Link>)}{data.ready&&!data.tasks.length&&<p>Belum ada penyaluran.</p>}</div><Link href="/penyaluran/buat" className="zo-btn">Buat penyaluran</Link></section></div>
    <section className="zo-card" style={{marginTop:20}}><button className="zo-btn zo-btn-secondary" aria-expanded={chat} onClick={()=>setChat(v=>!v)}>Koordinasi tim {chat?'(tutup)':'(buka)'}</button>{chat&&<TeamChat/>}</section>
  </div>;
}
