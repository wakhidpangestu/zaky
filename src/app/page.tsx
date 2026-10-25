import { getSession } from '@/lib/auth';
import HomeView from '@/components/landing/home-view';

// Opt out of instant navigation — reads session cookie
export const instant = false;

export const metadata = {
  title: 'Zaky — Setiap Lembaga Mencatat Sendiri, Catatannya Saling Diperiksa',
  description:
    'Jaringan verifikasi penyaluran zakat antarlembaga berlandaskan fiqih amanah, konfirmasi langsung penerima (mustahik), dan audit silang kriptografis harian.',
};

export default async function HomePage() {
  const session = await getSession();

  return <HomeView session={session} />;
}
