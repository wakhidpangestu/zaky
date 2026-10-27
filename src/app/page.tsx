import { getSession } from '@/lib/auth';
import Navbar from '@/components/landing/navbar';
import HeroIsland from '@/components/landing/hero-island';
import WorkflowSection from '@/components/landing/workflow-section';
import ShowcaseGate from '@/components/landing/showcase-gate';
import ArmadaSection from '@/components/landing/armada-section';
import ValuePillars from '@/components/landing/value-pillars';
import DewanSection from '@/components/landing/dewan-section';
import ComparisonSection from '@/components/landing/comparison-section';
import FederationNetwork from '@/components/landing/federation-network';
import SyariahGovernance from '@/components/landing/syariah-governance';
import FaqSection from '@/components/landing/faq-section';
import CtaBanner from '@/components/landing/cta-banner';
import Footer from '@/components/landing/footer';
import AkadGate from '@/components/landing/akad-gate';

// Opt out of instant navigation — reads session cookie
export const instant = false;

export const metadata = {
  title: 'Zaky — Setiap Lembaga Mencatat Sendiri, Catatannya Saling Diperiksa',
  description:
    'Jaringan verifikasi penyaluran zakat antarlembaga berlandaskan fiqih amanah, konfirmasi langsung penerima (mustahik), dan audit silang kriptografis harian.',
};

/**
 * Landing dikomposisi sebagai komponen server: hanya pulau-pulau yang
 * benar-benar interaktif yang menjadi komponen klien (Navbar, HeroIsland,
 * InteractiveShowcase, Armada/Dewan/Syariah/FAQ, AkadModal). Section
 * presentasional dirender penuh di server sehingga hidrasi awal minimal.
 */
export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-neutral-900 flex flex-col font-sans selection:bg-primary-100 selection:text-primary-900 overflow-x-clip [overflow-x:clip]">
      {/* Universal Floating Navbar */}
      <Navbar session={session} />

      <main className="flex-1">
        {/* 1. Interactive 3D Islamic Modern Building & 6-Stage Governance Scrollytelling (Three.js + GSAP) */}
        <HeroIsland />

        {/* 2. Alur Transaksi 3-Pihak (jangkar #alur pada tautan navbar) */}
        <WorkflowSection />

        {/* 3. Laboratorium Uji Mandiri (jangkar #simulator pada tautan navbar) */}
        <ShowcaseGate />

        {/* 4. Armada Distribusi Logistik & Tracking Siaga */}
        <ArmadaSection />

        {/* 5. 4 Pilar Program Penyaluran Zakat */}
        <ValuePillars />

        {/* 6. Dewan Pengawas Syariah & Auditor Kriptografi Filterable Grid */}
        <DewanSection />

        {/* 7. Transparansi & Komparasi Sistem Zaky vs Tradisional */}
        <ComparisonSection />

        {/* 8. Jaringan Federasi Papan Silang Antarlembaga (P2P Consensus) */}
        <FederationNetwork />

        {/* 9. Tata Kelola Fiqih & Invariant Saldo Kekal Database */}
        <SyariahGovernance />

        {/* 10. Pertanyaan yang Sering Diajukan (FAQ) */}
        <FaqSection />

        {/* 11. Final Call to Action Banner */}
        <CtaBanner session={session} />
      </main>

      {/* Universal Structured Footer */}
      <Footer />

      {/* Modal akad 5 langkah - dipasang malas lewat gerbang event */}
      <AkadGate />
    </div>
  );
}
