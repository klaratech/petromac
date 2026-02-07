"use client";

export default function BottomCTA() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-20 px-6 bg-brand">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
          Want a simulation for a specific well?
        </h2>
        <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-10">
          Send us your well profile and constraints. We&rsquo;ll run a
          Hermes&trade; simulation and return a recommended configuration with
          assumptions and pass/fail envelope.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => scrollTo("contact")}
            className="px-8 py-3 rounded-lg bg-white text-brand font-semibold text-lg hover:bg-slate-100 transition-colors shadow-lg"
          >
            Request a Simulation
          </button>
          <button
            onClick={() => scrollTo("contact")}
            className="px-8 py-3 rounded-lg border-2 border-white text-white font-semibold text-lg hover:bg-white/10 transition-colors"
          >
            Contact your Regional Manager
          </button>
        </div>
      </div>
    </section>
  );
}
