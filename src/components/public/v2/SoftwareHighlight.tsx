"use client";

import Image from "next/image";

export default function SoftwareHighlight() {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    // Brand-tinted dark gradient instead of pure slate-950 — section
    // now reads as a deliberate brand zone rather than a generic dark
    // panel. Top hairline echoes the brand color so the section is
    // visually "stamped".
    <section className="relative py-20 px-6 bg-gradient-to-b from-[#081a3a] via-slate-900 to-slate-950">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent" aria-hidden="true" />
      <div className="max-w-7xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300 font-semibold text-center mb-3">
          Software
        </p>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Plan Every Job Before You Get to the Wellsite
        </h2>
        <p className="text-slate-300 text-center mb-14 max-w-3xl mx-auto">
          Athena replaces spreadsheets and guesswork with a single platform
          for wireline job design and simulation.
        </p>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-8 md:p-10 shadow-2xl shadow-black/40 ring-1 ring-white/5">
          {/* Athena header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src="/images/athena_logo.png"
                alt="Athena logo"
                fill
                className="object-contain"
                sizes="48px"
              />
            </div>
            <h3 className="font-heading text-2xl font-bold text-white">
              Athena
            </h3>
          </div>

          {/* Two capability columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Job Design */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">
                Job Design
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Design wireline jobs for all 3 major providers (SLB,
                Halliburton, Baker Hughes). Select tools, configure
                strings, and validate against well conditions.
              </p>
            </div>

            {/* Hermes Simulation Engine */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">
                Hermes Simulation Engine
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Simulate cable tensions, friction, and jarring confidence. Know
                if your tool string will reach TD before the job starts.
              </p>
            </div>
          </div>

          {/* Single CTA — primary (solid brand) */}
          <div>
            <button
              onClick={scrollToContact}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-white bg-brand hover:bg-brand/90 shadow-lg shadow-blue-900/40 transition-all hover:translate-y-[-1px] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Request a demo
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
