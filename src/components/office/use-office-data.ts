'use client';
import { useEffect, useState, useCallback } from 'react';
import { getSavedPenyaluran, getSavedPosDana, getSavedPenerimaan } from '@/lib/store';
import { projectTasks, type OfficeTask } from '@/lib/office/model';
export interface Fund { id:string; nama:string; totalMasuk:number; saldoTersedia:number; saldoDicadangkan:number; totalTersalurkan:number }
export interface OfficeData { tasks:OfficeTask[]; funds:Fund[]; receipts:number; ready:boolean; warning:string }
function validFund(value: unknown): value is Fund {
  if (!value || typeof value!=='object') return false;
  const r=value as Record<string,unknown>;
  return typeof r.id==='string' && typeof r.nama==='string' &&
    ['totalMasuk','saldoTersedia','saldoDicadangkan','totalTersalurkan'].every(k=>typeof r[k]==='number' && Number.isFinite(r[k]) && (r[k] as number)>=0);
}
export function useOfficeData(): OfficeData & { refresh:()=>void } {
  const [data,setData]=useState<OfficeData>({tasks:[],funds:[],receipts:0,ready:false,warning:''});
  const refresh=useCallback(()=>{
    try {
      const rawFunds:unknown=getSavedPosDana(), rawTasks:unknown=getSavedPenyaluran(), receipts:unknown=getSavedPenerimaan();
      const funds=Array.isArray(rawFunds)?rawFunds.filter(validFund):[];
      const tasks=projectTasks(rawTasks);
      const invalid=!Array.isArray(rawTasks)||tasks.length!==rawTasks.length||!Array.isArray(rawFunds)||funds.length!==rawFunds.length;
      setData({tasks,funds,receipts:Array.isArray(receipts)?receipts.length:0,ready:true,
        warning:invalid?'Sebagian data browser tidak valid. Periksa data pada mode standar.':''});
    } catch {setData({tasks:[],funds:[],receipts:0,ready:true,warning:'Data browser tidak dapat dibaca. Tidak ada transaksi yang diubah.'});}
  },[]);
  useEffect(()=>{
    refresh();
    window.addEventListener('zaky_store_updated',refresh);
    window.addEventListener('storage',refresh);window.addEventListener('focus',refresh);
    return ()=>{window.removeEventListener('zaky_store_updated',refresh);window.removeEventListener('storage',refresh);window.removeEventListener('focus',refresh);};
  },[refresh]);
  return {...data,refresh};
}
