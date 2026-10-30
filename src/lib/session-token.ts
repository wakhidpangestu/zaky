import { jwtVerify } from 'jose';
import { jwtSecretKey } from './secret.ts';

export const SESSION_COOKIE = 'zaky-session';
export const SESSION_TTL_SECONDS = 60 * 60 * 8;
const PERAN = new Set(['amil', 'penyetuju', 'admin']);

export interface SessionPayload {
  userId: string;
  lembagaId: string;
  unitId: string;
  email: string;
  nama: string;
  peran: 'amil' | 'penyetuju' | 'admin';
  /** Klaim waktu JWT (detik epoch) — terisi saat sesi dibaca, bukan saat dibuat. */
  iat?: number;
  exp?: number;
}

/**
 * Verifikasi token sesi: hanya HS256, secret wajib kuat, dan klaim wajib berbentuk benar.
 * Tanpa ketergantungan runtime Next sehingga dipakai proxy, route, dan test.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecretKey(), { algorithms: ['HS256'] });
    const p = payload as Record<string, unknown>;
    const fields = ['userId', 'lembagaId', 'unitId', 'email', 'nama', 'peran'] as const;
    if (!fields.every((k) => typeof p[k] === 'string') || !PERAN.has(p.peran as string)) return null;
    return {
      userId: p.userId as string,
      lembagaId: p.lembagaId as string,
      unitId: p.unitId as string,
      email: p.email as string,
      nama: p.nama as string,
      peran: p.peran as SessionPayload['peran'],
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
