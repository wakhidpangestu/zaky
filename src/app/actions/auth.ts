'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSession, deleteSession } from '@/lib/auth';
import { clientIp, RateLimiter } from '@/lib/rate-limit';
import { hasStrongJwtSecret, safeEqual } from '@/lib/secret';

// 5 kegagalan per akun / 15 menit -> kunci 15 menit; 30 percobaan per IP / 15 menit.
const perAccount = new RateLimiter(5, 15 * 60_000);
const perIp = new RateLimiter(30, 15 * 60_000);
const DEMO_PASSWORD = 'demo123';

// Akun demo untuk lomba — di produksi, query dari database
const DEMO_ACCOUNTS = [
  {
    userId: '11111111-1111-1111-1111-111111111111',
    lembagaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    unitId: 'a1111111-1111-1111-1111-111111111111',
    email: 'budi@lembaga-a.test',
    nama: 'Amil Budi',
    peran: 'amil' as const,
  },
  {
    userId: '22222222-2222-2222-2222-222222222222',
    lembagaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    unitId: 'a2222222-2222-2222-2222-222222222222',
    email: 'hari@lembaga-a.test',
    nama: 'Penyetuju Hari',
    peran: 'penyetuju' as const,
  },
  {
    userId: '33333333-3333-3333-3333-333333333333',
    lembagaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    unitId: 'a3333333-3333-3333-3333-333333333333',
    email: 'dewi@lembaga-a.test',
    nama: 'Saksi Dewi',
    peran: 'amil' as const,
  },
  {
    userId: '44444444-4444-4444-4444-444444444444',
    lembagaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    unitId: 'a4444444-4444-4444-4444-444444444444',
    email: 'rian@lembaga-a.test',
    nama: 'Saksi Rian',
    peran: 'amil' as const,
  },
];

const loginSchema = z.object({
  email: z.string().trim().max(254).email('Email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi').max(128, 'Kata sandi terlalu panjang'),
});

const lockedMessage = (seconds: number) =>
  `Terlalu banyak percobaan masuk. Coba lagi dalam ${Math.ceil(seconds / 60)} menit.`;

export type LoginState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;
  const cleanEmail = email.toLowerCase();
  const ipKey = 'ip:' + clientIp(await headers());
  const accountKey = 'akun:' + cleanEmail;

  const locked = Math.max(perIp.hit(ipKey), perAccount.retryAfter(accountKey));
  if (locked) return { error: lockedMessage(locked) };

  if (!hasStrongJwtSecret()) {
    return { error: 'Layanan masuk belum dikonfigurasi dengan aman. Hubungi administrator.' };
  }

  const account = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === cleanEmail);
  // Mode demo: kata sandi "demo123" untuk semua akun. Bandingkan selalu
  // (waktu-konstan) agar akun yang ada/tidak ada tidak bisa dibedakan.
  const passwordOk = safeEqual(password, DEMO_PASSWORD);
  if (!account || !passwordOk) {
    const lockedNow = perAccount.hit(accountKey);
    return { error: lockedNow ? lockedMessage(lockedNow) : 'Email atau kata sandi salah.' };
  }

  perAccount.reset(accountKey);
  await createSession({
    userId: account.userId,
    lembagaId: account.lembagaId,
    unitId: account.unitId,
    email: account.email,
    nama: account.nama,
    peran: account.peran,
  });

  redirect('/dasbor');
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/login');
}

export async function getActiveSession(): Promise<{
  nama: string;
  email: string;
  peran: string;
  unit: string;
} | null> {
  const { getSession } = await import('@/lib/auth');
  const session = await getSession();
  if (!session) return null;

  const unitMap: Record<string, string> = {
    'a1111111-1111-1111-1111-111111111111': 'Unit Pelayanan',
    'a2222222-2222-2222-2222-222222222222': 'Unit Keuangan',
    'a3333333-3333-3333-3333-333333333333': 'Unit Penyaluran',
    'a4444444-4444-4444-4444-444444444444': 'Unit Pengawasan',
  };

  return {
    nama: session.nama,
    email: session.email,
    peran: session.peran,
    unit: unitMap[session.unitId] || 'Unit Pelayanan',
  };
}
