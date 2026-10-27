'use client';
import { useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { isAllowedWorkPath } from '@/lib/office/model';
export default function WorkPanel({path,title,onClose,onRefresh}:{path:string;title:string;onClose:()=>void;onRefresh:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const allowed=isAllowedWorkPath(path);
  useEffect(()=>{if(allowed&&dialog.current&&!dialog.current.open)dialog.current.showModal();},[allowed]);
  function close(){if(window.confirm('Tutup panel kerja? Isian yang belum disimpan dapat hilang.')){onRefresh();onClose();}}
  if(!allowed)return <p role="alert">Alat kerja tidak dikenali.</p>;
  return <dialog ref={dialog} className="zo-dialog" aria-labelledby="zo-tool-title" onCancel={e=>{e.preventDefault();close();}}>
    <header><h2 id="zo-tool-title">{title}</h2><a href={path} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Halaman penuh</a><button className="zo-icon" aria-label="Tutup panel kerja" onClick={close}><X/></button></header>
    <p className="zo-panel-hint">Form asli Zaky. Menutup panel tidak menyimpan atau menyelesaikan tugas.</p>
    <iframe title={title} src={path} onLoad={onRefresh}/><footer>Gunakan data simulasi. Jangan masukkan data pribadi nyata.</footer>
  </dialog>;
}
