'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send, RefreshCw } from 'lucide-react';
interface Message {id:string;nama:string;text:string;createdAt:string}
export default function TeamChat(){
  const [messages,setMessages]=useState<Message[]>([]),[text,setText]=useState(''),[error,setError]=useState('');
  const [available,setAvailable]=useState(false),[sending,setSending]=useState(false),[refresh,setRefresh]=useState(0);
  const pending=useRef<{text:string;clientId:string}|null>(null),sendController=useRef<AbortController|null>(null);
  const alive=useRef(true);
  useEffect(()=>{alive.current=true;return ()=>{alive.current=false;sendController.current?.abort();};},[]);
  useEffect(()=>{
    let disposed=false,timer:ReturnType<typeof setTimeout>|undefined,controller:AbortController|undefined,running=false;
    async function load(){
      if(disposed||document.hidden||running)return;
      running=true;controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),8000);let retry=true;
      try {
        const response=await fetch('/api/office/chat',{cache:'no-store',credentials:'same-origin',signal:controller.signal});const body=await response.json();
        if(!response.ok){retry=response.status!==503&&response.status!==401;throw new Error(body.error||'Chat belum dapat dihubungi.');}
        if(!disposed){setMessages(Array.isArray(body.messages)?body.messages:[]);setAvailable(true);setError('');}
      } catch(e){if(!disposed){setError(e instanceof Error&&e.name!=='AbortError'?e.message:'Koneksi chat terputus. Coba lagi.');setAvailable(false);}}
      finally {clearTimeout(timeout);running=false;if(!disposed&&retry)timer=setTimeout(load,5000);}
    }
    const visible=()=>{if(timer)clearTimeout(timer);void load();};
    void load();document.addEventListener('visibilitychange',visible);
    return ()=>{disposed=true;if(timer)clearTimeout(timer);controller?.abort();document.removeEventListener('visibilitychange',visible);};
  },[refresh]);
  async function send(event:FormEvent){
    event.preventDefault();if(sending||!text.trim()||!available)return;
    setSending(true);setError('');const controller=new AbortController();sendController.current=controller;
    const timeout=setTimeout(()=>controller.abort(),10000);
    try {
      const clean=text.trim();if(pending.current?.text!==clean)pending.current={text:clean,clientId:crypto.randomUUID()};
      const response=await fetch('/api/office/chat',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(pending.current),signal:controller.signal});
      const body=await response.json();if(!response.ok)throw new Error(body.error||'Pesan belum terkirim.');
      if(alive.current){setText('');pending.current=null;setRefresh(v=>v+1);}
    } catch(e){if(alive.current)setError(e instanceof Error&&e.name!=='AbortError'?e.message:'Pesan belum terkonfirmasi. Kirim ulang memakai ID yang sama untuk mencegah duplikasi.');}
    finally{clearTimeout(timeout);if(alive.current)setSending(false);}
  }
  return <section className="zo-sidebar-body zo-chat"><p className="zo-eyebrow">KOORDINASI TIM</p><h2>Ruang percakapan</h2><p>Chat internal lembaga untuk demonstrasi. Bukan persetujuan transaksi atau bukti penerimaan.</p>
    {error&&<div className="zo-notice" role="status">{error}<button className="zo-text-button" onClick={()=>setRefresh(v=>v+1)}><RefreshCw size={14}/> Coba lagi</button></div>}
    <div className="zo-messages" role="log" aria-live="polite" aria-relevant="additions text">{available&&!messages.length?<p>Belum ada pesan. Mulai koordinasi dengan tim.</p>:messages.map(m=><article key={m.id}><header><strong>{m.nama}</strong><time dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</time></header><p>{m.text}</p></article>)}</div>
    <form onSubmit={send}><label htmlFor="zo-message">Pesan untuk tim</label><textarea id="zo-message" value={text} onChange={e=>setText(e.target.value)} maxLength={1000} rows={3} disabled={!available||sending} placeholder={available?'Tulis pesan atau kode pekerjaan...':'Chat menunggu konfigurasi server'}/>
      <div><small>{text.length}/1000</small><button className="zo-btn" disabled={!available||sending||!text.trim()}><Send size={15}/>{sending?'Mengirim...':'Kirim'}</button></div></form>
    <small>Maksimal 60 pesan terakhir. Jangan kirim NIK, nomor rekening, atau data pribadi penerima. Akun demo tidak menjamin kerahasiaan.</small>
  </section>;
}
