import Hero from '@/components/public/home/Hero';
import ChallengeSelector from '@/components/public/home/ChallengeSelector';
import HardwareHighlight from '@/components/public/home/HardwareHighlight';
import SoftwareHighlight from '@/components/public/home/SoftwareHighlight';
import ProofSection from '@/components/public/home/ProofSection';
import ContactSection from '@/components/public/home/ContactSection';

export const metadata = {
  title: 'Petromac — Wireline Logging Solutions',
  description:
    'Wireline logging solutions for differential sticking, incomplete operations, high deviations, data quality, and centralisation — engineered hardware and Athena planning software.',
};

export default function HomePage() {
  return (
    <>
      {/* Problem → solution → proof: hero promise, challenge cards, the
          matched Hardware + Software bands, then field-proven stats. */}
      <Hero />
      <ChallengeSelector />
      <HardwareHighlight />
      <SoftwareHighlight />
      <ProofSection />
      <ContactSection />
    </>
  );
}
