import PublicVerification from '@/components/workflow/public-verification';
import { Suspense } from 'react';
export const instant = false;
async function Result({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params;
  return <PublicVerification key={kode} code={kode} />;
}
export default function Page({ params }: { params: Promise<{ kode: string }> }) {
  return (
    <Suspense fallback={<p>Memuat verifikasi...</p>}>
      <Result params={params} />
    </Suspense>
  );
}
