import SimulationHero from "@/components/public/simulation/SimulationHero";
import AthenaInAction from "@/components/public/simulation/AthenaInAction";
import WhyPetromac from "@/components/public/simulation/WhyPetromac";
import ContactForm from "@/components/public/ContactForm";

export const metadata = {
  title: "Athena - Wireline Planning Partner",
  description:
    "Athena turns a well plan into a go/no-go call before the run starts — combining Hermes drag-and-tension modelling, AI configuration checks, and regional-manager experience.",
};

export default function SimulationPage() {
  return (
    <>
      <SimulationHero />
      <AthenaInAction />
      <WhyPetromac />
      <section id="contact" className="bg-slate-950 px-6 py-14 md:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
              Get started
            </p>
            <h2 className="font-heading text-3xl font-bold text-white md:text-4xl">
              Request a simulation
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-slate-400">
              Tell us about the well and tool string, and we&apos;ll set up an
              Athena run with you.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
