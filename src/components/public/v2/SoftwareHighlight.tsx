"use client";

import Image from "next/image";

export default function SoftwareHighlight() {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-20 px-6 bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Plan Every Job Before You Get to the Wellsite
        </h2>
        <p className="text-slate-400 text-center mb-14 max-w-3xl mx-auto">
          Athena replaces spreadsheets, phone calls, and guesswork with a single
          platform for wireline job design and simulation.
        </p>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 md:p-10">
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
                Halliburton, Baker Hughes). Select tools, configure strings,
                and validate against well conditions.
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

          {/* Single CTA */}
          <div>
            <button
              onClick={scrollToContact}
              className="px-6 py-2.5 rounded-lg bg-brand text-white font-semibold hover:bg-brand/90 transition-colors"
            >
              Request a demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
