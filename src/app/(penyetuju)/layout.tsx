import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import WorkLayout from '@/components/office/work-layout';
export const instant = false;
async function AuthGate({children}:{children:React.ReactNode}){
  const session=await getSession();
  if(!session)redirect('/login');
  return <WorkLayout user={{nama:session.nama,peran:session.peran,email:session.email}}>{children}</WorkLayout>;
}
export default function PenyetujuLayout({children}:{children:React.ReactNode}){
  return <Suspense fallback={<p role="status">Memuat akun...</p>}><AuthGate>{children}</AuthGate></Suspense>;
}
