import { Suspense } from 'react';
import { connection } from 'next/server';
import LoginForm from './login-form';

async function LoginGate() {
  // connection() menunda rendering sampai ada permintaan masuk, sehingga
  // status mode demo dibaca dari environment saat runtime, bukan saat build.
  await connection();
  const demoMode =
    process.env.ZAKY_DEMO_MODE === 'true' || process.env.NODE_ENV === 'development';
  return <LoginForm demoMode={demoMode} />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-neutral-600 text-sm">Memuat halaman masuk...</div>
        </div>
      }
    >
      <LoginGate />
    </Suspense>
  );
}
