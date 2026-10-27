'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { createSession, deleteSession } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

/**
 * Akun demo untuk lomba — di produksi, akun dibaca dari database.
 *
 * Perbaikan audit K1: akun demo TIDAK lagi aktif secara bawaan di deployment
 * produksi dan kata sandinya TIDAK lagi dibandingkan sebagai teks polos.
 * - Akun demo hanya aktif bila ZAKY_DEMO_MODE=true (atau NODE_ENV=development).
 * - Kata sandi demo tersimpan sebagai hash PBKDF2 600rb iterasi dan diverifikasi
 *   lewat verifyPassword (waktu konstan), sama seperti akun sungguhan.
 * Kata sandi demo tetap "demo123" (ditampilkan di halaman login untuk juri),
 * tetapi mengetahuinya tidak berguna di deployment yang mode demonya mati.
 */
const DEMO_ACCOUNTS = [
  {
    userId: '11111111-1111-1111-1111-111111111111',
    lembagaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    unitId: 'u1111111-1111-1111-1111-111111111111',
    email: 'budi@lembaga-a.test',
    nama: 'Amil Budi',
    peran: 'amil' as const,
    passwordHash: 'pbkdf2:600000:0c5a1db21a25b2fb03e0a4ddab509edb:902566aea7fb49f03fa82b0c20e4fc89507bc93806d17e7baec8ca35d24956b2',
  },
  {
    userId: '22222222-2222-2222-2222-222222222222',
    lembagaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    unitId: 'u2222222-2222-2222-2222-222222222222',
    email: 'hari@lembaga-a.test',
    nama: 'Penyetuju Hari',
    peran: 'penyetuju' as const,
    passwordHash: 'pbkdf2:600000:428658da21ad5e50364cca9a67c52dde:0770da7fb01633b3b52ce8cefd4baef95f4c8197486fe63db69e09ba8fb7ec82',
  },
  {
    userId: '33333333-3333-3333-3333-333333333333',
    lembagaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    unitId: 'u3333333-3333-3333-3333-333333333333',
    email: 'dewi@lembaga-a.test',
    nama: 'Saksi Dewi',
    peran: 'amil' as const,
    passwordHash: 'pbkdf2:600000:b16beaa8c07ff58b63e03e2c90162a16:a8ac941400853a2e466cb50886002665aef9be238d0fc2d05ee7a4446b588c4e',
  },
  {
    userId: '44444444-4444-4444-4444-444444444444',
    lembagaId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    unitId: 'u4444444-4444-4444-4444-444444444444',
    email: 'rian@lembaga-a.test',
    nama: 'Saksi Rian',
    peran: 'amil' as const,
    passwordHash: 'pbkdf2:600000:ef3ece6d76715d3a6e1f09a425dc55d2:dc4543b051b16a747ca9dcf46c588952f872df7c06f5a4bbfc6cc21f283632e1',
  },
];

// Hash valid-format untuk membakar waktu verifikasi yang setara ketika email
// tidak dikenal, agar respons tidak membocorkan keberadaan akun lewat timing.
const DUMMY_HASH = DEMO_ACCOUNTS[0].passwordHash;

function demoModeAktif(): boolean {
  return process.env.ZAKY_DEMO_MODE === 'true' || process.env.NODE_ENV === 'development';
}

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

  // Rate limiting (audit S7): maks 8 percobaan per IP+email per 10 menit
  const headerStore = await headers();
  const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() || 'tidak-dikenal';
  const rateKey = `login:${ip}:${cleanEmail}`;
  const rate = checkRateLimit(rateKey, 8, 10 * 60 * 1000);
  if (!rate.ok) {
    return {
      error: `Terlalu banyak percobaan login. Coba lagi dalam ${rate.retryAfterSec} detik.`,
    };
  }

  if (!demoModeAktif()) {
    return {
      error: 'Login demo dinonaktifkan pada deployment ini. Atur ZAKY_DEMO_MODE=true untuk mengaktifkan akun demo lomba.',
    };
  }

  const account = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === cleanEmail);
  // Selalu jalankan verifikasi PBKDF2 (hash akun atau hash dummy) agar waktu
  // respons tidak membedakan email terdaftar dan tidak terdaftar.
  const passwordOk = await verifyPassword(password, account?.passwordHash ?? DUMMY_HASH);
  if (!account || !passwordOk) {
    return { error: 'Email atau kata sandi salah.' };
  }

  resetRateLimit(rateKey);

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
