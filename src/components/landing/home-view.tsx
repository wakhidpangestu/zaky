'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { SessionPayload } from '@/lib/auth';
import Navbar from '@/components/landing/navbar';
import HeroFallback from '@/components/landing/hero-fallback';
import WorkflowSection from '@/components/landing/workflow-section';
import InteractiveShowcase from '@/components/landing/interactive-showcase';
import ArmadaSection from '@/components/landing/armada-section';
import DewanSection from '@/components/landing/dewan-section';
import ValuePillars from '@/components/landing/value-pillars';
import ComparisonSection from '@/components/landing/comparison-section';
import FederationNetwork from '@/components/landing/federation-network';
import SyariahGovernance from '@/components/landing/syariah-governance';
import FaqSection from '@/components/landing/faq-section';
import CtaBanner from '@/components/landing/cta-banner';
import Footer from '@/components/landing/footer';
import AkadModal from '@/components/landing/akad-modal';

// Journey 3D (Three.js, chunk terbesar) dimuat lazy di sisi klien saja.
// Selama chunk dimuat, hero statis bergaya referensi tampil lebih dulu (LCP cepat),
// dan hero yang sama menjadi fallback permanen bila WebGL2 tidak tersedia.
const ZakyJourney3D = dynamic(() => import('@/components/landing/zaky-journey-3d'), {
  ssr: false,
  loading: () => <HeroFallback mode="loading" />,
});

interface HomeViewProps {
  session: SessionPayload | null;
}

export default function HomeView({ session }: HomeViewProps) {
  const [isAkadModalOpen, setIsAkadModalOpen] = useState(false);

  // Hero fallback (loading component module-level) membuka modal lewat event ini
  useEffect(() => {
    const open = () => setIsAkadModalOpen(true);
    window.addEventListener('zaky:open-akad', open);
    return () => window.removeEventListener('zaky:open-akad', open);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-neutral-900 flex flex-col font-sans selection:bg-primary-100 selection:text-primary-900 overflow-x-clip [overflow-x:clip]">
      {/* Universal Floating Navbar */}
      <Navbar session={session} />

      <main className="flex-1">
        {/* 1. Interactive 3D Islamic Modern Building & 6-Stage Governance Scrollytelling (Three.js + GSAP) */}
        {/* Alur dokumen natural: trek journey diakhiri bersih, section di bawahnya
            mengalir normal tanpa margin negatif yang menimpa area journey. */}
        <ZakyJourney3D onOpenAkadModal={() => setIsAkadModalOpen(true)} />

        {/* 2. Alur Transaksi 3-Pihak (jangkar #alur pada tautan navbar) */}
        <WorkflowSection />

        {/* 3. Laboratorium Uji Mandiri (jangkar #simulator pada tautan navbar) */}
        <InteractiveShowcase />

        {/* 4. Armada Distribusi Logistik & Tracking Siaga (inspired by 00:29 in video) */}
        <ArmadaSection />

        {/* 5. 4 Pilar Program Penyaluran Zakat (inspired by 00:33 in video) */}
        <ValuePillars />

        {/* 6. Dewan Pengawas Syariah & Auditor Kriptografi Filterable Grid (inspired by 00:37 in video) */}
        <DewanSection />

        {/* 7. Transparansi & Komparasi Sistem Zaky vs Tradisional (inspired by 01:07 in video) */}
        <ComparisonSection />

        {/* 8. Jaringan Federasi Papan Silang Antarlembaga (P2P Consensus) */}
        <FederationNetwork />

        {/* 9. Tata Kelola Fiqih & Invariant Saldo Kekal Database */}
        <SyariahGovernance />

        {/* 10. Pertanyaan yang Sering Diajukan (FAQ) */}
        <FaqSection />

        {/* 11. Final Call to Action Banner (inspired by 01:13 in video) */}
        <CtaBanner session={session} />
      </main>

      {/* Universal Structured Footer */}
      <Footer />

      {/* 5-Step Interactive Akad & Kalkulator Zakat Digital Modal (inspired by 00:40 - 01:00 in video) */}
      <AkadModal
        isOpen={isAkadModalOpen}
        onClose={() => setIsAkadModalOpen(false)}
      />
    </div>
  );
}
