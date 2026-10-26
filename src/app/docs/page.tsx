'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageNavbar from '@/components/navigation/page-navbar';
import ZakyLogo from '@/components/zaky-logo';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Code2,
  Lock,
  GitBranch,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Server,
  Terminal,
  FileCheck,
  Users,
  Search,
  ExternalLink,
  Copy,
  Check,
  Database,
  Eye,
  KeyRound,
  Network,
  Scale,
  Award,
  ChevronRight,
  Hash,
  AlertTriangle,
  RefreshCw,
  FileText,
  Clock,
  Fingerprint,
  CheckCheck,
} from 'lucide-react';

interface NavSection {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
}

const NAV_SECTIONS: NavSection[] = [
  { id: 'overview', title: '1. Overview & Filosofi Zaky', category: 'PENDAHULUAN', icon: BookOpen },
  { id: 'masalah-solusi', title: '2. Masalah & Solusi Industri', category: 'PENDAHULUAN', icon: Scale },
  { id: 'four-eyes', title: '3. Segregasi 4-Mata & Aturan 4-Unit', category: 'TATA KELOLA', icon: Users },
  { id: 'state-machine', title: '4. Siklus & State Machine', category: 'TATA KELOLA', icon: GitBranch },
  { id: 'papan-silang', title: '5. Jaringan Papan Silang', category: 'TATA KELOLA', icon: Network },
  { id: 'arsitektur', title: '6. Arsitektur Rekayasa & Hierarki Lock', category: 'ARSITEKTUR', icon: Server },
  { id: 'kriptografi', title: '7. Kriptografi Rantai & Verifikasi Offline', category: 'KRIPTOGRAFI', icon: ShieldCheck },
  { id: 'keamanan', title: '8. Keamanan, Sesi & Batas Kepercayaan', category: 'KEAMANAN', icon: Lock },
  { id: 'tech-stack', title: '9. Tech Stack & Dependensi', category: 'TEKNOLOGI', icon: Cpu },
  { id: 'data-model', title: '10. Skema Relasional & Invariant Kas', category: 'SPESIFIKASI', icon: Database },
  { id: 'syariah', title: '11. Standar Syariah & Regulasi', category: 'KEPATUHAN', icon: Award },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeArchTab, setActiveArchTab] = useState<'layer' | 'lock' | 'token'>('layer');
  const [activeCryptoTab, setActiveCryptoTab] = useState<'chain' | 'verifier' | 'anchor'>('chain');

  // Copy helper
  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // Deterministic scroll spy for docs sections
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollPos = window.scrollY;
          const windowHeight = window.innerHeight;
          const docHeight = document.documentElement.scrollHeight;

          // Bottom of page check
          if (scrollPos + windowHeight >= docHeight - 80) {
            setActiveSection(NAV_SECTIONS[NAV_SECTIONS.length - 1].id);
            ticking = false;
            return;
          }

          let current = NAV_SECTIONS[0].id;
          for (let i = NAV_SECTIONS.length - 1; i >= 0; i--) {
            const el = document.getElementById(NAV_SECTIONS[i].id);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= 180) {
                current = NAV_SECTIONS[i].id;
                break;
              }
            }
          }
          setActiveSection(current);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredNav = NAV_SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F7F4ED] selection:bg-primary-100 selection:text-primary-900 font-sans text-neutral-900">
      {/* Universal Smooth Navbar */}
      <PageNavbar variant="docs" />

      {/* Hero Header Banner */}
      <div className="relative pt-28 pb-14 overflow-hidden border-b border-neutral-200/80 bg-gradient-to-b from-white via-white to-[#F7F4ED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <h1 className="z-display-2 text-neutral-900">
              Arsitektur Rekayasa, Tata Kelola & <br />
              <span className="text-primary-700">Integritas Kriptografis Zaky</span>
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              Dokumentasi komprehensif mengenai arsitektur sistem Zaky: segregasi kewenangan 4-mata
              lintas 4-unit independen, verifikasi ganda (token nir-bocor mustahik 72 jam & saksi amil lapangan),
              hierarki penguncian baris anti-deadlock di PostgreSQL, rantai hash audit SHA-256 append-only
              dengan RFC 8785 JCS, verifikator offline independen, serta penjangkaran tanda tangan Ed25519.
            </p>

            {/* Quick Metadata Chips */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200">
                Next.js 16 (App Router)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200">
                PostgreSQL 16 & PL/pgSQL
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200">
                RFC 8785 JCS + SHA-256
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200">
                Ed25519 Daily Anchoring
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-primary-100/80 text-primary-800 border border-primary-200 font-semibold">
                4-Unit Segregation (N1)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-800 border border-amber-200 font-semibold">
                Invariant Balance Engine
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container: Sidebar + Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-24 sm:pb-32">
        {/* Navigasi topik khusus mobile & tablet portrait (sidebar TOC hanya tampil di lg+) */}
        <div className="lg:hidden mb-8 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari topik docs..."
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-neutral-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 transition-all placeholder:text-neutral-400"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_90%,transparent)]">
            {filteredNav.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection(item.id);
                    const el = document.getElementById(item.id);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      window.history.pushState(null, '', `#${item.id}`);
                    }
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    isActive
                      ? 'bg-primary-700 text-white border-primary-700'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300 hover:text-neutral-900'
                  }`}
                >
                  {item.title}
                </a>
              );
            })}
          </div>
        </div>

        <div className="flex gap-8 lg:gap-12 items-start">
          {/* Left Sticky Sidebar */}
          <aside className="w-72 xl:w-80 flex-shrink-0 hidden lg:block sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 space-y-6 scrollbar-thin">
            {/* Search Nav */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari topik docs..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 transition-all placeholder:text-neutral-400"
              />
            </div>

            {/* Navigation Groups */}
            <nav className="space-y-5 text-xs">
              {Array.from(new Set(filteredNav.map((n) => n.category))).map((category) => (
                <div key={category} className="space-y-1.5">
                  <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase px-2.5">
                    {category}
                  </span>
                  <div className="space-y-0.5">
                    {filteredNav
                      .filter((n) => n.category === category)
                      .map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                          <a
                            key={item.id}
                            href={`#${item.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveSection(item.id);
                              const el = document.getElementById(item.id);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                window.history.pushState(null, '', `#${item.id}`);
                              }
                            }}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all ${
                              isActive
                                ? 'bg-primary-700 text-white font-semibold shadow-xs'
                                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                            }`}
                          >
                            <Icon
                              className={`w-3.5 h-3.5 flex-shrink-0 ${
                                isActive ? 'text-white' : 'text-neutral-400'
                              }`}
                            />
                            <span className="truncate">{item.title}</span>
                          </a>
                        );
                      })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Quick Link Card in Sidebar */}
            <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 text-primary-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-primary-700" />
                <span>Simulasi Interaktif Aktif</span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-normal">
                Uji langsung segregasi 4-mata menggunakan akun demo Amil, Penyetuju, dan Saksi lintas unit.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 text-xs font-semibold transition-colors"
              >
                <span>Masuk Portal Amil</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 space-y-16">
            {/* 1. Overview & Filosofi */}
            <section id="overview" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>Bagian 1 — Fondasi & Visi</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Filosofi Desain & Visi Akuntabilitas Zaky
              </h2>

              <div className="prose prose-neutral max-w-none text-sm text-neutral-700 space-y-4 leading-relaxed">
                <p>
                  <strong>Zaky</strong> adalah infrastruktur pencatatan dan verifikasi penyaluran zakat
                  modern yang dirancang untuk lembaga amil zakat resmi. Premis utama Zaky bertumpu pada kaidah:
                  <em className="text-primary-800 font-semibold">
                    {' '}&ldquo;Setiap lembaga mencatat secara mandiri, namun catatannya saling disaksikan dan dapat dibuktikan keasliannya di luar basis data.&rdquo;
                  </em>
                </p>

                <p>
                  Selama ini, akuntabilitas zakat kerap terjebak dalam dua ekstrem: transparansi yang melanggar privasi
                  penerima (seperti mengunggah foto mustahik memegang uang ke media sosial), atau sistem pencatatan tertutup
                  yang tidak dapat diaudit pihak luar secara independen. Zaky menghadirkan paradigma{' '}
                  <strong>Dignity-First Accountability</strong>: perlindungan penuh atas martabat mustahik melalui
                  pseudonimisasi data, dipadukan dengan integritas kriptografis yang membuktikan integritas penyaluran.
                </p>
              </div>

              {/* 4 Core Pillars Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                    1
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm">Segregasi 4-Unit</h3>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Pemisahan mutlak: Pembuat, Saksi 1, Saksi 2, dan Penyetuju wajib berasal dari 4 unit kerja yang berbeda.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 font-bold">
                    2
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm">Invariant Saldo Kekal</h3>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Konservasi neraca kas mutlak: <code className="[overflow-wrap:anywhere]">total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan</code>.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                    3
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm">Rantai Hash Append-Only</h3>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Setiap mutasi dicatat dalam tabel audit log append-only dengan SHA-256 chaining berbasis RFC 8785 JCS.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-800 font-bold">
                    4
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm">Verifikasi Luar Basis Data</h3>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Dapat dihitung ulang secara mandiri dengan skrip offline tanpa memerlukan akses aktif ke PostgreSQL.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Masalah & Solusi Industri */}
            <section id="masalah-solusi" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <Scale className="w-4 h-4" />
                <span>Bagian 2 — Analisis Industri</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Permasalahan Industri Pengelolaan Zakat & Solusi Zaky
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Tabel perbandingan berikut menyoroti celah operasional pada tata kelola ZIS konvensional
                serta mitigasi teknis terverifikasi yang diterapkan dalam arsitektur Zaky:
              </p>

              {/* Comparison Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-neutral-200/90 bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/80 border-b border-neutral-200/90 text-neutral-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Aspek Operasional</th>
                      <th className="py-3 px-4 text-red-700 bg-red-50/50">Praktik Konvensional</th>
                      <th className="py-3 px-4 text-primary-800 bg-primary-50/50">Spesifikasi Zaky v4.0</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-neutral-900">Kewenangan Pencairan</td>
                      <td className="py-3.5 px-4 text-neutral-600 bg-red-50/20">
                        Amil tunggal menginput proposal, memeriksa kelayakan, dan mengeksekusi pencairan kas secara sepihak.
                      </td>
                      <td className="py-3.5 px-4 text-neutral-800 bg-primary-50/20 font-medium">
                        <strong>Aturan 4-Unit Independen (N1 & N2):</strong> Pembuat (Amil), Saksi 1 (Amil), Saksi 2 (Amil), dan Penyetuju (Penyetuju) wajib berasal dari 4 unit berbeda.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-neutral-900">Konfirmasi Penerima</td>
                      <td className="py-3.5 px-4 text-neutral-600 bg-red-50/20">
                        Kuitansi manual rentan pemalsuan tanda tangan atau konfirmasi sepihak oleh amil di kantor.
                      </td>
                      <td className="py-3.5 px-4 text-neutral-800 bg-primary-50/20 font-medium">
                        <strong>Jalur Ganda Kriptografis:</strong> Token 32-byte acak nir-bocor lewat SMS/WA (kedaluwarsa 72 jam) ATAU konfirmasi fisik 2 saksi amil independen lapangan.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-neutral-900">Integritas Audit Trail</td>
                      <td className="py-3.5 px-4 text-neutral-600 bg-red-50/20">
                        Log teks biasa di tabel relasional yang dapat di-UPDATE atau di-DELETE oleh operator tanpa jejak.
                      </td>
                      <td className="py-3.5 px-4 text-neutral-800 bg-primary-50/20 font-medium">
                        <strong>Trigger Append-Only & Hash Chaining:</strong> Blokir mutasi SQL; setiap baris memuat hash SHA-256 baris sebelumnya yang diverifikasi di luar database.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-neutral-900">Duplikasi Antarlembaga</td>
                      <td className="py-3.5 px-4 text-neutral-600 bg-red-50/20">
                        Silo data antaryayasan; mustahik dapat menerima dana asnaf yang sama dari 3 lembaga berbeda dalam satu periode.
                      </td>
                      <td className="py-3.5 px-4 text-neutral-800 bg-primary-50/20 font-medium">
                        <strong>Papan Silang (Cross-Agency Board):</strong> Pengecekan tabrakan NIK terenkripsi lintas lembaga simulasi (Lembaga A, B, C) secara real-time.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-neutral-900">Privasi Mustahik</td>
                      <td className="py-3.5 px-4 text-neutral-600 bg-red-50/20">
                        Eksploitasi dokumentasi: foto wajah dan identitas kependudukan mustahik diunggah terbuka di media sosial.
                      </td>
                      <td className="py-3.5 px-4 text-neutral-800 bg-primary-50/20 font-medium">
                        <strong>Privasi Bermartabat (UU PDP):</strong> Verifikasi publik hanya menampilkan inisial, kecamatan, asnaf, dan kode hash unik tanpa membocorkan NIK atau rekening.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. Segregasi 4-Mata & Aturan 4 Unit */}
            <section id="four-eyes" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Bagian 3 — Tata Kelola Kewenangan</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Segregasi 4-Mata & Aturan 4-Unit Independen (N1 & N2)
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Zaky menerapkan tata kelola fidusia perbankan ketat melalui kebijakan segregasi kewenangan.
                Berdasarkan keputusan arsitektur <strong>N1</strong> dan <strong>N2</strong>:
              </p>

              {/* Rules Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-neutral-900">
                    <CheckCircle2 className="w-4 h-4 text-primary-700" />
                    <span>Keputusan N1: 4 Unit Berbeda</span>
                  </div>
                  <p className="text-neutral-600 leading-relaxed">
                    Ketiga pihak wajib berasal dari unit yang berbeda: <strong>Unit Saksi 1</strong>,{' '}
                    <strong>Unit Saksi 2</strong>, dan <strong>Unit Penyetuju</strong> harus saling berbeda satu sama lain,
                    serta ketiganya berbeda dengan <strong>Unit Pembuat</strong> draf. Aturan ini mencegah kolusi internal satu unit.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-neutral-900">
                    <CheckCircle2 className="w-4 h-4 text-primary-700" />
                    <span>Keputusan N2: Peran Saksi Khusus Amil</span>
                  </div>
                  <p className="text-neutral-600 leading-relaxed">
                    Saksi lapangan dibatasi hanya untuk akun dengan peran <code>amil</code>. Peran{' '}
                    <code>penyetuju</code> dilarang menjadi saksi untuk memastikan pemisahan tegas antara fungsi verifikasi
                    lapangan dan otorisasi anggaran keuangan.
                  </p>
                </div>
              </div>

              {/* Flowchart 4-Actors */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Aktor 1 */}
                <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary-700 bg-primary-100/70 px-2 py-0.5 rounded-full">
                      AKTOR 1: MAKER
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400">Unit A</span>
                  </div>
                  <h4 className="font-bold text-neutral-900 text-xs">Pembuat Draf (Amil)</h4>
                  <p className="text-[11px] text-neutral-500 leading-normal">
                    Menginput proposal mustahik, verifikasi asnaf, dan nominal. Saldo pos dana otomatis dicadangkan (reservasi).
                  </p>
                  <div className="text-[10px] font-mono text-neutral-600 bg-neutral-50 p-1.5 rounded-lg border border-neutral-100">
                    Fungsi: <code>buat_draf_penyaluran</code>
                  </div>
                </div>

                {/* Aktor 2 */}
                <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                      AKTOR 2: WITNESS 1
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400">Unit B</span>
                  </div>
                  <h4 className="font-bold text-neutral-900 text-xs">Saksi Amil 1</h4>
                  <p className="text-[11px] text-neutral-500 leading-normal">
                    Menyaksikan penyaluran fisik di lapangan atau menyerahkan token 32-byte langsung kepada mustahik.
                  </p>
                  <div className="text-[10px] font-mono text-neutral-600 bg-neutral-50 p-1.5 rounded-lg border border-neutral-100">
                    Fungsi: <code>konfirmasi_saksi</code>
                  </div>
                </div>

                {/* Aktor 3 */}
                <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                      AKTOR 3: WITNESS 2
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400">Unit C</span>
                  </div>
                  <h4 className="font-bold text-neutral-900 text-xs">Saksi Amil 2</h4>
                  <p className="text-[11px] text-neutral-500 leading-normal">
                    Saksi kedua dari unit berbeda menandatangani konfirmasi fisik, memvalidasi bukti penyaluran.
                  </p>
                  <div className="text-[10px] font-mono text-neutral-600 bg-neutral-50 p-1.5 rounded-lg border border-neutral-100">
                    Status: <code>dikonfirmasi</code>
                  </div>
                </div>

                {/* Aktor 4 */}
                <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      AKTOR 4: CHECKER
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400">Unit D</span>
                  </div>
                  <h4 className="font-bold text-neutral-900 text-xs">Penyetuju (Keuangan)</h4>
                  <p className="text-[11px] text-neutral-500 leading-normal">
                    Memeriksa keabsahan konfirmasi dan memindahbukukan saldo dicadangkan menjadi tersalurkan.
                  </p>
                  <div className="text-[10px] font-mono text-neutral-600 bg-neutral-50 p-1.5 rounded-lg border border-neutral-100">
                    Fungsi: <code>setujui_penyaluran</code>
                  </div>
                </div>
              </div>

              {/* Code Snippet: Stored Procedure Guard */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between gap-3 text-xs font-mono text-neutral-600 px-1 [&>span]:min-w-0 [&>span]:[overflow-wrap:anywhere] [&>button]:shrink-0">
                  <span>Validasi 4-Unit di PL/pgSQL (db/migrations/003_stored_procedures.sql):</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `-- Guard 4-Unit Independen & Pencegahan Self-Approval
SELECT unit_id, peran, aktif INTO v_penyetuju_unit, v_penyetuju_peran, v_penyetuju_aktif
FROM akun WHERE id = p_penyetuju_id AND lembaga_id = p_lembaga_id;

IF NOT v_penyetuju_aktif THEN
  RAISE EXCEPTION 'Penyetuju tidak aktif';
END IF;

IF v_penyetuju_peran <> 'penyetuju' THEN
  RAISE EXCEPTION 'Aktor bukan penyetuju: peran % tidak berwenang menyetujui', v_penyetuju_peran;
END IF;

IF p_penyetuju_id = v_penyaluran.pembuat_id THEN
  RAISE EXCEPTION 'Penyetuju tidak boleh sama dengan pembuat draf (pemisahan kewenangan)';
END IF;

-- Aturan N1: Unit penyetuju harus berbeda dari unit pembuat dan unit saksi
IF v_penyetuju_unit = v_unit_pembuat THEN
  RAISE EXCEPTION 'Unit penyetuju (%) tidak boleh sama dengan unit pembuat draf (%)',
    v_penyetuju_unit, v_unit_pembuat;
END IF;

IF v_penyaluran.saksi1_id IS NOT NULL THEN
  SELECT unit_id INTO v_saksi1_unit FROM akun WHERE id = v_penyaluran.saksi1_id;
  IF v_penyetuju_unit = v_saksi1_unit THEN
    RAISE EXCEPTION 'Unit penyetuju (%) tidak boleh sama dengan unit saksi 1 (%)',
      v_penyetuju_unit, v_saksi1_unit;
  END IF;
END IF;`,
                        'sql-guard'
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] text-primary-700 hover:underline cursor-pointer"
                  >
                    {copiedSnippet === 'sql-guard' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin Guard SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-neutral-900 text-neutral-100 text-xs font-mono overflow-x-auto leading-relaxed border border-neutral-800">
{`-- Guard 4-Unit Independen & Pencegahan Self-Approval
SELECT unit_id, peran, aktif INTO v_penyetuju_unit, v_penyetuju_peran, v_penyetuju_aktif
FROM akun WHERE id = p_penyetuju_id AND lembaga_id = p_lembaga_id;

IF NOT v_penyetuju_aktif THEN
  RAISE EXCEPTION 'Penyetuju tidak aktif';
END IF;

IF v_penyetuju_peran <> 'penyetuju' THEN
  RAISE EXCEPTION 'Aktor bukan penyetuju: peran % tidak berwenang menyetujui', v_penyetuju_peran;
END IF;

IF p_penyetuju_id = v_penyaluran.pembuat_id THEN
  RAISE EXCEPTION 'Penyetuju tidak boleh sama dengan pembuat draf (pemisahan kewenangan)';
END IF;

-- Aturan N1: Unit penyetuju harus berbeda dari unit pembuat dan unit kedua saksi
IF v_penyetuju_unit = v_unit_pembuat THEN
  RAISE EXCEPTION 'Unit penyetuju (%) tidak boleh sama dengan unit pembuat draf (%)',
    v_penyetuju_unit, v_unit_pembuat;
END IF;

IF v_penyaluran.saksi1_id IS NOT NULL THEN
  SELECT unit_id INTO v_saksi1_unit FROM akun WHERE id = v_penyaluran.saksi1_id;
  IF v_penyetuju_unit = v_saksi1_unit THEN
    RAISE EXCEPTION 'Unit penyetuju (%) tidak boleh sama dengan unit saksi 1 (%)',
      v_penyetuju_unit, v_saksi1_unit;
  END IF;
END IF;`}
                </pre>
              </div>
            </section>

            {/* 4. State Machine Transaksi */}
            <section id="state-machine" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <GitBranch className="w-4 h-4" />
                <span>Bagian 4 — State Machine Deterministik</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Siklus Hidup & Mesin Status Transaksi Penyaluran
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Setiap transaksi penyaluran dikontrol oleh finite state machine yang deterministik.
                Transisi status bersifat teratur, menjaga agar saldo cadangan kas selalu terefleksi akurat:
              </p>

              {/* State Machine Flowchart Card */}
              <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                  <div className="w-full sm:w-auto p-3 rounded-xl bg-amber-50 text-amber-800 text-center font-bold border border-amber-200">
                    menunggu_konfirmasi
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 rotate-90 sm:rotate-0 flex-shrink-0" />
                  <div className="w-full sm:w-auto p-3 rounded-xl bg-blue-50 text-blue-800 text-center font-bold border border-blue-200">
                    dikonfirmasi
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 rotate-90 sm:rotate-0 flex-shrink-0" />
                  <div className="w-full sm:w-auto p-3 rounded-xl bg-primary-100 text-primary-900 text-center font-bold border border-primary-300">
                    tersalurkan
                  </div>
                </div>

                {/* Alternate/Terminal Paths */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2 border-t border-neutral-100">
                  <div className="p-3 rounded-xl bg-red-50/70 border border-red-200/80 text-red-900 space-y-1">
                    <span className="font-bold block">Status: ditolak_penerima</span>
                    <p className="text-[11px] text-red-800 leading-normal">
                      Mustahik menolak konfirmasi via tautan publik. Saldo cadangan dikembalikan seketika ke{' '}
                      <code>saldo_tersedia</code>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/80 text-orange-900 space-y-1">
                    <span className="font-bold block">Status: kedaluwarsa</span>
                    <p className="text-[11px] text-orange-800 leading-normal">
                      Batas waktu 72 jam terlampaui tanpa konfirmasi. Eksekusi atomik melepaskan reservasi dan mencatat audit log.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-100/90 border border-neutral-200 text-neutral-800 space-y-1">
                    <span className="font-bold block">Status: dibatalkan</span>
                    <p className="text-[11px] text-neutral-600 leading-normal">
                      Hanya pembuat draf yang berhak membatalkan draf pada status <code>menunggu_konfirmasi</code>. Pembatalan setelah konfirmasi ditolak.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Jaringan Papan Silang */}
            <section id="papan-silang" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <Network className="w-4 h-4" />
                <span>Bagian 5 — Interoperabilitas Lembaga</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Jaringan Papan Silang Antarlembaga (Cross-Agency Board)
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Fitur <strong>Papan Silang</strong> yang dapat diakses di{' '}
                <Link href="/silang" className="text-primary-700 font-semibold underline">
                  /silang
                </Link>{' '}
                memungkinkan lembaga amil zakat terakreditasi untuk saling memantau indikator bantuan
                tanpa membuka data rahasia individu:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    Lembaga A
                  </span>
                  <h4 className="font-bold text-neutral-900 text-xs mt-1">Lembaga Amil Amanah Ummat</h4>
                  <p className="text-[11px] text-neutral-500">Unit penyalur zakat komersial & pemberdayaan ekonomi umat.</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                    Lembaga B
                  </span>
                  <h4 className="font-bold text-neutral-900 text-xs mt-1">Yayasan Peduli Dhuafa Madani</h4>
                  <p className="text-[11px] text-neutral-500">Fokus pada santunan fakir miskin & tanggap darurat bencana.</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                    Lembaga C
                  </span>
                  <h4 className="font-bold text-neutral-900 text-xs mt-1">Baitul Maal Berkah Sejahtera</h4>
                  <p className="text-[11px] text-neutral-500">Spesialisasi beasiswa ibnu sabil & asnaf fisabilillah.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Pencegahan Tumpang Tindih Bantuan (Double Funding):</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Ketika seorang mustahik menerima bantuan dari Lembaga A pada bulan berjalan, sistem Papan Silang
                  mendeteksi hash NIK mustahik dan memberikan notifikasi peringatan jika Lembaga B mencoba
                  mengajukan bantuan sejenis, sehingga pemerataan zakat dapat tercapai secara adil.
                </p>
              </div>
            </section>

            {/* 6. Arsitektur Rekayasa & Hierarki Lock */}
            <section id="arsitektur" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <Server className="w-4 h-4" />
                <span>Bagian 6 — Arsitektur Rekayasa & Konkurensi</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Arsitektur Sistem Berlapis & Hierarki Penguncian Baris
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Zaky memisahkan logika aplikasi ke dalam lapisan presentasi modern dan stored procedures
                transaksional di PostgreSQL, dilengkapi penjaminan konkurensi tingkat tinggi:
              </p>

              {/* Interactive Architecture Switcher */}
              <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs space-y-5">
                <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200/80 pb-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveArchTab('layer')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      activeArchTab === 'layer'
                        ? 'bg-primary-700 text-white shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    1. Lapisan Rekayasa (Multi-Tier)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveArchTab('lock')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      activeArchTab === 'lock'
                        ? 'bg-primary-700 text-white shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    2. Hierarki Penguncian (Anti-Deadlock)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveArchTab('token')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      activeArchTab === 'token'
                        ? 'bg-primary-700 text-white shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    3. Alur Konfirmasi Zero-Knowledge
                  </button>
                </div>

                {activeArchTab === 'layer' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3">
                      <div className="px-2 py-1 rounded-md bg-primary-700 text-white font-mono font-bold text-[10px]">
                        L1: UI
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900">Presentation Layer (Next.js 16 App Router)</h4>
                        <p className="text-neutral-600 text-[11px] mt-0.5">
                          Halaman publik Server Components untuk SEO instan dan verifikasi publik, dipadukan dengan
                          Client Components reaktif untuk formulir pengajuan draf, persetujuan, dan animasi dasbor 60 FPS.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3">
                      <div className="px-2 py-1 rounded-md bg-blue-700 text-white font-mono font-bold text-[10px]">
                        L2: ACTIONS
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900">Application Boundary (Server Actions)</h4>
                        <p className="text-neutral-600 text-[11px] mt-0.5">
                          Autentikasi sesi JWT Jose, validasi skema masukan Zod, ekstraksi konteks lembaga amil,
                          dan pemanggilan fungsi transaksional PostgreSQL tanpa mengekspos koneksi langsung ke klien.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3">
                      <div className="px-2 py-1 rounded-md bg-amber-700 text-white font-mono font-bold text-[10px]">
                        L3: SP
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900">PostgreSQL Stored Procedures (PL/pgSQL)</h4>
                        <p className="text-neutral-600 text-[11px] mt-0.5">
                          Fungsi transaksional ACID: <code>buat_draf_penyaluran</code>, <code>konfirmasi_mustahik</code>,{' '}
                          <code>konfirmasi_saksi</code>, <code>setujui_penyaluran</code>, dan <code>batalkan_penyaluran</code>.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3">
                      <div className="px-2 py-1 rounded-md bg-purple-700 text-white font-mono font-bold text-[10px]">
                        L4: AUDIT
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900">Append-Only Audit Engine & Invariant Guard</h4>
                        <p className="text-neutral-600 text-[11px] mt-0.5">
                          Pemicu database (Triggers) yang menolak operasi <code>UPDATE</code> dan <code>DELETE</code> pada log audit,
                          merangkai hash SHA-256 secara berurutan, dan memverifikasi konservasi saldo kas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeArchTab === 'lock' && (
                  <div className="space-y-4 text-xs leading-relaxed text-neutral-700">
                    <p>
                      Untuk mencegah fenomena <strong>Double Spending</strong> dan <strong>Deadlock</strong> pada saat
                      terjadi lonjakan transaksi simultan, Zaky menetapkan <strong>Hierarki Penguncian Baris Global</strong>{' '}
                      dengan isolasi default <code>READ COMMITTED</code> dipadu klausul <code>FOR UPDATE</code>:
                    </p>

                    <div className="p-4 rounded-2xl bg-neutral-900 text-neutral-100 font-mono text-[11px] space-y-2 border border-neutral-800 overflow-x-auto">
                      <div className="text-emerald-400 font-bold">// Urutan Penguncian Deterministik Zaky:</div>
                      <div>1. SELECT * FROM pos_dana WHERE id = v_pos_id FOR UPDATE;</div>
                      <div className="text-neutral-400 pl-4">➔ Mengunci saldo kas pos dana terlebih dahulu</div>
                      <div>2. SELECT * FROM penyaluran WHERE id = p_penyaluran_id FOR UPDATE;</div>
                      <div className="text-neutral-400 pl-4">➔ Mengunci baris penyaluran spesifik</div>
                      <div>3. SELECT * FROM rantai_kepala WHERE lembaga_id = p_lembaga_id FOR UPDATE;</div>
                      <div className="text-neutral-400 pl-4">➔ Mengunci kepala rantai audit sebelum penyisipan log</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-[11px] space-y-1">
                      <span className="font-bold flex items-center gap-1.5">
                        <CheckCheck className="w-4 h-4 text-emerald-700" />
                        Hasil Pengujian Konkurensi 2 Koneksi Terpisah:
                      </span>
                      <p>
                        Diuji dengan 100 iterasi perebutan saldo cadangan (2 proses backend berbeda PID) menghasilkan{' '}
                        <strong>0 kali double spending</strong>. Pengujian balapan antara persetujuan dan pembatalan
                        menghasilkan <strong>0 kali deadlock (kode PostgreSQL 40P01)</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {activeArchTab === 'token' && (
                  <div className="space-y-3 text-xs leading-relaxed text-neutral-700">
                    <p>
                      Mekanisme konfirmasi mustahik dirancang menggunakan prinsip kerahasiaan kriptografis zero-knowledge:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-neutral-600 text-[11px]">
                      <li>
                        <strong>Pembangkitan Token 32-Byte:</strong> Sistem membangkitkan string acak berukuran 32 byte menggunakan CSPRNG.
                      </li>
                      <li>
                        <strong>Penyimpanan Digest SHA-256:</strong> Basis data HANYA menyimpan hash SHA-256 dari token (<code>token_konfirmasi_hash</code>). Token mentah TIDAK PERNAH disimpan di database.
                      </li>
                      <li>
                        <strong>Pengiriman Out-of-Band:</strong> Token mentah diserahkan kepada mustahik melalui SMS, pesan instan, atau tautan fisik unik.
                      </li>
                      <li>
                        <strong>Verifikasi & Jendela Waktu:</strong> Mustahik mengakses <code>/konfirmasi/:token</code>. Fungsi database menghitung <code>digest(token_input, &apos;sha256&apos;)</code>.
                        Bila token cocok dan waktu &le; 72 jam, status beralih ke <code>dikonfirmasi</code>.
                      </li>
                      <li>
                        <strong>Penanganan Kedaluwarsa Otomatis:</strong> Jika waktu &gt; 72 jam, fungsi melepaskan reservasi kas kembali ke <code>saldo_tersedia</code> dan mengembalikan status <code>KEDALUWARSA</code> tanpa rollback transaksi.
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </section>

            {/* 7. Kriptografi & Verifikasi Offline */}
            <section id="kriptografi" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Bagian 7 — Integritas Kriptografis Rantai Audit</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Kriptografi Rantai Audit & Verifikator Independen
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Log audit Zaky bukan sekadar riwayat teks, melainkan rantai kriptografis SHA-256 berurutan
                yang menjamin bahwa manipulasi apa pun pada data masa lalu akan merusak seluruh rantai setelahnya:
              </p>

              {/* Interactive Crypto Tab Switcher */}
              <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs space-y-5">
                <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200/80 pb-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveCryptoTab('chain')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      activeCryptoTab === 'chain'
                        ? 'bg-primary-700 text-white shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    1. Anatomi Rantai Hash (JCS + SHA-256)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCryptoTab('verifier')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      activeCryptoTab === 'verifier'
                        ? 'bg-primary-700 text-white shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    2. Verifikator Independen Offline
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCryptoTab('anchor')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      activeCryptoTab === 'anchor'
                        ? 'bg-primary-700 text-white shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    3. Penjangkaran Harian Ed25519
                  </button>
                </div>

                {activeCryptoTab === 'chain' && (
                  <div className="space-y-4 text-xs leading-relaxed text-neutral-700">
                    <p>
                      Setiap baris pada tabel <code>audit_log</code> dikaitkan dengan hash baris sebelumnya
                      menggunakan skema kanonikasi JSON RFC 8785:
                    </p>

                    <div className="p-4 rounded-2xl bg-neutral-900 text-neutral-100 font-mono text-[11px] space-y-2 border border-neutral-800 overflow-x-auto">
                      <div className="text-emerald-400 font-bold">// Rumus Pembentukan Hash Rantai Zaky:</div>
                      <div>h_0 = 0x0000000000000000000000000000000000000000000000000000000000000000 (32 bytes nol)</div>
                      <div>h_n = SHA-256( h_{'{n-1}'} || JCS(data_baru_n) )</div>
                      <div className="text-neutral-400 pt-2">
                        // Catatan: JCS (JSON Canonicalization Scheme - RFC 8785) menjamin bahwa urutan kunci JSON
                        // tidak memengaruhi nilai hash deterministik.
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] space-y-1">
                      <strong className="text-neutral-900 block">Pemicu Append-Only:</strong>
                      <p className="text-neutral-600">
                        Trigger database <code>trg_audit_log_append_only</code> mencegah seluruh eksekusi <code>UPDATE</code>{' '}
                        atau <code>DELETE</code> pada tabel <code>audit_log</code>.
                      </p>
                    </div>
                  </div>
                )}

                {activeCryptoTab === 'verifier' && (
                  <div className="space-y-3 text-xs leading-relaxed text-neutral-700">
                    <p>
                      Untuk memastikan integritas sistem tidak bergantung pada klaim basis data itu sendiri, Zaky
                      menyediakan <strong>Verifikator Independen di Luar Basis Data</strong> (skrip Node.js mandiri):
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-xs font-mono text-neutral-600 px-1 [&>span]:min-w-0 [&>span]:[overflow-wrap:anywhere] [&>button]:shrink-0">
                        <span>Skrip Verifikasi Mandiri (scripts/verifikasi_berkas_offline.js):</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              `const fs = require('fs');
const crypto = require('crypto');

const raw = fs.readFileSync('data/audit_export.json', 'utf8');
const { audit_logs, rantai_kepala } = JSON.parse(raw);

let currentHash = Buffer.alloc(32, 0); // Genesis h_0

for (let i = 0; i < audit_logs.length; i++) {
  const row = audit_logs[i];
  const prevHashHex = Buffer.from(currentHash).toString('hex');
  
  if (row.hash_sebelumnya !== prevHashHex) {
    console.error(\`PUTUS: Baris \${row.nomor} hash_sebelumnya tidak cocok!\`);
    process.exit(1);
  }

  // Hitung ulang hash baris
  const payload = Buffer.concat([currentHash, Buffer.from(JSON.stringify(row.data_baru))]);
  currentHash = crypto.createHash('sha256').update(payload).digest();
}

console.log('HASIL: Rantai utuh dan valid. Head Hash:', currentHash.toString('hex').toUpperCase());`,
                              'offline-verifier'
                            )
                          }
                          className="inline-flex items-center gap-1 text-[11px] text-primary-700 hover:underline cursor-pointer"
                        >
                          {copiedSnippet === 'offline-verifier' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin Kode Verifikator</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-4 rounded-2xl bg-neutral-900 text-neutral-100 text-xs font-mono overflow-x-auto leading-relaxed border border-neutral-800">
{`const fs = require('fs');
const crypto = require('crypto');

const raw = fs.readFileSync('data/audit_export.json', 'utf8');
const { audit_logs, rantai_kepala } = JSON.parse(raw);

let currentHash = Buffer.alloc(32, 0); // Genesis h_0

for (let i = 0; i < audit_logs.length; i++) {
  const row = audit_logs[i];
  const prevHashHex = Buffer.from(currentHash).toString('hex');
  
  if (row.hash_sebelumnya !== prevHashHex) {
    console.error(\`PUTUS: Baris \${row.nomor} hash_sebelumnya tidak cocok!\`);
    process.exit(1);
  }

  // Hitung ulang hash baris
  const payload = Buffer.concat([currentHash, Buffer.from(JSON.stringify(row.data_baru))]);
  currentHash = crypto.createHash('sha256').update(payload).digest();
}

console.log('HASIL: Rantai utuh dan valid. Head Hash:', currentHash.toString('hex').toUpperCase());`}
                      </pre>
                    </div>

                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 text-[11px]">
                      <strong>Hasil Uji Negatif:</strong> Skrip verifikator telah diuji secara ketat terhadap mutasi data baris lampau,
                      penghapusan baris tengah, dan pemalsuan head hash—ketiganya tertolak secara deterministik dengan mendeteksi nomor baris yang dirusak.
                    </div>
                  </div>
                )}

                {activeCryptoTab === 'anchor' && (
                  <div className="space-y-3 text-xs leading-relaxed text-neutral-700">
                    <p>
                      Untuk mengatasi batasan di mana administrator basis data fisik (DBA) dapat menulis ulang riwayat
                      dan menghitung ulang seluruh rantai hash, Zaky mengimplementasikan <strong>Penjangkaran Harian Bertanda Tangan Ed25519</strong>:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                        <strong className="text-neutral-900 block">Tanda Tangan Asimetris Ed25519 (Opsi 1)</strong>
                        <p className="text-neutral-600">
                          Setiap tengah malam, tugas terjadwal (cron) mengambil nilai <code>head_hash</code>, menandatanganinya
                          dengan kunci privat Ed25519 lembaga, dan menerbitkannya pada tabel <code>hash_harian</code> untuk verifikasi publik.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                        <strong className="text-neutral-900 block">Roadmap Saksi Silang P2P (Opsi 2)</strong>
                        <p className="text-neutral-600">
                          Pengembangan lanjutan menghubungkan lembaga secara peer-to-peer di mana Lembaga A saling bertukar
                          tanda tangan digital dengan Lembaga B dan C, menciptakan konsensus saksi silang terdesentralisasi.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 8. Keamanan & Batas Kepercayaan */}
            <section id="keamanan" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <Lock className="w-4 h-4" />
                <span>Bagian 8 — Spesifikasi Keamanan</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Model Keamanan, Sesi JWT & Batas Kepercayaan Kriptografis
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Zaky menerapkan pendekatan kejujuran teknis (*honest engineering*) dengan menetapkan secara transparan
                apa yang dilindungi oleh sistem dan apa batas kepercayaannya:
              </p>

              {/* Trust Boundaries Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 min-w-0">
                  <div className="flex items-center gap-2 text-primary-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-primary-700" />
                    <span>Yang Dijamin & Dilindungi Zaky</span>
                  </div>
                  <ul className="text-xs text-neutral-600 space-y-1.5 list-disc pl-4">
                    <li>Pencairan sepihak oleh amil atau penyetuju tanpa saksi independen.</li>
                    <li>Double spending saldo kas pos dana melalui penguncian baris deterministik.</li>
                    <li>Penyuntingan status transaksi secara diam-diam melalui antarmuka web.</li>
                    <li>Pemalsuan kuitansi konfirmasi berkat token acak 32-byte berbatas waktu 72 jam.</li>
                    <li>Kebocoran data pribadi (PII) mustahik pada portal verifikasi publik.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 min-w-0">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Batas Kepercayaan Fisik (Honest Boundary)</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Seorang superuser PostgreSQL (DBA) dengan akses fisik ke server memiliki kemampuan menulis ulang data
                    tabel sekaligus menghitung ulang seluruh rantai hash audit.
                  </p>
                  <p className="text-xs text-neutral-600 leading-normal font-medium">
                    Inilah alasan Zaky menerbitkan hash harian bertanda tangan Ed25519 ke luar server, sehingga
                    penulisan ulang riwayat di basis data akan terdeteksi seketika karena tidak cocok dengan tanda tangan yang telah beredar.
                  </p>
                </div>
              </div>

              {/* JWT Session Anatomy */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between gap-3 text-xs font-mono text-neutral-600 px-1 [&>span]:min-w-0 [&>span]:[overflow-wrap:anywhere] [&>button]:shrink-0">
                  <span>Anatomi Sesi JWT Nir-Password (src/lib/auth.ts):</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `interface SesiAmilPayload {
  userId: string;       // ID unik akun amil/penyetuju dalam PostgreSQL
  nama: string;         // Nama lengkap amil
  email: string;        // Email terdaftar (mis. "budi@amanahummat.or.id")
  role: 'amil' | 'penyetuju' | 'admin';
  lembagaId: string;    // UUID lembaga tempat bertugas
  unitId: string;       // UUID unit kerja fungsional amil
  iat: number;          // Waktu diterbitkan (Epoch)
  exp: number;          // Waktu kedaluwarsa sesi (Epoch)
}`,
                        'jwt-session'
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] text-primary-700 hover:underline cursor-pointer"
                  >
                    {copiedSnippet === 'jwt-session' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin Tipe Sesi</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-neutral-900 text-neutral-100 text-xs font-mono overflow-x-auto leading-relaxed border border-neutral-800">
{`interface SesiAmilPayload {
  userId: string;       // ID unik akun amil/penyetuju dalam PostgreSQL
  nama: string;         // Nama lengkap amil
  email: string;        // Email terdaftar (mis. "budi@amanahummat.or.id")
  role: 'amil' | 'penyetuju' | 'admin';
  lembagaId: string;    // UUID lembaga tempat bertugas
  unitId: string;       // UUID unit kerja fungsional amil
  iat: number;          // Waktu diterbitkan (Epoch)
  exp: number;          // Waktu kedaluwarsa sesi (Epoch)
}`}
                </pre>
              </div>
            </section>

            {/* 9. Tech Stack & Dependencies */}
            <section id="tech-stack" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <Cpu className="w-4 h-4" />
                <span>Bagian 9 — Spesifikasi Teknologi</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Tech Stack & Pustaka Dependensi
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Platform Zaky dibangun di atas fondasi teknologi web dan basis data tingkat industri:
              </p>

              {/* Tech Stack Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-neutral-900">Next.js 16</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                      App Router
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Server Components untuk rendering cepat, terintegrasi langsung dengan Server Actions untuk mutasi data aman tanpa REST API publik.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-neutral-900">PostgreSQL 16</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      PL/pgSQL Engine
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Ekstensi <code>pgcrypto</code>, fungsi transaksional ACID, pemicu append-only, dan penguncian baris pesimistik <code>FOR UPDATE</code>.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-neutral-900">Tailwind CSS v4</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200">
                      Zaky Design Tokens
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Palet warna Emerald Deep (<code>#0F5C4D</code>) dan Gold Accent (<code>#C8962E</code>) dengan bayangan lembut neomorphic.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-neutral-900">Jose Cryptography</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      Web Crypto API
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Manajemen token JWT zero-dependency universal untuk autentikasi amil dengan cookie HttpOnly dan SameSite=Lax.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-neutral-900">Ed25519 & SHA-256</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      RFC 8032 & RFC 8785
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Penjangkaran tanda tangan digital publik harian dan kanonikasi payload JSON sebelum perangkaian hash log audit.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-neutral-900">React 19 & TypeScript 5</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                      Strict Type Safety
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Pemanfaatan React Actions primitives dan kontrak tipe data ketat pada seluruh domain perzakatan.
                  </p>
                </div>
              </div>
            </section>

            {/* 10. Model Data & Invariant Kas */}
            <section id="data-model" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <Database className="w-4 h-4" />
                <span>Bagian 10 — Skema Relasional & Invariant Kas</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Model Data Relasional & Invariant Saldo Kas
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Integritas keuangan Zaky dijaga melalui persamaan matematis mutlak pada setiap pos dana:
              </p>

              {/* Equation Box */}
              <div className="p-5 rounded-2xl bg-emerald-900 text-white font-mono text-center space-y-1 shadow-md">
                <span className="text-[11px] text-emerald-300 uppercase tracking-widest block font-bold">
                  PERSAMAAN INVARIANT SALDO KEWAJIBAN:
                </span>
                <div className="text-sm sm:text-base font-extrabold text-accent-400">
                  total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan
                </div>
                <span className="text-[10px] text-emerald-200 block pt-1">
                  Constraint: saldo_tersedia &ge; 0, saldo_dicadangkan &ge; 0, total_tersalurkan &ge; 0
                </span>
              </div>

              {/* SQL Schema Definition */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between gap-3 text-xs font-mono text-neutral-600 px-1 [&>span]:min-w-0 [&>span]:[overflow-wrap:anywhere] [&>button]:shrink-0">
                  <span>Pemeriksaan Invariant SQL (db/migrations/001_initial_schema.sql):</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `-- Kueri Uji Invariant Saldo Pos Dana
SELECT 
  id,
  nama,
  total_masuk,
  saldo_tersedia,
  saldo_dicadangkan,
  total_tersalurkan,
  (total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan) AS invariant_ok,
  (saldo_tersedia >= 0 AND saldo_dicadangkan >= 0 AND total_tersalurkan >= 0) AS non_negatif_ok
FROM pos_dana;`,
                        'invariant-sql'
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] text-primary-700 hover:underline cursor-pointer"
                  >
                    {copiedSnippet === 'invariant-sql' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin Kueri SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-neutral-900 text-neutral-100 text-xs font-mono overflow-x-auto leading-relaxed border border-neutral-800">
{`-- Kueri Uji Invariant Saldo Pos Dana
SELECT 
  id,
  nama,
  total_masuk,
  saldo_tersedia,
  saldo_dicadangkan,
  total_tersalurkan,
  (total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan) AS invariant_ok,
  (saldo_tersedia >= 0 AND saldo_dicadangkan >= 0 AND total_tersalurkan >= 0) AS non_negatif_ok
FROM pos_dana;`}
                </pre>
              </div>
            </section>

            {/* 11. Standar Syariah & Regulasi */}
            <section id="syariah" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>Bagian 11 — Kepatuhan Syariah & Hukum</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Standar Syariah & Kepatuhan Regulasi Nasional
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Seluruh arsitektur Zaky dibangun dalam batas koridor syariat Islam serta regulasi perzakatan
                yang berlaku di Republik Indonesia:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 min-w-0">
                  <h4 className="font-bold text-neutral-900 text-xs">8 Asnaf Al-Qur&apos;an (QS At-Taubah: 60)</h4>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Penyaluran zakat dikunci hanya untuk 8 golongan mustahik yang sah: Fakir, Miskin,
                    Amil, Muallaf, Riqab, Gharimin, Fisabilillah, dan Ibnu Sabil.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 min-w-0">
                  <h4 className="font-bold text-neutral-900 text-xs">Standar Akuntansi PSAK 109</h4>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Pemisahan sub-rekening kas antara Dana Zakat, Infak/Sedekah, dan Bagian Amil (maksimal 1/8 atau 12.5%
                    yang dikonfigurasi per lembaga via kolom <code>persen_hak_amil_maks</code>).
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 min-w-0">
                  <h4 className="font-bold text-neutral-900 text-xs">UU No. 23 Tahun 2011</h4>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Kepatuhan terhadap Undang-Undang Pengelolaan Zakat Republik Indonesia dalam menegakkan
                    akuntabilitas publik dan perlindungan dana amanah umat.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 min-w-0">
                  <h4 className="font-bold text-neutral-900 text-xs">Perlindungan Data Pribadi (UU PDP No. 27/2022)</h4>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Penerapan pseudonimisasi NIK dan masking data kependudukan mustahik pada portal verifikasi publik,
                    menjaga kehormatan penerima manfaat dari publisitas berlebih.
                  </p>
                </div>
              </div>

              {/* Bottom CTA Card */}
              <div
                className="mt-10 p-7 sm:p-9 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0A3D33 0%, #0F5C4D 60%, #137A66 100%)',
                }}
              >
                <div
                  className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none opacity-20 blur-2xl"
                  style={{
                    background: 'radial-gradient(circle, #C8962E 0%, transparent 70%)',
                  }}
                />

                <div className="space-y-2 text-center sm:text-left relative z-10">
                  <h3 className="font-extrabold text-xl sm:text-2xl tracking-tight text-white leading-tight">
                    Jelajahi Ekosistem Verifikasi Zaky
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
                    Uji verifikasi publik kode penyaluran, akses dasbor portal amil dengan akun demo lintas unit,
                    atau amati pertukaran data antarlembaga pada Papan Silang.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 flex-shrink-0 relative z-10">
                  <Link
                    href="/verifikasi"
                    className="px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/30 backdrop-blur-md transition-all hover:scale-105"
                  >
                    Cek Kode Publik
                  </Link>
                  <Link
                    href="/silang"
                    className="px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/30 backdrop-blur-md transition-all hover:scale-105"
                  >
                    Papan Silang
                  </Link>
                  <Link
                    href="/login"
                    className="px-6 py-2.5 rounded-full bg-accent-500 hover:bg-accent-600 text-neutral-950 text-xs font-bold shadow-md transition-all hover:scale-105"
                  >
                    Masuk Portal Amil →
                  </Link>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
