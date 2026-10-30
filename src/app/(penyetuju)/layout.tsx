import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import WorkLayout from '@/components/office/work-layout';
import { demoLembaga } from '@/lib/office/model';
import '@/components/workflow/workflow.css';
import '@/components/office/office.css';
export const instant = false;
/** Approval pages are for approvers and admins; other roles see why, not an empty queue. */
async function AuthGate({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  const allowed = session.peran === 'penyetuju' || session.peran === 'admin';
  return (
    <WorkLayout user={{ nama: session.nama, peran: session.peran, email: session.email, lembaga: demoLembaga(session.lembagaId) }}>
      {allowed ? (
        children
      ) : (
        <main className="zw-page zaky-office zw-workspace">
          <section className="zo-error" role="alert">
            <p>
              <b>Halaman ini khusus penyetuju.</b> Akun Anda berperan sebagai amil, jadi tidak dapat
              mengesahkan penyaluran. Pemisahan ini menjaga agar pembuat draf tidak menyetujui
              pekerjaannya sendiri.
            </p>
            <div>
              <Link className="zo-retry" href="/pekerjaan" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                Ke antrean pekerjaan
              </Link>
            </div>
          </section>
        </main>
      )}
    </WorkLayout>
  );
}
export default function PenyetujuLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p role="status">Memuat akun...</p>}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}
