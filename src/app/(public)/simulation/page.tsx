import SimulationHero from "@/components/public/simulation/SimulationHero";
import AthenaInAction from "@/components/public/simulation/AthenaInAction";
import WhatAthenaDoes from "@/components/public/simulation/WhatAthenaDoes";
import WhyPetromac from "@/components/public/simulation/WhyPetromac";
import BottomCTA from "@/components/public/simulation/BottomCTA";
import ContactForm from "@/components/public/ContactForm";

export const metadata = {
  title: "Athena - Wireline Job Planning & Simulation",
  description:
    "Predict sticking risk, compare conveyance scenarios, and choose wireline configurations before the job starts with Athena and Hermes simulation.",
};

export default function SimulationPage() {
  return (
    <>
      <SimulationHero />
      <AthenaInAction />
      <WhatAthenaDoes />
      <WhyPetromac />
      <BottomCTA />
      <div id="contact">
        <ContactForm />
      </div>
    </>
  );
}
