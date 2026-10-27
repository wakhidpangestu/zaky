
import React from 'react';
import Link from 'next/link';
import ZakyLogo from '@/components/zaky-logo';
import { ShieldCheck, Lock, ExternalLink, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0E1715] text-neutral-400 text-xs border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info — NO BACKGROUND ON LOGO, NO V4.0 */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 text-white group">
              <ZakyLogo
                size={28}
                className="text-primary-100 transition-transform group-hover:scale-110 flex-shrink-0"
              />
              <span className="font-bold text-xl tracking-tight text-white">
                Zaky<span className="text-accent-500">.</span>
              </span>
            </Link>

            <p className="text-neutral-400 text-xs leading-relaxed max-w-sm">
              Jaringan verifikasi penyaluran zakat antarlembaga berlandaskan fiqih amanah dan
              kriptografi modern. Setiap lembaga mencatat sendiri, tetapi catatannya saling diperiksa.
            </p>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
              <ShieldCheck className="w-4 h-4 text-primary-500" />
              <span>Standar Fiqih Syariah • UU No. 27/2022 PDP</span>
            </div>
          </div>

          {/* Nav Col 1: Layanan Publik */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-neutral-200">Layanan Publik</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/verifikasi"
                  className="hover:text-primary-100 transition-colors"
                >
                  Verifikasi Kode 12 Karakter
                </Link>
              </li>
              <li>
                <Link
                  href="/silang"
                  className="hover:text-primary-100 transition-colors"
                >
                  Papan Silang Harian
                </Link>
              </li>
              <li>
                <a href="#simulator" className="hover:text-primary-100 transition-colors">
                  Simulator 3 Pilar
                </a>
              </li>
              <li>
                <a href="#prinsip" className="hover:text-primary-100 transition-colors">
                  Prinsip Desain Zaky
                </a>
              </li>
            </ul>
          </div>

          {/* Nav Col 2: Alur & Tata Kelola */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-neutral-200">Tata Kelola</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#alur" className="hover:text-primary-100 transition-colors">
                  Alur 3-Pihak Tanpa Kolusi
                </a>
              </li>
              <li>
                <a href="#syariah" className="hover:text-primary-100 transition-colors">
                  8 Asnaf Fiqih Zakat
                </a>
              </li>
              <li>
                <a href="#syariah" className="hover:text-primary-100 transition-colors">
                  Pemisahan Hak Amil Otomatis
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-primary-100 transition-colors">
                  Pertanyaan Sering Diajukan
                </a>
              </li>
            </ul>
          </div>

          {/* Nav Col 3: Portal Amil */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-neutral-200">Portal Amil</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/login"
                  className="hover:text-primary-100 transition-colors"
                >
                  Masuk Akun Amil
                </Link>
              </li>
              <li>
                <Link
                  href="/dasbor"
                  className="hover:text-primary-100 transition-colors"
                >
                  Dasbor Operasional
                </Link>
              </li>
              <li>
                <Link
                  href="/penerimaan/buat"
                  className="hover:text-primary-100 transition-colors"
                >
                  Pencatatan Penerimaan
                </Link>
              </li>
              <li>
                <Link
                  href="/penyaluran/buat"
                  className="hover:text-primary-100 transition-colors"
                >
                  Pengajuan Penyaluran
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar — NO V4.0 */}
        <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
          <div>
            © 2026 Zaky. Dikembangkan untuk transparansi dan akuntabilitas dana zakat umat.
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px]">
            <span>Ed25519 Signed</span>
            <span>•</span>
            <span>SHA-256 Merkle Chain</span>
            <span>•</span>
            <span>Zero Gas Fee</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
