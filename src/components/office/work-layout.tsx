'use client';
import { useEffect, useState, type ReactNode } from 'react';
import DashboardShell from '@/components/dashboard-shell';
export default function WorkLayout({user,children}:{user:{nama:string;peran:string;email:string};children:ReactNode}) {
  const [embedded,setEmbedded]=useState<boolean|null>(null);
  useEffect(()=>{try{setEmbedded(window.parent!==window&&window.parent.location.origin===window.location.origin);}catch{setEmbedded(false);}},[]);
  if(embedded===null)return <p className="p-6" role="status">Memuat ruang kerja...</p>;
  return embedded?<main className="p-4 sm:p-6 bg-neutral-50 min-h-screen">{children}</main>:<DashboardShell user={user}>{children}</DashboardShell>;
}
