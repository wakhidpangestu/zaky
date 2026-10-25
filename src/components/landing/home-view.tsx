'use client';

import React, { useState } from 'react';
import type { SessionPayload } from '@/lib/auth';
import Navbar from '@/components/landing/navbar';
import ZakyJourney3D from '@/components/landing/zaky-journey-3d';
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

interface HomeViewProps {
  session: SessionPayload | null;
}

export default function HomeView({ session }: HomeViewProps) {
  const [isAkadModalOpen, setIsAkadModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-neutral-900 flex flex-col font-sans selection:bg-primary-100 selection:text-primary-900 overflow-x-hidden">
      {/* Universal Floating Navbar */}
      <Navbar session={session} />

      <main className="flex-1">
        {/* 1. Interactive 3D Islamic Modern Building & 6-Stage Governance Scrollytelling (Three.js + GSAP) */}
        <ZakyJourney3D onOpenAkadModal={() => setIsAkadModalOpen(true)} />

        {/* 2. Armada Distribusi Logistik & Tracking Siaga (inspired by 00:30 in video) */}
        <ArmadaSection />

        {/* 3. 4 Pilar Program Penyaluran Zakat (inspired by 00:33 in video) */}
        <ValuePillars />

        {/* 4. Dewan Pengawas Syariah & Auditor Kriptografi Filterable Grid (inspired by 00:37 in video) */}
        <DewanSection />

        {/* 5. Transparansi & Komparasi Sistem Zaky vs Tradisional (inspired by 01:07 in video) */}
        <ComparisonSection />

        {/* 6. Jaringan Federasi Papan Silang Antarlembaga (P2P Consensus) */}
        <FederationNetwork />

        {/* 7. Tata Kelola Fiqih & Invariant Saldo Kekal Database */}
        <SyariahGovernance />

        {/* 8. Pertanyaan yang Sering Diajukan (FAQ) */}
        <FaqSection />

        {/* 9. Final Call to Action Banner (inspired by 01:13 in video) */}
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
