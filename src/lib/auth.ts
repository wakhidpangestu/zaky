import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getJwtSecret } from '@/lib/jwt-secret';

export interface SessionPayload {
  userId: string;
  lembagaId: string;
  unitId: string;
  email: string;
  nama: string;
  peran: 'amil' | 'penyetuju' | 'admin';
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set('zaky-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('zaky-session')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('zaky-session');
}
