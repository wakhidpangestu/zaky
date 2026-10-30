'use client';
import { useEffect, useState, useSyncExternalStore, Component, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Boxes, LayoutDashboard, ArrowRight } from 'lucide-react';
import { parseMode, type ViewMode, type OfficeUser } from '@/lib/office/model';
import { isEmbedded } from '@/lib/office/embed';
import StandardView from './standard-view';
import './office.css';
const SimulatorView = dynamic(() => import('./simulator-view'), {
  ssr:false, loading:()=> <p className="zo-loading" role="status">Menyiapkan Zaky Simulator...</p>,
});
class ViewBoundary extends Component<{children:ReactNode;onExit:()=>void},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed ? <div className="zo-notice" role="alert">Zaky Simulator tidak dapat dimuat. Pekerjaan tetap tersedia.<button className="zo-btn" onClick={this.props.onExit}>Gunakan mode standar</button></div>:this.props.children;}
}
const noop=()=>()=>{};
export default function OfficeGateway({user}:{user:OfficeUser}) {
  const [mode,setMode]=useState<ViewMode|null>(null),[ready,setReady]=useState(false),[warning,setWarning]=useState('');
  const embedded=useSyncExternalStore(noop,isEmbedded,()=>false);
  const key=`zaky_office_mode_v1:${user.userId ?? user.email ?? 'anonymous'}`;
  useEffect(()=>{
    try {
      // The saved mode lives in browser storage, readable only after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode(isEmbedded() ? 'standard' : parseMode(new URLSearchParams(window.location.search).get('mode')) ?? parseMode(localStorage.getItem(key)) ?? (localStorage.getItem('zaky_pref_gamemode')==='true' ? '3d' : 'standard'));
    } catch {setWarning('Pilihan mode tidak disimpan karena penyimpanan browser dibatasi.');}
    setReady(true);
  },[key]);
  function choose(next:ViewMode){setMode(next);try{localStorage.setItem(key,next);}catch{setWarning('Pilihan mode hanya berlaku pada sesi ini.');}}
  if(!ready)return <div className="zo-loading" role="status">Memuat pilihan ruang kerja...</div>;
  return <section className="zaky-office">
    <header className="zo-page-heading"><div><p className="zo-eyebrow">ZAKY / RUANG KERJA</p><h1>{mode==='3d'?'Zaky Simulator':'Selamat bekerja, '+user.nama}</h1><p>{mode==='3d'?'Kerjakan tugas nyata lembaga sambil berjalan di kantor. Data realtime.':'Antrean, saldo, dan catatan lembaga hari ini.'}</p></div>
      {mode && !embedded && <div className="zo-segment" aria-label="Pilihan tampilan"><button aria-pressed={mode==='standard'} onClick={()=>choose('standard')}><LayoutDashboard size={17}/> Standar</button><button aria-pressed={mode==='3d'} onClick={()=>choose('3d')}><Boxes size={17}/> Simulator</button></div>}
    </header>
    {warning && <p className="zo-notice" role="status">{warning}</p>}
    {mode === '3d' ? <ViewBoundary onExit={()=>choose('standard')}><SimulatorView user={user} onExit={()=>choose('standard')}/></ViewBoundary>
      : <StandardView user={user} onSimulator={embedded ? undefined : ()=>choose('3d')}/>}
  </section>;
}
