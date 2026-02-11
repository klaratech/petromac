import SimulationHero from "@/components/public/simulation/SimulationHero";
import WhatAthenaDoes from "@/components/public/simulation/WhatAthenaDoes";
import ProvidersSection from "@/components/public/simulation/ProvidersSection";
import WorkflowCards from "@/components/public/simulation/WorkflowCards";
import OutputsSection from "@/components/public/simulation/OutputsSection";
import WhyPetromac from "@/components/public/simulation/WhyPetromac";
import BottomCTA from "@/components/public/simulation/BottomCTA";
import ContactForm from "@/components/public/ContactForm";

export const metadata = {
  title: "Athena — Wireline Job Planning & Simulation",
  description:
    "Plan wireline conveyance jobs with confidence. Athena designs configurations for all three major wireline providers and includes Hermes downhole tension/drag simulation.",
};

export default function SimulationPage() {
  return (
    <>
      <SimulationHero />
      <WhatAthenaDoes />
      <ProvidersSection />
      <WorkflowCards />
      <OutputsSection />
      <WhyPetromac />
      <BottomCTA />
      <div id="contact">
        <ContactForm />
      </div>
    </>
  );
}
