'use client';

import React, { useState, useActionState } from 'react';
import Image from 'next/image';
import { login, type LoginState } from '@/app/actions/auth';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  LogIn,
  RotateCcw,
  Check,
  TriangleAlert,
  Users,
  FileClock,
} from 'lucide-react';
import { clearBrowserCache } from '@/lib/browser-cache';
import SiteNavbar from '@/components/site/site-navbar';
import '@/components/site/site.css';

const initialState: LoginState = {};

interface DemoAccount {
  name: string;
  role: string;
  email: string;
}

// Four accounts are enough to run one record end to end: the maker, two witnesses
// from different units, and the approver. The other seeded staff still exist for handoffs.
const DEMO_ACCOUNTS: DemoAccount[] = [
  { name: 'Amil Budi', role: 'Pembuat draf', email: 'budi@lembaga-a.test' },
  { name: 'Saksi Dewi', role: 'Saksi pertama', email: 'dewi@lembaga-a.test' },
  { name: 'Saksi Rian', role: 'Saksi kedua', email: 'rian@lembaga-a.test' },
  { name: 'Penyetuju Hari', role: 'Penyetuju', email: 'hari@lembaga-a.test' },
];

export default function LoginPage() {
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
    clearBrowserCache();
    setEmail('');
    setPassword('');
    setSelectedDemo(null);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2500);
  };

  return (
    <div className="zs-page zs-login-page">
      <SiteNavbar />
      <main className="zs-main zs-login">
        {/* Brand side: what the portal is for */}
        <section className="zs-login-intro">
          <span className="zs-eyebrow">
            <ShieldCheck size={14} /> Portal amil
          </span>
          <h1 className="zs-title">
            Masuk ke ruang kerja. <em>Setiap tahap tercatat.</em>
          </h1>
          <p className="zs-lead">
            Catat penerimaan, siapkan penyaluran, dan periksa kesaksian dari satu tempat yang sama.
          </p>
          <figure className="zs-art zs-login-art">
            <Image
              src="/scenes/gedung.webp"
              alt="Gedung pusat layanan Zaky"
              width={1400}
              height={1328}
              sizes="(max-width: 960px) 160px, 480px"
              priority
            />
          </figure>
          <ul className="zs-login-points">
            <li>
              <Users size={16} /> Kewenangan dipisah antarunit
            </li>
            <li>
              <FileClock size={16} /> Jejak audit di setiap tahap
            </li>
          </ul>
        </section>

        {/* Form side */}
        <section className="zs-card zs-login-card">
          <h2>Masuk akun</h2>
          <p>Gunakan akun lembaga Anda, atau pilih akun demo di bawah.</p>

          {state.error && (
            <div role="alert" className="zs-alert zs-alert-error">
              <TriangleAlert size={18} />
              <div>
                <b>Autentikasi gagal</b>
                <div>{state.error}</div>
              </div>
            </div>
          )}

          <form action={formAction} className="zs-form">
            <label className="zs-input">
              <span>Alamat email</span>
              <span className="zs-input-box">
                <Mail size={18} />
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
                />
              </span>
              {state.fieldErrors?.email && <em>{state.fieldErrors.email[0]}</em>}
            </label>

            <label className="zs-input">
              <span>
                Kata sandi <small>demo: demo123</small>
              </span>
              <span className="zs-input-box">
                <Lock size={18} />
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
              {state.fieldErrors?.password && <em>{state.fieldErrors.password[0]}</em>}
            </label>

            <button type="submit" disabled={isPending} className="zs-btn zs-btn-block">
              <LogIn size={18} />
              {isPending ? 'Memproses...' : 'Masuk ke akun'}
            </button>
          </form>

          {/* 1-click demo accounts */}
          <div className="zs-demo">
            <div className="zs-demo-head">
              <span>
                <Sparkles size={15} /> Akun demo (1 klik)
              </span>
              <button
                type="button"
                onClick={handleResetDatabase}
                title="Hapus pengaturan Zaky yang tersimpan di browser ini. Catatan lembaga tidak berubah."
              >
                <RotateCcw size={13} />
                {resetSuccess ? 'Cache dibersihkan' : 'Bersihkan cache'}
              </button>
            </div>

            {resetSuccess && (
              <p className="zs-alert zs-alert-info" style={{ marginTop: 0 }}>
                <Check size={16} />
                Pengaturan browser ini kembali ke awal. Catatan lembaga di server tidak berubah.
              </p>
            )}

            <div className="zs-demo-grid">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = selectedDemo === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    aria-pressed={isSelected}
                    title={`Isi dengan ${acc.email}`}
                  >
                    <span className="zs-avatar">
                      {acc.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')}
                    </span>
                    <span className="zs-demo-text">
                      <b>{acc.name}</b>
                      <small>{acc.role}</small>
                    </span>
                    {isSelected && <CheckCircle2 size={18} className="zs-demo-check" />}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="zs-note zs-login-foot">
            <ShieldCheck size={14} /> Sesi terenkripsi JWT &amp; kewenangan dipisah antarunit
          </p>
        </section>
      </main>
    </div>
  );
}
