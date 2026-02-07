import HeroV2 from "@/components/public/v2/HeroV2";
import ChallengeSelector from "@/components/public/v2/ChallengeSelector";
import FeaturedProducts from "@/components/public/v2/FeaturedProducts";
import SoftwareHighlight from "@/components/public/v2/SoftwareHighlight";
import ProofSection from "@/components/public/v2/ProofSection";
import ContactForm from "@/components/public/ContactForm";

export const metadata = {
  title: "Petromac — Wireline Logging Solutions",
  description:
    "Purpose-built hardware and planning software for complex wireline logging operations. Prevent stuck tools, failed logs, and costly contingency runs.",
};

export default function HomePage() {
  return (
    <>
      <HeroV2 />
      <ChallengeSelector />
      <FeaturedProducts />
      <SoftwareHighlight />
      <ProofSection />
      <div id="contact">
        <ContactForm />
      </div>
    </>
  );
}
