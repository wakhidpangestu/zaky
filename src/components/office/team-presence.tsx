'use client';
import { STATIONS } from '@/lib/office/model';
import type { OfficeWorkflow } from './use-office-workflow';
export default function TeamPresence({workflow}:{workflow:OfficeWorkflow}){
  const live=workflow.connection==='live',people=live?workflow.snapshot?.presence??[]:[];
  return <section className="zo-presence" aria-label="Kehadiran tim"><h3>Tim di ruang kerja</h3>
    <p>{live?`${people.length} petugas aktif`:'Status online belum dapat dipastikan.'}</p>
    <ul>{people.map(p=><li key={p.userId}><strong>{p.nama}</strong><span>{STATIONS.find(s=>s.id===p.station)?.title??'Ruang kerja standar'}</span></li>)}</ul>
    <small>Aktif berarti ada heartbeat dalam 60 detik terakhir. Banyak tab dihitung satu petugas. Petugas ilustrasi 3D bukan indikator online.</small>
  </section>;
}
