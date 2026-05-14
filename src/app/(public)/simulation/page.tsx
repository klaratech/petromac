import SimulationHero from "@/components/public/simulation/SimulationHero";
import AthenaInAction from "@/components/public/simulation/AthenaInAction";
import WhatAthenaDoes from "@/components/public/simulation/WhatAthenaDoes";
import WhyPetromac from "@/components/public/simulation/WhyPetromac";
import ContactForm from "@/components/public/ContactForm";

export const metadata = {
  title: "Athena - Wireline Planning Partner",
  description:
    "Use Athena and Hermes simulation to predict sticking risk, evaluate conveyance options, and decide before the job starts.",
};

export default function SimulationPage() {
  return (
    <>
      <SimulationHero />
      <WhatAthenaDoes />
      <AthenaInAction />
      <WhyPetromac />
      <div id="contact">
        <ContactForm />
      </div>
    </>
  );
}
