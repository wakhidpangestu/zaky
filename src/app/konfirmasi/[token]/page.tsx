import { Suspense } from 'react';
import RecipientConfirmation from '@/components/workflow/recipient-confirmation';
export const metadata = {
  title: 'Konfirmasi penerimaan — Zaky',
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <Suspense fallback={<p>Memeriksa tautan...</p>}>
      <RecipientConfirmation />
    </Suspense>
  );
}
