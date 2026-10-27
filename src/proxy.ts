import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '@/lib/jwt-secret';

const protectedPrefixes = ['/dasbor', '/penyaluran', '/penerimaan', '/profil', '/persetujuan', '/api/internal'];
const publicPrefixes = ['/login', '/verifikasi', '/silang', '/konfirmasi', '/api/publik'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Halaman publik: lewatkan
  if (publicPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Halaman yang dilindungi: periksa sesi
  if (protectedPrefixes.some((p) => pathname.startsWith(p))) {
    const token = request.cookies.get('zaky-session')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      await jwtVerify(token, getJwtSecret());
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
