import type { Metadata } from 'next';
import PublicVerification from '@/components/workflow/public-verification';
import SitePage from '@/components/site/site-page';

export const metadata: Metadata = {
  title: 'Verifikasi kode catatan',
  description: 'Periksa status, nominal, dan hash audit catatan zakat dengan kode ZK atau RC.',
};

export default function Page() {
  return (
    <SitePage>
      <PublicVerification />
    </SitePage>
  );
}
