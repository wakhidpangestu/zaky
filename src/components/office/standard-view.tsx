'use client';
import Link from 'next/link';
import { useState } from 'react';
import TeamChat from './team-chat';
import WorkQueue from './work-queue';
import TeamPresence from './team-presence';
import { WORK_TOOLS, type OfficeUser } from '@/lib/office/model';
import { formatRupiah } from '@/lib/format';
import type { OfficeData } from './use-office-data';
export default function StandardView({data}:{data:OfficeData;user:OfficeUser}) {
  const [chat,setChat]=useState(false);
  const total=(key:'totalMasuk'|'saldoTersedia'|'saldoDicadangkan'|'totalTersalurkan')=>data.funds.reduce((sum,r)=>sum+r[key],0);
  return <div className="zo-standard"><p className="zo-demo">Saldo dan formulir lama memakai simulasi browser. Antrean pekerjaan bersama dan presence memakai database bila layanan diaktifkan.</p>
    {data.warning && <p className="zo-notice" role="alert">{data.warning}</p>}
    <nav className="zo-tools" aria-label="Alat kerja standar">{WORK_TOOLS.map(t=><Link key={t.path} href={t.path}>{t.label}</Link>)}</nav>
    <div className="zo-metrics">{([['totalMasuk','Total masuk'],['saldoTersedia','Tersedia'],['saldoDicadangkan','Dicadangkan'],['totalTersalurkan','Tersalurkan']] as const).map(([key,label])=><article key={key}><p>{label}</p><strong>{data.ready?formatRupiah(total(key)):'Memuat...'}</strong></article>)}</div>
    <div className="zo-standard-grid"><section className="zo-card"><h2>Pos dana</h2>{data.funds.map(f=><article className="zo-fund" key={f.id}><h3>{f.nama}</h3><dl><dt>Tersedia</dt><dd>{formatRupiah(f.saldoTersedia)}</dd><dt>Dicadangkan</dt><dd>{formatRupiah(f.saldoDicadangkan)}</dd><dt>Tersalurkan</dt><dd>{formatRupiah(f.totalTersalurkan)}</dd></dl>
      {Math.abs(f.totalMasuk-f.saldoTersedia-f.saldoDicadangkan-f.totalTersalurkan)>.01 && <p role="alert" className="zo-notice">Saldo simulasi tidak seimbang. Periksa catatan.</p>}</article>)}<Link href="/penerimaan/buat" className="zo-btn">Catat penerimaan</Link></section>
    <section className="zo-card"><h2>Antrean pekerjaan</h2><WorkQueue workflow={data.workflow}/><Link href="/penyaluran/buat" className="zo-btn">Buat penyaluran simulasi</Link></section></div>
    <section className="zo-card" style={{marginTop:20}}><button className="zo-btn zo-btn-secondary" aria-expanded={chat} onClick={()=>setChat(v=>!v)}>Koordinasi tim {chat?'(tutup)':'(buka)'}</button><TeamPresence workflow={data.workflow}/>{chat&&<TeamChat/>}</section>
  </div>;
}
