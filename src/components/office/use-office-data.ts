'use client';
import { useCallback, useSyncExternalStore } from 'react';
import { getSavedPosDana, getSavedPenerimaan } from '@/lib/store';
import { type OfficeTask } from '@/lib/office/model';
import { toOfficeTask } from '@/lib/office/workflow';
import { useOfficeWorkflow, type OfficeWorkflow } from './use-office-workflow';
export interface Fund { id:string; nama:string; totalMasuk:number; saldoTersedia:number; saldoDicadangkan:number; totalTersalurkan:number }
export interface OfficeData { tasks:OfficeTask[]; funds:Fund[]; receipts:number; ready:boolean; warning:string; workflow:OfficeWorkflow }
type DemoData=Pick<OfficeData,'funds'|'receipts'|'ready'|'warning'>;
const serverSnapshot:DemoData={funds:[],receipts:0,ready:false,warning:''};
let cached=serverSnapshot,cachedKey='';
function validFund(value:unknown):value is Fund {
  if(!value||typeof value!=='object')return false;
  const r=value as Record<string,unknown>;
  return typeof r.id==='string'&&typeof r.nama==='string'&&['totalMasuk','saldoTersedia','saldoDicadangkan','totalTersalurkan'].every(k=>typeof r[k]==='number'&&Number.isFinite(r[k])&&(r[k] as number)>=0);
}
function demoSnapshot():DemoData {
  let next:DemoData;
  try {
    const rawFunds:unknown=getSavedPosDana(),receipts:unknown=getSavedPenerimaan();
    const funds=Array.isArray(rawFunds)?rawFunds.filter(validFund):[];
    next={funds,receipts:Array.isArray(receipts)?receipts.length:0,ready:true,warning:!Array.isArray(rawFunds)||funds.length!==rawFunds.length?'Sebagian data browser tidak valid. Periksa mode standar.':''};
  }catch{next={funds:[],receipts:0,ready:true,warning:'Data simulasi browser tidak dapat dibaca.'};}
  const key=JSON.stringify(next);if(key!==cachedKey){cachedKey=key;cached=next;}return cached;
}
function subscribe(listener:()=>void){
  for(const event of ['zaky_store_updated','storage','focus'])window.addEventListener(event,listener);
  return ()=>{for(const event of ['zaky_store_updated','storage','focus'])window.removeEventListener(event,listener);};
}
export function useOfficeData():OfficeData&{refresh:()=>void}{
  const workflow=useOfficeWorkflow();
  const data=useSyncExternalStore(subscribe,demoSnapshot,()=>serverSnapshot);
  const refreshWorkflow=workflow.refresh;
  const refresh=useCallback(()=>{window.dispatchEvent(new Event('zaky_store_updated'));void refreshWorkflow();},[refreshWorkflow]);
  return {...data,tasks:workflow.snapshot?.items.map(toOfficeTask)??[],workflow,refresh};
}
