import Hero from '@/components/public/home/Hero';
import ChallengeSelector from '@/components/public/home/ChallengeSelector';
import FeaturedProducts from '@/components/public/home/FeaturedProducts';
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
      <Hero />
      <ChallengeSelector />
      <SoftwareHighlight />
      <FeaturedProducts />
      <ProofSection />
      <ContactSection />
    </>
  );
}
