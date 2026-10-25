import { getSession } from '@/lib/auth';
import Navbar from '@/components/landing/navbar';
import HeroSection from '@/components/landing/hero';
import ValuePillars from '@/components/landing/value-pillars';
import WorkflowSection from '@/components/landing/workflow-section';
import InteractiveShowcase from '@/components/landing/interactive-showcase';
import ComparisonSection from '@/components/landing/comparison-section';
import FederationNetwork from '@/components/landing/federation-network';
import SyariahGovernance from '@/components/landing/syariah-governance';
import FaqSection from '@/components/landing/faq-section';
import CtaBanner from '@/components/landing/cta-banner';
import Footer from '@/components/landing/footer';
import ScrollAnimator from '@/components/landing/scroll-animator';

// Opt out of instant navigation — reads session cookie
export const instant = false;

export const metadata = {
  title: 'Zaky — Setiap Lembaga Mencatat Sendiri, Catatannya Saling Diperiksa',
  description:
    'Jaringan verifikasi penyaluran zakat antarlembaga berlandaskan fiqih amanah, konfirmasi langsung penerima (mustahik), dan audit silang kriptografis harian.',
};

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-neutral-900 flex flex-col font-sans selection:bg-primary-100 selection:text-primary-900 overflow-x-hidden">
      <Navbar session={session} />
      <ScrollAnimator>
        <main className="flex-1">
          <HeroSection />
          <ValuePillars />
          <WorkflowSection />
          <InteractiveShowcase />
          <ComparisonSection />
          <FederationNetwork />
          <SyariahGovernance />
          <FaqSection />
          <CtaBanner session={session} />
        </main>
      </ScrollAnimator>
      <Footer />
    </div>
  );
}
