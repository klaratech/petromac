import AthenaTerminal from './AthenaTerminal';

/**
 * "See it in action" — the Athena demo section.
 *
 * Merges the former WhatAthenaDoes (the Simulate / Evaluate / Decide
 * rhythm, in text) with the demo: the simulated terminal (AthenaTerminal,
 * relocated here from the homepage software band Jul 2026) shows the
 * rhythm, the three steps below label it. One show-and-tell section.
 *
 * VIDEO PENDING: when the real screen recording is ready, add a
 * <video src="/videos/transcoded/athena-demo.mp4" controls poster=...>
 * alongside (or replacing) the terminal.
 * Brief: a ~60-90s click-through on one real well plan — load inputs →
 * run Hermes → read the tension/drag/risk output → change a configuration
 * choice → re-run → land on a go/no-go call. See docs/ADMIN.md for the
 * transcode guidance.
 */

const steps = [
  {
    title: 'Simulate',
    text: 'Load the well path, tool string, conveyance assumptions, friction, and access limits.',
  },
  {
    title: 'Evaluate',
    text: 'See where tension, drag, and sticking risk begin to constrain the job.',
  },
  {
    title: 'Decide',
    text: 'Lock in the configuration, contingency triggers, and the go / no-go boundary before the run.',
  },
];

export default function AthenaInAction() {
  return (
    <section id="athena-demo" className="bg-slate-950 px-6 py-12 md:py-16 scroll-reveal">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase text-blue-300">See it in action</p>
          <h2 className="font-heading text-3xl font-bold text-white md:text-4xl">
            Simulate. Evaluate. Decide.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            Athena takes a well plan from inputs to a recommendation in three steps.
          </p>
        </div>

        {/* Simulated Athena run — fully rendered on the server, replayed as
            a typewriter once when it first scrolls into view. */}
        <div className="max-w-3xl">
          <AthenaTerminal />
        </div>

        {/* Simulate / Evaluate / Decide */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-xl border border-slate-700 bg-slate-800/60 p-6"
            >
              <span className="font-heading text-sm font-bold text-blue-300">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 font-heading text-lg font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
