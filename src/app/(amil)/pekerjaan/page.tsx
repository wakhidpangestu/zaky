export const metadata = { title: 'Antrean pekerjaan' };
export const instant = false;
import { Suspense } from 'react';
import WorkflowWorkspace from '@/components/workflow/workspace';
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Memuat catatan...</p>}>
      <WorkflowWorkspace />
    </Suspense>
  );
}
