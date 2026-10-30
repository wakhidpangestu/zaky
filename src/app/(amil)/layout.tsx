import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { getSession } from '@/lib/auth';
import WorkLayout from '@/components/office/work-layout';
import { demoLembaga } from '@/lib/office/model';
export const instant = false;
async function AuthGate({children}:{children:React.ReactNode}){
  await connection();
  const session=await getSession();
  if(!session)redirect('/login');
  return <WorkLayout user={{nama:session.nama,peran:session.peran,email:session.email,lembaga:demoLembaga(session.lembagaId)}}>{children}</WorkLayout>;
}
export default function AmilLayout({children}:{children:React.ReactNode}){
  return <Suspense fallback={<p role="status">Memuat akun...</p>}><AuthGate>{children}</AuthGate></Suspense>;
}
