'use client';
import { useEffect, useState, Component, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Boxes, LayoutDashboard, ArrowRight } from 'lucide-react';
import { parseMode, type ViewMode, type OfficeUser } from '@/lib/office/model';
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
export default function OfficeGateway({user}:{user:OfficeUser}) {
  const [mode,setMode]=useState<ViewMode|null>(null),[ready,setReady]=useState(false),[warning,setWarning]=useState('');
  const [embedded,setEmbedded]=useState(false);
  const key=`zaky_office_mode_v1:${user.userId ?? user.email ?? 'anonymous'}`;
  useEffect(()=>{
    try {
      if(window.parent!==window && window.parent.location.origin===window.location.origin){setEmbedded(true);setMode('standard');setReady(true);return;}
      setMode(parseMode(new URLSearchParams(window.location.search).get('mode')) ?? parseMode(localStorage.getItem(key)));
    } catch {setWarning('Pilihan mode tidak disimpan karena penyimpanan browser dibatasi.');}
    setReady(true);
  },[key]);
  function choose(next:ViewMode){setMode(next);try{localStorage.setItem(key,next);}catch{setWarning('Pilihan mode hanya berlaku pada sesi ini.');}}
  if(!ready)return <div className="zo-loading" role="status">Memuat pilihan ruang kerja...</div>;
  return <section className="zaky-office">
    <header className="zo-page-heading"><div><p className="zo-eyebrow">ZAKY / RUANG KERJA</p><h1>{mode==='3d'?'Zaky Simulator':'Selamat bekerja, '+user.nama}</h1><p>{mode==='3d'?'Latihan alur amanah dengan data simulasi.':'Pekerjaan nyata ada di mode standar.'}</p></div>
      {mode && !embedded && <div className="zo-segment" aria-label="Pilihan tampilan"><button aria-pressed={mode==='standard'} onClick={()=>choose('standard')}><LayoutDashboard size={17}/> Standar</button><button aria-pressed={mode==='3d'} onClick={()=>choose('3d')}><Boxes size={17}/> Simulator</button></div>}
    </header>
    {warning && <p className="zo-notice" role="status">{warning}</p>}
    {!mode ? <div className="zo-choice"><p className="zo-eyebrow">PILIH PENGALAMANMU</p><h2>Mau bekerja atau berlatih?</h2><p>Mode standar memakai catatan lembaga. Simulator memakai data latihan. Kamu bisa berganti kapan saja.</p>
      <div className="zo-choice-grid"><button onClick={()=>choose('standard')}><LayoutDashboard size={38}/><h3>Mode standar</h3><p>Langsung ke formulir, saldo, dan daftar pekerjaan. Tanpa game atau aset 3D.</p><span>Masuk dashboard <ArrowRight size={18}/></span></button>
      <button onClick={()=>choose('3d')}><Boxes size={38}/><h3>Zaky Simulator</h3><p>Jaga lima meja selama satu shift: layani muzakki dan mustahik, pilih saksi, dan jaga skor amanah. Data simulasi, tidak mengubah catatan.</p><span>Mulai main <ArrowRight size={18}/></span></button></div>
      <small>Pilihan disimpan per akun pada browser ini. Skor simulator tidak memengaruhi data atau penilaian kerja.</small></div>
      : mode === '3d' ? <ViewBoundary onExit={()=>choose('standard')}><SimulatorView user={user} onExit={()=>choose('standard')}/></ViewBoundary>
      : <StandardView user={user} onSimulator={embedded ? undefined : ()=>choose('3d')}/>}
  </section>;
}
