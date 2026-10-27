import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardShell from '@/components/dashboard-shell';

export const instant = false;

async function AuthGatePenyetuju({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // RBAC per peran (audit S1): konsol persetujuan hanya untuk penyetuju/admin.
  // Sesi amil diarahkan ke dasbornya agar segregasi 4-mata tegak di level UI,
  // bukan hanya di level API.
  if (session.peran !== 'penyetuju' && session.peran !== 'admin') {
    redirect('/dasbor');
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

export default function PenyetujuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-neutral-600 text-sm">Memuat konsol penyetuju...</div>
        </div>
      }
    >
      <AuthGatePenyetuju>{children}</AuthGatePenyetuju>
    </Suspense>
  );
}
