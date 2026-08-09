import Hero from '@/components/public/home/Hero';
import ChallengeSelector from '@/components/public/home/ChallengeSelector';
import HardwareHighlight from '@/components/public/home/HardwareHighlight';
import SoftwareHighlight from '@/components/public/home/SoftwareHighlight';
import ProofSection from '@/components/public/home/ProofSection';
import ContactSection from '@/components/public/home/ContactSection';
import JsonLd, { ORGANIZATION_SCHEMA } from '@/components/shared/JsonLd';
import { pageMetadata } from '@/lib/seo';

// Un-branded title — the root template appends "| Petromac" exactly once.
export const metadata = pageMetadata({
  title: 'Wireline Conveyance, Centralisers & Hole Finders',
  description:
    'Wireline conveyance and centralisation hardware that solves differential sticking, high deviation and log quality — plus Athena job-planning software.',
  path: '/',
});

export default function HomePage() {
  return (
    <>
      {/* Problem → solution → proof: hero promise, challenge cards, the
          matched Hardware + Software bands, then field-proven stats. */}
      <JsonLd data={ORGANIZATION_SCHEMA} />
      <Hero />
      <ChallengeSelector />
      <HardwareHighlight />
      <SoftwareHighlight />
      <ProofSection />
      <ContactSection />
    </>
  );
}
