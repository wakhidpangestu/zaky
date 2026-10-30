import { Suspense } from 'react';
import RecipientConfirmation from '@/components/workflow/recipient-confirmation';
import SitePage from '@/components/site/site-page';
export const metadata = {
  title: 'Konfirmasi penerimaan',
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <SitePage>
      <Suspense fallback={<p role="status">Memeriksa tautan...</p>}>
        <RecipientConfirmation />
      </Suspense>
    </SitePage>
  );
}
