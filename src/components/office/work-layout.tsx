'use client';
import { useSyncExternalStore, type ReactNode } from 'react';
import DashboardShell from '@/components/dashboard-shell';
import { SimProvider } from './sim-provider';
import { LiveProvider } from './live-provider';
import { isEmbedded } from '@/lib/office/embed';
const noop=()=>()=>{};
export default function WorkLayout({user,children}:{user:{nama:string;peran:string;email:string;lembaga?:string};children:ReactNode}) {
  // null on the server; the frame check only means something in the browser.
  const embedded=useSyncExternalStore(noop,isEmbedded,()=>null);
  if(embedded===null)return <p className="p-6" role="status">Memuat ruang kerja...</p>;
  return <SimProvider><LiveProvider>{embedded?<main className="p-4 sm:p-6 bg-neutral-50 min-h-screen">{children}</main>:<DashboardShell user={user}>{children}</DashboardShell>}</LiveProvider></SimProvider>;
}
