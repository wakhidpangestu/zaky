import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardShell from '@/components/dashboard-shell';

// Opt out of instant navigation — layout always reads the session cookie
export const instant = false;

async function AuthGate({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // RBAC per peran (audit S1): area amil hanya untuk amil/admin; penyetuju
  // diarahkan ke konsol persetujuannya.
  if (session.peran !== 'amil' && session.peran !== 'admin') {
    redirect('/persetujuan');
  }

  return (
    <DashboardShell
      user={{
        nama: session.nama,
        peran: session.peran,
        email: session.email,
      }}
    >
      {children}
    </DashboardShell>
  );
}

export default function AmilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-neutral-600 text-sm">Memuat...</div>
        </div>
      }
    >
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}
