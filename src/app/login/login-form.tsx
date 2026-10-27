'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import { login, type LoginState } from '@/app/actions/auth';
import ZakyLogo from '@/components/zaky-logo';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  LogIn,
  RotateCcw,
  Check,
} from 'lucide-react';
import Card3D from '@/components/landing/card-3d';
import { resetDatabaseStore } from '@/lib/store';

const initialState: LoginState = {};

interface DemoAccount {
  name: string;
  role: string;
  email: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: 'Amil Budi',
    role: 'Pelayanan',
    email: 'budi@lembaga-a.test',
  },
  {
    name: 'Penyetuju Hari',
    role: 'Keuangan',
    email: 'hari@lembaga-a.test',
  },
  {
    name: 'Saksi Dewi',
    role: 'Saksi 1',
    email: 'dewi@lembaga-a.test',
  },
  {
    name: 'Saksi Rian',
    role: 'Saksi 2',
    email: 'rian@lembaga-a.test',
  },
];

export default function LoginForm({ demoMode }: { demoMode: boolean }) {
  const [state, formAction, isPending] = useActionState(login, initialState);

  // Controlled form inputs so demo accounts can be 1-click populated
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSelectDemo = (acc: DemoAccount) => {
    setEmail(acc.email);
    setPassword('demo123');
    setSelectedDemo(acc.email);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zaky_user_nama');
    }
  };

  const handleResetDatabase = () => {
    resetDatabaseStore();
    setEmail('');
    setPassword('');
    setSelectedDemo(null);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2500);
  };

  return (
    <div className="h-screen w-full bg-[#F7F4ED] flex flex-col justify-between selection:bg-primary-100 selection:text-primary-900 relative overflow-hidden font-sans p-3 sm:p-5">
      {/* Top Header / Back Link */}
      <div className="max-w-[540px] w-full mx-auto flex items-center justify-between text-xs px-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-semibold text-neutral-600 hover:text-primary-700 transition-colors px-2.5 py-1 rounded-full hover:bg-neutral-200/50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </Link>

        <Link
          href="/verifikasi"
          className="text-primary-700 font-semibold hover:underline"
        >
          Cek Kode Publik →
        </Link>
      </div>

      {/* Center Login Area — Balanced Width without Vertical Scroll */}
      <div className="max-w-[540px] w-full mx-auto my-auto py-1">
        {/* Brand Header — NO BACKGROUND BOX ON LOGO */}
        <div className="text-center mb-3 sm:mb-4 flex flex-col items-center">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <ZakyLogo
              size={36}
              className="text-primary-700 transition-transform duration-300 group-hover:scale-105 flex-shrink-0"
            />
            <span className="font-extrabold text-2xl sm:text-3xl tracking-tight text-neutral-900 leading-none">
              Zaky<span className="text-accent-500">.</span>
            </span>
          </Link>
          <p className="mt-1 text-neutral-500 text-xs sm:text-sm">
            Portal Masuk Amil & Penyaluran Zakat
          </p>
        </div>

        {/* Neomorphic Card */}
        <Card3D maxRotate={2}>
          <div
            className="neo-card-3d p-6 sm:p-7 rounded-3xl space-y-4"
            style={{ borderRadius: '24px' }}
          >
            {/* Error Message */}
            {state.error && (
              <div
                className="p-3 rounded-xl text-xs font-medium space-y-0.5"
                style={{
                  backgroundColor: 'var(--zaky-status-ditolak-bg)',
                  color: 'var(--zaky-status-ditolak-text)',
                }}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span>✕</span>
                  <span>Autentikasi Gagal</span>
                </div>
                <p className="pl-4 text-[11px]">{state.error}</p>
              </div>
            )}

            {/* Form */}
            <form action={formAction} className="space-y-3.5">
              {/* Email */}
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-neutral-700"
                >
                  Alamat Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setSelectedDemo(null);
                    }}
                    placeholder="nama@lembaga.test"
                    className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-neutral-900 neo-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 transition-all placeholder:text-neutral-400"
                  />
                </div>
                {state.fieldErrors?.email && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {state.fieldErrors.email[0]}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-neutral-700"
                  >
                    Kata Sandi
                  </label>
                  {demoMode && (
                    <span className="text-[11px] text-neutral-400 font-mono">
                      demo123
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setSelectedDemo(null);
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm text-neutral-900 neo-inset rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 transition-all placeholder:text-neutral-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 p-1 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {state.fieldErrors?.password && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {state.fieldErrors.password[0]}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 px-5 rounded-full neo-btn text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isPending ? 'Memproses Masuk...' : 'Masuk ke Akun'}</span>
                </button>
              </div>
            </form>

            {/* 1-Click Demo Accounts Section - hanya tampil bila mode demo aktif;
                di deployment tanpa ZAKY_DEMO_MODE, akun demo memang mati (audit K1)
                sehingga menampilkannya hanya akan menyesatkan. */}
            {demoMode && (
            <div className="pt-3 border-t border-neutral-100 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                  <span>Pilihan Akun Demo (1-Klik):</span>
                </span>
                <button
                  type="button"
                  onClick={handleResetDatabase}
                  className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-red-700 transition-colors font-medium cursor-pointer"
                  title="Kembalikan semua saldo, transaksi, dan sesi ke kondisi awal (fresh)"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{resetSuccess ? 'Reset Berhasil!' : 'Reset Data Awal'}</span>
                </button>
              </div>

              {resetSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Database simulasi dan cache lokal berhasil dikembalikan ke kondisi awal (fresh).</span>
                </div>
              )}

              {/* 2x2 Clickable Cards with Clear Roles & Emails */}
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isSelected = selectedDemo === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleSelectDemo(acc)}
                      className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border flex items-center justify-between ${
                        isSelected
                          ? 'border-primary-700 bg-primary-100/70 ring-1 ring-primary-700/30 shadow-2xs'
                          : 'border-neutral-200/90 bg-neutral-50/80 hover:bg-neutral-100/90 hover:border-neutral-300'
                      }`}
                      title={`Klik untuk mengisi ${acc.email}`}
                    >
                      <div className="min-w-0 pr-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-neutral-900">
                            {acc.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-neutral-200/70 text-neutral-600 font-medium">
                            {acc.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-500 font-mono block mt-0.5 break-all">
                          {acc.email}
                        </span>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-primary-700 flex-shrink-0" />
                      ) : (
                        <span className="text-[10px] text-primary-700 font-mono font-semibold flex-shrink-0 bg-primary-50 px-1.5 py-0.5 rounded">
                          Pilih
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            )}
          </div>
        </Card3D>
      </div>

      {/* Footer Security Note — Snug 1 Line */}
      <div className="text-center text-[11px] text-neutral-400 flex items-center justify-center gap-1.5 py-1">
        <ShieldCheck className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
        <span>Autentikasi Terenkripsi JWT & Segregasi Kewenangan Antarunit</span>
      </div>
    </div>
  );
}
