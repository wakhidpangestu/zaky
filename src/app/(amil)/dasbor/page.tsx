import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { demoUnit } from '@/lib/office/model';
import OfficeGateway from '@/components/office/gateway';
export const instant = false;
async function Workspace(){
  const user=await getSession();
  if(!user)redirect('/login');
  return <OfficeGateway user={{...user,unitName:demoUnit(user.unitId)}}/>;
}
export default function DasborPage(){return <Suspense fallback={<p role="status">Memuat akun...</p>}><Workspace/></Suspense>;}
