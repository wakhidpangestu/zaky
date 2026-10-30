import { Suspense } from 'react';
import PublicVerification from '@/components/workflow/public-verification';
import SitePage from '@/components/site/site-page';
export const instant = false;
async function Result({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params;
  return <PublicVerification key={kode} code={kode} />;
}
export default function Page({ params }: { params: Promise<{ kode: string }> }) {
  return (
    <SitePage>
      <Suspense fallback={<PublicVerification />}>
        <Result params={params} />
      </Suspense>
    </SitePage>
  );
}
