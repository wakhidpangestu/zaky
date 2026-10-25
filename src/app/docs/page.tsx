'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageNavbar from '@/components/navigation/page-navbar';
import Card3D from '@/components/landing/card-3d';
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
  Sparkles,
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
  { id: 'four-eyes', title: '3. Segregasi 4-Mata (Four-Eyes)', category: 'TATA KELOLA', icon: Users },
  { id: 'state-machine', title: '4. Siklus & State Machine', category: 'TATA KELOLA', icon: GitBranch },
  { id: 'papan-silang', title: '5. Jaringan Papan Silang', category: 'TATA KELOLA', icon: Network },
  { id: 'arsitektur', title: '6. Arsitektur Sistem Modular', category: 'TEKNOLOGI', icon: Server },
  { id: 'tech-stack', title: '7. Tech Stack & Dependencies', category: 'TEKNOLOGI', icon: Cpu },
  { id: 'keamanan', title: '8. Keamanan & Sesi JWT', category: 'KEAMANAN', icon: Lock },
  { id: 'data-model', title: '9. Model Data TypeScript', category: 'SPESIFIKASI', icon: Code2 },
  { id: 'syariah', title: '10. Standar Syariah & Regulasi', category: 'KEPATUHAN', icon: Award },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeArchTab, setActiveArchTab] = useState<'layer' | 'flow' | 'security'>('layer');

  // Copy helper
  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // Intersection Observer for scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -60% 0px',
        threshold: 0.1,
      }
    );

    NAV_SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const filteredNav = NAV_SECTIONS.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F4F7F5] selection:bg-primary-100 selection:text-primary-900 font-sans text-neutral-900">
      {/* Universal Smooth Navbar */}
      <PageNavbar variant="docs" />

      {/* Hero Header Banner */}
      <div className="relative pt-28 pb-14 overflow-hidden border-b border-neutral-200/80 bg-gradient-to-b from-white via-white to-[#F4F7F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100/80 border border-primary-200/90 text-primary-900 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-accent-500" />
              <span>DOKUMENTASI TEKNIS & SPESIFIKASI ARSITEKTUR</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 leading-tight">
              Arsitektur, Filosofi & <br />
              <span className="text-primary-700">Tech Stack Platform Zaky</span>
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              Panduan teknis menyeluruh mengenai tata kelola penyaluran zakat akuntabel berbasis
              segregasi kewenangan 4-mata (Maker-Checker-Witness), verifikasi publik nir-manipulasi,
              papan koordinasi silang antarlembaga, serta arsitektur full-stack modern Next.js 16.
            </p>

            {/* Quick Metadata Chips */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200">
                Next.js 16.0 (App Router)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200">
                React 19 & Server Actions
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200">
                Tailwind CSS v4
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200">
                Jose JWT Auth
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-primary-100/70 text-primary-800 border border-primary-200 font-semibold">
                Four-Eyes Principle
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container: Sidebar + Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-24 sm:pb-32">
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
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all ${
                              isActive
                                ? 'bg-primary-700 text-white font-semibold shadow-xs'
                                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
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
                Uji langsung segregasi 4-mata menggunakan akun demo Amil, Penyetuju, dan Saksi.
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
                Detail Zaky & Filosofi Tata Kelola
              </h2>

              <div className="prose prose-neutral max-w-none text-sm text-neutral-700 space-y-4 leading-relaxed">
                <p>
                  <strong>Zaky</strong> adalah sistem arsitektur akuntabilitas dan penyaluran dana zakat
                  modern yang dirancang untuk mengatasi krisis kepercayaan dan asimetri informasi dalam
                  pengelolaan ZIS (Zakat, Infak, dan Sedekah). Platform ini menjembatani tiga pemangku
                  kepentingan utama: <strong>Muzakki</strong> (pembayar zakat), <strong>Amil</strong> (pengelola
                  dan verifikator lapangan), dan <strong>Mustahik</strong> (penerima manfaat yang berhak).
                </p>

                <p>
                  Filosofi sentral Zaky adalah <em>&ldquo;Akuntabilitas Berpusat pada Martabat (Dignity-First
                  Accountability)&rdquo;</em>. Zaky menolak pendekatan keterbukaan konvensional yang
                  sering kali mengekspos identitas pribadi (seperti NIK, alamat rumah lengkap, atau foto wajah
                  mustahik) secara telanjang ke ruang publik demi dalih transparansi. Sebagai gantinya,
                  Zaky menerapkan <strong>verifikasi kriptografis berbasis kode publik</strong> yang membuktikan
                  keabsahan transaksi tanpa mengorbankan privasi penerima.
                </p>
              </div>

              {/* 3 Core Pillars Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                    1
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm">Segregation of Duties</h3>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Pemisahan mutlak kewenangan antara penginput proposal, pemeriksa kas keuangan,
                    dan dua saksi independen. Tidak ada individu yang dapat mencairkan dana secara sepihak.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 font-bold">
                    2
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm">Tamper-Evident Audit Trail</h3>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Setiap aksi mutasi status dicatat dalam log peristiwa yang tidak dapat disunting surut
                    (immutable), dilengkapi stempel waktu, tanda tangan aktor, dan kode unik publik.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                    3
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm">Jaringan Papan Silang</h3>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Protokol pertukaran data antarlembaga amil zakat terakreditasi untuk mendeteksi
                    duplikasi penerima manfaat (double funding) secara real-time.
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
                Permasalahan Penyaluran Zakat & Solusi Zaky
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Tabel berikut menguraikan kelemahan mendasar dalam sistem operasional penyaluran zakat
                konvensional dan bagaimana arsitektur teknis Zaky menyelesaikannya secara sistemis:
              </p>

              {/* Comparison Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-neutral-200/90 bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/80 border-b border-neutral-200/90 text-neutral-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Aspek Operasional</th>
                      <th className="py-3 px-4 text-red-700 bg-red-50/50">Praktik Konvensional</th>
                      <th className="py-3 px-4 text-primary-800 bg-primary-50/50">Pendekatan Zaky</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-neutral-900">Kewenangan Pencairan</td>
                      <td className="py-3.5 px-4 text-neutral-600 bg-red-50/20">
                        Satu petugas lapangan sering kali memiliki akses mengajukan sekaligus mengeksekusi uang kas.
                      </td>
                      <td className="py-3.5 px-4 text-neutral-800 bg-primary-50/20 font-medium">
                        <strong>Segregasi 4-Mata Wajib:</strong> Pengajuan oleh Pelayanan, validasi saldo oleh Keuangan, dan approval ganda oleh Saksi 1 & Saksi 2.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-neutral-900">Verifikasi Publik</td>
                      <td className="py-3.5 px-4 text-neutral-600 bg-red-50/20">
                        Laporan PDF tahunan statis berbulan-bulan setelah dana tersalurkan, rentan dimanipulasi.
                      </td>
                      <td className="py-3.5 px-4 text-neutral-800 bg-primary-50/20 font-medium">
                        <strong>Cek Kode Publik Real-Time:</strong> Siapa pun dapat memasukkan kode transaksi di <code>/verifikasi</code> untuk memvalidasi jejak status detik ini juga.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-neutral-900">Duplikasi Bantuan</td>
                      <td className="py-3.5 px-4 text-neutral-600 bg-red-50/20">
                        Silo data antarlembaga (Lembaga A tidak tahu jika mustahik X sudah menerima zakat dari Lembaga B di minggu yang sama).
                      </td>
                      <td className="py-3.5 px-4 text-neutral-800 bg-primary-50/20 font-medium">
                        <strong>Papan Silang Antarlembaga:</strong> Sinkronisasi status mustahik lintas Lembaga A, B, dan C dengan indikator peringatan tumpang tindih.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-neutral-900">Privasi Mustahik</td>
                      <td className="py-3.5 px-4 text-neutral-600 bg-red-50/20">
                        Foto mustahik memegang papan nama atau kwitansi disebar luas di media sosial sebagai bukti &ldquo;transparansi&rdquo;.
                      </td>
                      <td className="py-3.5 px-4 text-neutral-800 bg-primary-50/20 font-medium">
                        <strong>Privasi Bermartabat:</strong> Hanya menampilkan inisial nama, kecamatan/kota, asnaf, dan token bukti transfer bank/tunai terverifikasi.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. Segregasi 4-Mata (Four-Eyes Principle) */}
            <section id="four-eyes" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Bagian 3 — Tata Kelola Kewenangan</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Prinsip 4-Mata (Maker-Checker-Witness)
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Prinsip 4-Mata (*Four-Eyes Principle*) adalah standar tata kelola perbankan dan fidusia
                tingkat tinggi yang diwajibkan dalam Zaky. Tidak ada satu pun transaksi penyaluran yang
                dapat diselesaikan tanpa persetujuan dari setidaknya tiga peran yang terpisah secara struktural:
              </p>

              {/* Step Flowchart Visual */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
                {/* Step 1: Maker */}
                <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary-700 bg-primary-100/70 px-2 py-0.5 rounded-full">
                      TAHAP 1: MAKER
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400">#01</span>
                  </div>
                  <h4 className="font-bold text-neutral-900 text-xs">Amil / Pelayanan</h4>
                  <p className="text-[11px] text-neutral-500 leading-normal">
                    Menginput profil mustahik, verifikasi 8 asnaf, nominal kebutuhan, dan dokumen faktual.
                  </p>
                  <div className="pt-1 text-[10px] font-mono text-neutral-600 bg-neutral-50 p-1.5 rounded-lg border border-neutral-100">
                    Status: <span className="text-amber-700 font-bold">DRAFT ➔ MENUNGGU</span>
                  </div>
                </div>

                {/* Step 2: Checker */}
                <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                      TAHAP 2: CHECKER
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400">#02</span>
                  </div>
                  <h4 className="font-bold text-neutral-900 text-xs">Penyetuju / Keuangan</h4>
                  <p className="text-[11px] text-neutral-500 leading-normal">
                    Menguji likuiditas kas rekening asnaf, kelayakan plafon anggaran, dan kepatuhan SOP internal.
                  </p>
                  <div className="pt-1 text-[10px] font-mono text-neutral-600 bg-neutral-50 p-1.5 rounded-lg border border-neutral-100">
                    Status: <span className="text-blue-700 font-bold">MENUNGGU_SAKSI</span>
                  </div>
                </div>

                {/* Step 3: Witness */}
                <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                      TAHAP 3: WITNESS
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400">#03</span>
                  </div>
                  <h4 className="font-bold text-neutral-900 text-xs">Saksi 1 & Saksi 2</h4>
                  <p className="text-[11px] text-neutral-500 leading-normal">
                    Dua saksi independen (Pengawas Syariah/Publik) menandatangani validitas usulan secara terpisah.
                  </p>
                  <div className="pt-1 text-[10px] font-mono text-neutral-600 bg-neutral-50 p-1.5 rounded-lg border border-neutral-100">
                    Status: <span className="text-emerald-700 font-bold">DISETUJUI</span>
                  </div>
                </div>

                {/* Step 4: Public Audit */}
                <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      TAHAP 4: AUDIT
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400">#04</span>
                  </div>
                  <h4 className="font-bold text-neutral-900 text-xs">Publik & Mustahik</h4>
                  <p className="text-[11px] text-neutral-500 leading-normal">
                    Kode verifikasi diterbitkan untuk umum. Penerima mengonfirmasi penerimaan manfaat via portal/SMS.
                  </p>
                  <div className="pt-1 text-[10px] font-mono text-neutral-600 bg-neutral-50 p-1.5 rounded-lg border border-neutral-100">
                    Status: <span className="text-emerald-800 font-bold">TERSALURKAN</span>
                  </div>
                </div>
              </div>

              {/* Code Snippet: RBAC Segregation Guard */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-600 px-1">
                  <span>Implementasi Server Action Guard:</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `// Server Action Segregation Guard di src/app/actions/transaksi.ts
export async function setujuiTransaksi(transaksiId: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthenticated');
  
  // Strict Segregation: Hanya role PENYETUJU yang dapat menyetujui tahap keuangan
  if (session.role !== 'PENYETUJU') {
    throw new Error('Akses Ditolak: Hanya bagian Keuangan yang berhak memvalidasi');
  }

  const transaksi = await db.transaksi.findUnique(transaksiId);
  // Anti-Self-Approval: Pengaju tidak boleh merangkap sebagai penyetuju
  if (transaksi.pembuatId === session.userId) {
    throw new Error('Pelanggaran Segregasi: Pembuat proposal dilarang menyetujui transaksi sendiri');
  }

  return await db.transaksi.update({
    id: transaksiId,
    status: 'MENUNGGU_SAKSI',
    audit: { actor: session.email, action: 'APPROVE_KEUANGAN' }
  });
}`,
                        'guard-code'
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] text-primary-700 hover:underline cursor-pointer"
                  >
                    {copiedSnippet === 'guard-code' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-neutral-900 text-neutral-100 text-xs font-mono overflow-x-auto leading-relaxed border border-neutral-800">
{`// Server Action Segregation Guard di src/app/actions/transaksi.ts
export async function setujuiTransaksi(transaksiId: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthenticated');
  
  // Strict Segregation: Hanya role PENYETUJU yang dapat menyetujui tahap keuangan
  if (session.role !== 'PENYETUJU') {
    throw new Error('Akses Ditolak: Hanya bagian Keuangan yang berhak memvalidasi');
  }

  const transaksi = await db.transaksi.findUnique(transaksiId);
  // Anti-Self-Approval: Pengaju tidak boleh merangkap sebagai penyetuju
  if (transaksi.pembuatId === session.userId) {
    throw new Error('Pelanggaran Segregasi: Pembuat proposal dilarang menyetujui transaksi sendiri');
  }

  return await db.transaksi.update({
    id: transaksiId,
    status: 'MENUNGGU_SAKSI',
    audit: { actor: session.email, action: 'APPROVE_KEUANGAN' }
  });
}`}
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
                Siklus Hidup & State Machine Transaksi
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Setiap transaksi penyaluran dikontrol oleh finite state machine yang deterministik.
                Transisi status bersifat searah dan tidak dapat dibatalkan secara diam-diam:
              </p>

              {/* State Machine Flowchart Card */}
              <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                  <div className="w-full sm:w-auto p-3 rounded-xl bg-neutral-100 text-neutral-700 text-center font-bold border border-neutral-200">
                    DRAFT
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 rotate-90 sm:rotate-0 flex-shrink-0" />
                  <div className="w-full sm:w-auto p-3 rounded-xl bg-amber-50 text-amber-800 text-center font-bold border border-amber-200">
                    MENUNGGU_PERSETUJUAN
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 rotate-90 sm:rotate-0 flex-shrink-0" />
                  <div className="w-full sm:w-auto p-3 rounded-xl bg-blue-50 text-blue-800 text-center font-bold border border-blue-200">
                    MENUNGGU_SAKSI
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 rotate-90 sm:rotate-0 flex-shrink-0" />
                  <div className="w-full sm:w-auto p-3 rounded-xl bg-emerald-50 text-emerald-800 text-center font-bold border border-emerald-200">
                    DISETUJUI
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 rotate-90 sm:rotate-0 flex-shrink-0" />
                  <div className="w-full sm:w-auto p-3 rounded-xl bg-primary-100 text-primary-900 text-center font-bold border border-primary-300">
                    TERSALURKAN
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 text-xs text-neutral-500 space-y-1">
                  <p>
                    <strong>Jalur Penolakan:</strong> Jika Keuangan menolak pada tahap{' '}
                    <code>MENUNGGU_PERSETUJUAN</code>, status berpindah ke <code>DITOLAK</code> dengan
                    catatan alasan penolakan yang wajib diisi dan dicatat dalam audit trail.
                  </p>
                  <p>
                    <strong>Dual-Witness Signing:</strong> Pada tahap <code>MENUNGGU_SAKSI</code>, sistem
                    menunggu konfirmasi dari Saksi 1 DAN Saksi 2. Transaksi baru berubah menjadi{' '}
                    <code>DISETUJUI</code> setelah kedua saksi memberikan tanda tangan digital.
                  </p>
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
                Jaringan Papan Silang Antarlembaga
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Salah satu inovasi penting dalam Zaky adalah halaman <strong>Papan Silang (Cross-Agency Board)</strong>{' '}
                yang dapat diakses di <Link href="/silang" className="text-primary-700 font-semibold underline">/silang</Link>.
                Halaman ini menghubungkan tiga lembaga amil zakat simulasi:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    Lembaga A
                  </span>
                  <h4 className="font-bold text-neutral-900 text-xs mt-1">Lembaga Amil Amanah Ummat</h4>
                  <p className="text-[11px] text-neutral-500">Unit penyalur zakat komersial & pemberdayaan ekonomi.</p>
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
                  <span>Pencegahan Double Funding:</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Ketika seorang mustahik terdaftar di Lembaga A dan menerima bantuan modal usaha pada bulan berjalan,
                  sistem Papan Silang akan otomatis menampilkan indikator peringatan jika Lembaga B mencoba
                  mengajukan bantuan sejenis untuk mustahik yang sama, memastikan pemerataan zakat yang adil.
                </p>
              </div>
            </section>

            {/* 6. Arsitektur Sistem Modular */}
            <section id="arsitektur" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <Server className="w-4 h-4" />
                <span>Bagian 6 — Arsitektur Rekayasa Perangkat Lunak</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Arsitektur Sistem Modular
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Zaky dibangun menggunakan paradigma arsitektur berorientasi layanan (*service-oriented*)
                dengan pemisahan berlapis (*layered architecture*), memanfaatkan keunggulan Next.js 16 App Router:
              </p>

              {/* Interactive Architecture Switcher */}
              <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs space-y-5">
                <div className="flex items-center gap-2 border-b border-neutral-200/80 pb-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveArchTab('layer')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      activeArchTab === 'layer'
                        ? 'bg-primary-700 text-white shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    1. Lapisan Sistem (Layers)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveArchTab('flow')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      activeArchTab === 'flow'
                        ? 'bg-primary-700 text-white shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    2. Alur Eksekusi Server Actions
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveArchTab('security')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      activeArchTab === 'security'
                        ? 'bg-primary-700 text-white shadow-2xs'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    3. Model Enkapsulasi Keamanan
                  </button>
                </div>

                {activeArchTab === 'layer' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3">
                      <div className="px-2 py-1 rounded-md bg-primary-700 text-white font-mono font-bold text-[10px]">
                        L1: UI
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900">Presentation Layer</h4>
                        <p className="text-neutral-600 text-[11px] mt-0.5">
                          React 19 Server Components untuk halaman publik (SEO & instant streaming),
                          dikombinasikan dengan Client Islands (3D Card Engine, GSAP scroll morph navbar,
                          dan modal transaksi interaktif).
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3">
                      <div className="px-2 py-1 rounded-md bg-blue-700 text-white font-mono font-bold text-[10px]">
                        L2: API
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900">Boundary & Server Actions Layer</h4>
                        <p className="text-neutral-600 text-[11px] mt-0.5">
                          Eksekusi mutasi berbasis fungsi server murni (Next.js Server Actions),
                          terlindungi dari CSRF, serta divalidasi dengan RBAC guard sebelum data menyentuh storage.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3">
                      <div className="px-2 py-1 rounded-md bg-amber-700 text-white font-mono font-bold text-[10px]">
                        L3: BIZ
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900">Domain Logic & State Engine</h4>
                        <p className="text-neutral-600 text-[11px] mt-0.5">
                          Mesin kalkulasi 8 asnaf, audit trail recorder, validator saldo kas per lembaga,
                          dan sinkronisasi silang antarlembaga.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3">
                      <div className="px-2 py-1 rounded-md bg-purple-700 text-white font-mono font-bold text-[10px]">
                        L4: STORE
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900">In-Memory Event Store & Session Engine</h4>
                        <p className="text-neutral-600 text-[11px] mt-0.5">
                          Penyimpanan in-memory reaktif dengan mutator atomik, kemampuan reset data simulasi instan,
                          dan enkripsi cookie sesi JWT berbasis Web Cryptography API.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeArchTab === 'flow' && (
                  <div className="space-y-3 text-xs leading-relaxed text-neutral-700">
                    <p>
                      Setiap interaksi pengguna (seperti pengajuan proposal, persetujuan keuangan, dan kesaksian)
                      dieksekusi melalui pipeline Server Actions yang ketat:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-neutral-600 text-[11px]">
                      <li>
                        <strong>Request Invocation:</strong> Client form memanggil Server Action dengan payload terenkapsulasi.
                      </li>
                      <li>
                        <strong>JWT Session Extraction:</strong> Server memverifikasi token cookie HttpOnly menggunakan pustaka Jose.
                      </li>
                      <li>
                        <strong>RBAC Permission Check:</strong> Memastikan aktor memiliki hak akses peran (Role) yang sesuai dengan tahap transaksi.
                      </li>
                      <li>
                        <strong>Anti-Self Approval Guard:</strong> Memastikan aktor yang menyetujui berbeda dari aktor pembuat.
                      </li>
                      <li>
                        <strong>Atomic State Mutation:</strong> Transaksi diperbarui dan entri riwayat audit baru dicatat secara bersamaan.
                      </li>
                      <li>
                        <strong>Optimistic UI Revalidation:</strong> Next.js me-revalidate path terkait dan mengembalikan state baru ke client.
                      </li>
                    </ol>
                  </div>
                )}

                {activeArchTab === 'security' && (
                  <div className="space-y-3 text-xs leading-relaxed text-neutral-700">
                    <p>
                      Pilar keamanan Zaky dirancang dengan prinsip pertahanan berlapis (*Defense in Depth*):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                        <strong className="text-neutral-900 block">HttpOnly Cookies</strong>
                        <p className="text-neutral-500">Token JWT tidak dapat dibaca oleh script JavaScript sisi klien (mencegah XSS token theft).</p>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                        <strong className="text-neutral-900 block">SameSite=Lax Policy</strong>
                        <p className="text-neutral-500">Mencegah serangan pemalsuan permintaan lintas situs (Cross-Site Request Forgery / CSRF).</p>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                        <strong className="text-neutral-900 block">Isolated Identity Keying</strong>
                        <p className="text-neutral-500">Penyimpanan nama lokal di-namespace per email pengguna untuk mencegah crossover akun demo.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                        <strong className="text-neutral-900 block">Zero PII Exposure</strong>
                        <p className="text-neutral-500">NIK, nomor rekening, dan foto mustahik tidak pernah dipublikasikan di halaman verifikasi publik.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 7. Tech Stack & Dependencies */}
            <section id="tech-stack" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <Cpu className="w-4 h-4" />
                <span>Bagian 7 — Spesifikasi Teknologi</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Tech Stack & Pustaka Dependensi
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Zaky dibangun secara cermat menggunakan ekosistem teknologi modern dengan standar industri terbaru:
              </p>

              {/* Tech Stack Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Next.js 16 */}
                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-neutral-900">Next.js 16 (App Router)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                      v16.0.0
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Framework inti dengan Turbopack compiler, Server Actions terintegrasi penuh,
                    Cache Components, dan arsitektur hybrid React Server Components.
                  </p>
                </div>

                {/* React 19 */}
                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-neutral-900">React 19 & TypeScript 5</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      v19.0.0
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Pemanfaatan React Actions primitives (<code>useActionState</code>, form handling)
                    dan strict type safety pada seluruh domain model transaksi dan peran pengguna.
                  </p>
                </div>

                {/* Tailwind CSS v4 */}
                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-neutral-900">Tailwind CSS v4</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200">
                      v4.0
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Engine CSS generasi terbaru berbasis LightningCSS dengan tokenisasi variabel CSS kustom
                    dan utilitas neomorphism soft UI.
                  </p>
                </div>

                {/* Zaky Design System v3.0 */}
                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-neutral-900">Zaky Design System</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      v3.0 Tokens
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Tipografi Plus Jakarta Sans & JetBrains Mono, palet Emerald Deep (<code>#0F5C4D</code>)
                    dan Gold Accent (<code>#C8962E</code>), serta bayangan neomorphic cembung/cekung.
                  </p>
                </div>

                {/* GSAP & Motion */}
                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-neutral-900">GSAP & Framer Motion</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                      Animation Engine
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Animasi scroll deklaratif 60 FPS, interpolasi navbar capsule tanpa jank,
                    dan efek 3D tilt kartu interaktif dengan glare specular.
                  </p>
                </div>

                {/* Jose JWT */}
                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-neutral-900">Jose Cryptography</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      HMAC-SHA256
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Pustaka JWT zero-dependency universal berbasis Web Cryptography API untuk pembuatan,
                    penandatanganan, dan verifikasi token sesi.
                  </p>
                </div>
              </div>
            </section>

            {/* 8. Keamanan & Sesi JWT */}
            <section id="keamanan" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <Lock className="w-4 h-4" />
                <span>Bagian 8 — Spesifikasi Keamanan</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Model Keamanan, Kriptografi & Sesi
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Platform Zaky mengadopsi mekanisme autentikasi nir-password untuk sesi amil berbasis token
                JWT bertanda tangan digital. Struktur payload sesi dirancang sebagai berikut:
              </p>

              {/* JWT Token Payload Anatomy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-600 px-1">
                  <span>Anatomi Payload JWT Sesi (src/lib/auth.ts):</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `interface SessionPayload {
  userId: string;       // ID unik amil dalam database
  nama: string;         // Nama lengkap (contoh: "Amil Budi")
  email: string;        // Email terdaftar (contoh: "budi@lembaga-a.test")
  role: 'PELAYANAN' | 'PENYETUJU' | 'SAKSI_1' | 'SAKSI_2';
  lembagaId: string;    // ID lembaga tempat amil bertugas ("LEMBAGA_A")
  unit: string;         // Unit kerja fungsional ("Pelayanan & Penyaluran")
  iat: number;          // Waktu diterbitkan (Issued At Epoch)
  exp: number;          // Waktu kedaluwarsa (Expires At Epoch)
}`,
                        'jwt-payload'
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] text-primary-700 hover:underline cursor-pointer"
                  >
                    {copiedSnippet === 'jwt-payload' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin Tipe</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-neutral-900 text-neutral-100 text-xs font-mono overflow-x-auto leading-relaxed border border-neutral-800">
{`interface SessionPayload {
  userId: string;       // ID unik amil dalam database
  nama: string;         // Nama lengkap (contoh: "Amil Budi")
  email: string;        // Email terdaftar (contoh: "budi@lembaga-a.test")
  role: 'PELAYANAN' | 'PENYETUJU' | 'SAKSI_1' | 'SAKSI_2';
  lembagaId: string;    // ID lembaga tempat amil bertugas ("LEMBAGA_A")
  unit: string;         // Unit kerja fungsional ("Pelayanan & Penyaluran")
  iat: number;          // Waktu diterbitkan (Issued At Epoch)
  exp: number;          // Waktu kedaluwarsa (Expires At Epoch)
}`}
                </pre>
              </div>
            </section>

            {/* 9. Model Data TypeScript */}
            <section id="data-model" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <Code2 className="w-4 h-4" />
                <span>Bagian 9 — Skema & Kontrak Data</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Model Data Transaksi TypeScript
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Struktur data utama transaksi penyaluran zakat yang menampung rekonsiliasi asnaf,
                persetujuan bertingkat, dan jejak audit:
              </p>

              {/* Data Schema Code Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-600 px-1">
                  <span>Skema Tipe Transaksi (src/lib/types.ts):</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `export type AsnafType =
  | 'FAKIR'
  | 'MISKIN'
  | 'AMIL'
  | 'MUALLAF'
  | 'RIQAB'
  | 'GHARIMIN'
  | 'FISABILILLAH'
  | 'IBNU_SABIL';

export type StatusTransaksi =
  | 'DRAFT'
  | 'MENUNGGU_PERSETUJUAN'
  | 'MENUNGGU_SAKSI'
  | 'DISETUJUI'
  | 'TERSALURKAN'
  | 'DITOLAK';

export interface TransaksiZakat {
  id: string;
  kodePublik: string;           // Contoh: "ZKY-A-2024-001"
  mustahikNama: string;         // Ditampilkan publik dalam format inisial
  asnaf: AsnafType;
  nominal: number;
  lembagaId: string;
  pembuatEmail: string;
  penyetujuEmail?: string;
  saksi1Email?: string;
  saksi2Email?: string;
  status: StatusTransaksi;
  createdAt: string;
  updatedAt: string;
  riwayatAudit: Array<{
    timestamp: string;
    aktor: string;
    aksi: string;
    catatan?: string;
  }>;
}`,
                        'schema-type'
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] text-primary-700 hover:underline cursor-pointer"
                  >
                    {copiedSnippet === 'schema-type' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin Tipe</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-neutral-900 text-neutral-100 text-xs font-mono overflow-x-auto leading-relaxed border border-neutral-800">
{`export type AsnafType =
  | 'FAKIR'
  | 'MISKIN'
  | 'AMIL'
  | 'MUALLAF'
  | 'RIQAB'
  | 'GHARIMIN'
  | 'FISABILILLAH'
  | 'IBNU_SABIL';

export type StatusTransaksi =
  | 'DRAFT'
  | 'MENUNGGU_PERSETUJUAN'
  | 'MENUNGGU_SAKSI'
  | 'DISETUJUI'
  | 'TERSALURKAN'
  | 'DITOLAK';

export interface TransaksiZakat {
  id: string;
  kodePublik: string;           // Contoh: "ZKY-A-2024-001"
  mustahikNama: string;         // Ditampilkan publik dalam format inisial
  asnaf: AsnafType;
  nominal: number;
  lembagaId: string;
  pembuatEmail: string;
  penyetujuEmail?: string;
  saksi1Email?: string;
  saksi2Email?: string;
  status: StatusTransaksi;
  createdAt: string;
  updatedAt: string;
  riwayatAudit: Array<{
    timestamp: string;
    aktor: string;
    aksi: string;
    catatan?: string;
  }>;
}`}
                </pre>
              </div>
            </section>

            {/* 10. Standar Syariah & Regulasi */}
            <section id="syariah" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>Bagian 10 — Kepatuhan Syariah & Hukum</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Standar Syariah & Kepatuhan Regulasi
              </h2>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Zaky beroperasi dalam koridor kepatuhan syariat Islam yang ketat serta selaras dengan regulasi
                hukum perzakatan di Republik Indonesia:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <h4 className="font-bold text-neutral-900 text-xs">8 Asnaf Al-Qur&apos;an (At-Taubah: 60)</h4>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Penyaluran zakat dibatasi secara tegas hanya untuk 8 golongan yang sah: Fakir, Miskin,
                    Amil, Muallaf, Riqab, Gharimin, Fisabilillah, dan Ibnu Sabil. Sistem memvalidasi kuota
                    dan kelayakan penerima sesuai fatwa MUI.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <h4 className="font-bold text-neutral-900 text-xs">Standar PSAK 109</h4>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Pemisahan akuntansi dana Zakat, dana Infak/Sedekah, dan dana Amil diimplementasikan
                    pada tingkat sub-rekening kas, mencegah percampuran dana non-halal atau penggunaan dana
                    zakat untuk operasional di luar batas 1/8 hak amil.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <h4 className="font-bold text-neutral-900 text-xs">UU No. 23 Tahun 2011</h4>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Kepatuhan penuh terhadap Undang-Undang Republik Indonesia tentang Pengelolaan Zakat,
                    menjaga prinsip transparansi, akuntabilitas publik, dan integrasi pengawasan BAZNAS / Kemenag.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
                  <h4 className="font-bold text-neutral-900 text-xs">Perlindungan Data Pribadi (UU PDP)</h4>
                  <p className="text-xs text-neutral-600 leading-normal">
                    Penerapan pseudonimisasi dan masking pada seluruh identitas mustahik dalam halaman
                    verifikasi publik, menjamin data kependudukan terlindungi dari eksploitasi pihak ketiga.
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
                {/* Subtle Amber Glow in top-right */}
                <div
                  className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none opacity-20 blur-2xl"
                  style={{
                    background: 'radial-gradient(circle, #C8962E 0%, transparent 70%)',
                  }}
                />

                <div className="space-y-2 text-center sm:text-left relative z-10">
                  <h3 className="font-extrabold text-xl sm:text-2xl tracking-tight text-white leading-tight">
                    Siap Mencoba Alur Verifikasi Zaky?
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
                    Gunakan portal masuk untuk mencoba akun demo Amil Budi, Penyetuju Hari, dan Saksi Dewi,
                    atau cek kode transaksi publik secara langsung.
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
