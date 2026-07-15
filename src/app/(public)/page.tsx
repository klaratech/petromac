import Hero from '@/components/public/home/Hero';
import ChallengeSelector from '@/components/public/home/ChallengeSelector';
import BridgeSection from '@/components/public/home/BridgeSection';
import SoftwareHighlight from '@/components/public/home/SoftwareHighlight';
import ProofSection from '@/components/public/home/ProofSection';
import ContactSection from '@/components/public/home/ContactSection';

export const metadata = {
  title: 'Petromac — Wireline Logging Solutions',
  description:
    'Purpose-built hardware and planning software for complex wireline logging operations. Prevent stuck tools, failed logs, and costly contingency runs.',
};

export default function HomePage() {
  return (
    <>
      {/* Problem → solution → proof: hero promise, challenge cards,
          bridge line into the Athena band, then field-proven stats. */}
      <Hero />
      <ChallengeSelector />
      <BridgeSection />
      <SoftwareHighlight />
      <ProofSection />
      <ContactSection />
    </>
  );
}
