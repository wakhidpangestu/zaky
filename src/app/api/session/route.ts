import { getSession } from '@/lib/auth';

/** Status masuk minimal untuk halaman publik statis (tanpa data pribadi). */
export async function GET() {
  const session = await getSession();
  return Response.json(
    { signedIn: !!session },
    { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } },
  );
}
