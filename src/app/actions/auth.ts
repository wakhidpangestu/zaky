'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSession, deleteSession } from '@/lib/auth';

// Akun demo untuk lomba — di produksi, query dari database
const DEMO_ACCOUNTS = [
  {
    userId: '11111111-1111-1111-1111-111111111111',
    lembagaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    unitId: 'u1111111-1111-1111-1111-111111111111',
    email: 'budi@lembaga-a.test',
    nama: 'Amil Budi',
    peran: 'amil' as const,
  },
  {
    userId: '22222222-2222-2222-2222-222222222222',
    lembagaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    unitId: 'u2222222-2222-2222-2222-222222222222',
    email: 'hari@lembaga-a.test',
    nama: 'Penyetuju Hari',
    peran: 'penyetuju' as const,
  },
  {
    userId: '33333333-3333-3333-3333-333333333333',
    lembagaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    unitId: 'u2222222-2222-2222-2222-222222222222',
    email: 'dewi@lembaga-a.test',
    nama: 'Saksi Dewi',
    peran: 'amil' as const,
  },
  {
    userId: '44444444-4444-4444-4444-444444444444',
    lembagaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    unitId: 'u3333333-3333-3333-3333-333333333333',
    email: 'rian@lembaga-a.test',
    nama: 'Saksi Rian',
    peran: 'amil' as const,
  },
];

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

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

  const cleanEmail = email.trim().toLowerCase();
  const account = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === cleanEmail);
  if (!account) {
    return { error: 'Email atau kata sandi salah.' };
  }

  // Mode demo: kata sandi "demo123" untuk semua akun
  if (password.trim() !== 'demo123') {
    return { error: 'Email atau kata sandi salah.' };
  }

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
    'u1111111-1111-1111-1111-111111111111': 'Unit Pelayanan',
    'u2222222-2222-2222-2222-222222222222': 'Unit Keuangan',
    'u3333333-3333-3333-3333-333333333333': 'Unit Logistik',
  };

  return {
    nama: session.nama,
    email: session.email,
    peran: session.peran,
    unit: unitMap[session.unitId] || 'Unit Pelayanan',
  };
}
