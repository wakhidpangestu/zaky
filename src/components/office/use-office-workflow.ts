'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { WorkflowSnapshot, AssignmentInput } from '@/lib/office/workflow';
import type { StationId } from '@/lib/office/model';

export function useOfficeWorkflow(){
  const [snapshot,setSnapshot]=useState<WorkflowSnapshot|null>(null),[connection,setConnection]=useState<'loading'|'live'|'reconnecting'|'unavailable'|'paused'>('loading');
  const [error,setError]=useState(''),[sending,setSending]=useState(false),[revision,setRevision]=useState(0);
  const station=useRef<StationId|null>(null),sessionId=useRef<string|null>(null),alive=useRef(false);
  const pending=useRef<{key:string;input:AssignmentInput}|null>(null),busy=useRef(false);
  const refresh=useCallback(async()=>{
    try {
      const response=await fetch('/api/office/work-items',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(8000)});
      const body=await response.json();
      if(!response.ok)throw new Error(body.error||'Antrean tidak dapat dimuat.');
      if(alive.current){setSnapshot(body);setError('');}return true;
    }catch(e){if(alive.current){setError(e instanceof Error?e.message:'Koneksi terputus.');setConnection('unavailable');}return false;}
  },[]);
  useEffect(()=>{
    alive.current=true;sessionId.current=crypto.randomUUID();
    return ()=>{alive.current=false;};
  },[]);
  useEffect(()=>{
    let disposed=false,stream:EventSource|undefined,opening=false;
    async function connect(){
      if(disposed||opening||document.hidden||!navigator.onLine)return;
      opening=true;stream?.close();setConnection('loading');
      const ok=await refresh();opening=false;if(disposed||!ok||document.hidden||!navigator.onLine)return;
      stream=new EventSource('/api/office/stream');
      stream.addEventListener('snapshot',event=>{
        if(disposed)return;
        try{setSnapshot(JSON.parse((event as MessageEvent).data));setConnection('live');setError('');}catch{setConnection('reconnecting');}
      });
      stream.addEventListener('unavailable',()=>{stream?.close();setConnection('unavailable');void refresh();});
      stream.onerror=()=>{if(!disposed)setConnection('reconnecting');};
    }
    const resume=()=>{if(document.hidden||!navigator.onLine){stream?.close();setConnection('paused');}else void connect();};
    void connect();document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);window.addEventListener('offline',resume);
    return ()=>{disposed=true;stream?.close();document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume);window.removeEventListener('offline',resume);};
  },[refresh,revision]);
  const actorId=snapshot?.actor.id;
  useEffect(()=>{
    if(!actorId)return;
    let disposed=false,controller:AbortController|undefined;
    const payload=()=>JSON.stringify({sessionId:sessionId.current,station:station.current});
    const leave=()=>{if(sessionId.current)void fetch('/api/office/presence',{method:'DELETE',headers:{'Content-Type':'application/json'},body:payload(),keepalive:true}).catch(()=>{});};
    async function heartbeat(){
      if(disposed)return;
      if(document.hidden||!navigator.onLine){leave();return;}
      controller?.abort();controller=new AbortController();
      const timer=setTimeout(()=>controller?.abort(),8000);
      try{
        const response=await fetch('/api/office/presence',{method:'POST',headers:{'Content-Type':'application/json'},body:payload(),signal:controller.signal});
        if(!response.ok&&!disposed){const body=await response.json();setError(body.error||'Presence tidak dapat diperbarui.');}
      }catch{if(!disposed)setConnection('reconnecting');}finally{clearTimeout(timer);}
    }
    void heartbeat();const timer=setInterval(heartbeat,20000);
    document.addEventListener('visibilitychange',heartbeat);window.addEventListener('pagehide',leave);
    return ()=>{disposed=true;clearInterval(timer);controller?.abort();leave();document.removeEventListener('visibilitychange',heartbeat);window.removeEventListener('pagehide',leave);};
  },[actorId]);
  const mutate=useCallback(async(itemId:string,version:number,action:AssignmentInput['action'],targetUserId:string|null=null,reason='')=>{
    if(busy.current)return;
    busy.current=true;setSending(true);setError('');
    const key=JSON.stringify({itemId,version,action,targetUserId,reason});
    if(pending.current?.key!==key)pending.current={key,input:{itemId,version,action,targetUserId,reason,requestId:crypto.randomUUID()}};
    try {
      const response=await fetch('/api/office/work-items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pending.current.input),signal:AbortSignal.timeout(10000)});
      const body=await response.json();
      if(!response.ok){if(response.status<500)pending.current=null;await refresh();throw new Error(body.error||'Tindakan belum tersimpan.');}
      pending.current=null;await refresh();
    }catch(e){if(alive.current)setError(e instanceof Error?e.message:'Hasil belum terkonfirmasi. Ulangi tindakan yang sama untuk memeriksa penyimpanan.');}
    finally{busy.current=false;if(alive.current)setSending(false);}
  },[refresh]);
  const setStation=useCallback((value:StationId|null)=>{station.current=value;},[]);
  return {snapshot,connection,error,sending,refresh,mutate,reconnect:()=>setRevision(n=>n+1),setStation};
}
export type OfficeWorkflow=ReturnType<typeof useOfficeWorkflow>;
