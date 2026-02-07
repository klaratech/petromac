"use client";

export default function SimulationHero() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative bg-slate-950 py-24 md:py-32 px-6 overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <p className="text-brand font-semibold text-sm uppercase tracking-widest mb-4">
          Athena&trade; by Petromac
        </p>

        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
          Plan complex wireline jobs with confidence.
        </h1>

        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
          Athena&trade; is Petromac&rsquo;s job planning platform for conveyance,
          orientation, and centralization&mdash;built for real wells, real
          constraints, and real operational risk.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <button
            onClick={() => scrollTo("contact")}
            className="px-8 py-3 rounded-lg bg-brand text-white font-semibold text-lg hover:bg-brand/90 transition-colors shadow-lg"
          >
            Request a Simulation
          </button>
          <button
            onClick={() => scrollTo("contact")}
            className="px-8 py-3 rounded-lg border-2 border-white text-white font-semibold text-lg hover:bg-white/10 transition-colors"
          >
            Request an Athena Demo
          </button>
        </div>

        <p className="text-sm text-slate-400">
          Field-proven workflows. Engineering-led support. Integrated hardware
          recommendations.
        </p>
      </div>
    </section>
  );
}
