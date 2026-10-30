export const metadata = { title: 'Buat draf penyaluran' };
export const instant = false;
import { Suspense } from 'react';
import WorkflowWorkspace from '@/components/workflow/workspace';
export default function Page() {
  return (
    <Suspense fallback={<p>Memuat formulir...</p>}>
      <WorkflowWorkspace initialAction="distribution" />
    </Suspense>
  );
}
