import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session-token';

const protectedPrefixes = [
  '/dasbor',
  '/penyaluran',
  '/penerimaan',
  '/profil',
  '/pekerjaan',
  '/persetujuan',
  '/api/internal',
];

function isProtected(pathname: string) {
  return protectedPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function deny(request: NextRequest) {
  // API menjawab 401 JSON; halaman dialihkan ke login.
  if (request.nextUrl.pathname.startsWith('/api/'))
    return NextResponse.json({ error: 'Sesi tidak valid.' }, { status: 401 });
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function proxy(request: NextRequest) {
  if (!isProtected(request.nextUrl.pathname)) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return deny(request);

  // Secret lemah/hilang, tanda tangan salah, atau klaim cacat -> fail-closed.
  return (await verifySessionToken(token)) ? NextResponse.next() : deny(request);
}

export const config = {
  matcher: [
    '/dasbor/:path*',
    '/penyaluran/:path*',
    '/penerimaan/:path*',
    '/profil/:path*',
    '/pekerjaan/:path*',
    '/persetujuan/:path*',
    '/api/internal/:path*',
  ],
};
