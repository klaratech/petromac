/**
 * "See it in action" — the Athena demo section.
 *
 * Merges the former WhatAthenaDoes (the Simulate / Evaluate / Decide
 * rhythm, in text) with the demo video: the video shows the rhythm, the
 * three steps below label it. One show-and-tell section instead of two.
 *
 * ASSET PLACEHOLDER: the video frame below is a static mockup. When the
 * screen recording is ready, swap the placeholder block for a real
 * <video src="/videos/athena-demo.mp4" controls poster=...> element.
 * Brief: a ~60-90s click-through on one real well plan — load inputs →
 * run Hermes → read the tension/drag/risk output → change a configuration
 * choice → re-run → land on a go/no-go call. See docs/ADMIN.md for the
 * transcode guidance.
 */

const steps = [
  {
    title: "Simulate",
    text: "Load the well path, tool string, conveyance assumptions, friction, and access limits.",
  },
  {
    title: "Evaluate",
    text: "See where tension, drag, and sticking risk begin to constrain the job.",
  },
  {
    title: "Decide",
    text: "Lock in the configuration, contingency triggers, and the go / no-go boundary before the run.",
  },
];

export default function AthenaInAction() {
  return (
    <section id="athena-demo" className="bg-slate-950 px-6 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase text-blue-300">
            See it in action
          </p>
          <h2 className="font-heading text-3xl font-bold text-white md:text-4xl">
            Simulate. Evaluate. Decide.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            A run through Athena on a real well plan — from inputs to
            recommendation, in about a minute.
          </p>
        </div>

        {/* Video — centerpiece. Placeholder until the recording lands. */}
        <div
          className="relative aspect-video overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-2xl"
          role="img"
          aria-label="Placeholder for an Athena screen recording demo."
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(148,163,184,.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,.15) 1px, transparent 1px)",
              backgroundSize: "64px 44px",
            }}
          />
          <div className="absolute left-0 right-0 top-0 flex items-center gap-2 border-b border-slate-700 bg-slate-950/90 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3 text-xs font-semibold uppercase text-slate-400">
              Athena demo video
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 top-12 flex flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 sm:h-16 sm:w-16">
              <span className="ml-1 h-0 w-0 border-y-[8px] border-l-[13px] border-y-transparent border-l-white sm:border-y-[11px] sm:border-l-[17px]" />
            </div>
            <p className="font-heading text-xl font-bold text-white sm:text-2xl">
              Screen recording placeholder
            </p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-300 sm:mt-2 sm:text-sm">
              Reserved for the Athena planning walk-through.
            </p>
          </div>
        </div>

        {/* Simulate / Evaluate / Decide — the rhythm the video shows */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-xl border border-slate-700 bg-slate-800/60 p-6"
            >
              <span className="font-heading text-sm font-bold text-blue-300">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 font-heading text-lg font-bold text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
