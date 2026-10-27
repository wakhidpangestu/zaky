export const instant = false;
import { Suspense } from 'react';
import WorkflowWorkspace from '@/components/workflow/workspace';
export default function Page() {
  return (
    <Suspense fallback={<p>Memuat catatan...</p>}>
      <WorkflowWorkspace filter="penerimaan" />
    </Suspense>
  );
}
