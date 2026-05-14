const columns = [
  {
    title: "Inputs",
    bullets: [
      "Well trajectory and restriction profile",
      "Tool string, conveyance, and centralisation options",
      "Friction, cable, access, and operational limits",
    ],
  },
  {
    title: "Outputs",
    bullets: [
      "Tension vs depth profiles from Hermes",
      "Pass/fail envelope and limiting intervals",
      "Recommended configuration with alternates",
    ],
  },
  {
    title: "Decisions",
    bullets: [
      "Proceed, revise, or add contingency",
      "Choose hardware by risk reduction, not habit",
      "Align planning, crew, and client expectations",
    ],
  },
];

export default function WhatAthenaDoes() {
  return (
    <section className="bg-slate-950 px-6 py-16 md:py-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs uppercase text-blue-300 font-semibold">
            Planning loop
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            From well data to operational decision.
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed">
            Athena shortens the path from simulation to action. Build the case,
            run the scenarios, and leave with the decision points that matter on
            the rig floor.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-slate-700 md:grid-cols-3">
          {columns.map((col) => (
            <div
              key={col.title}
              className="bg-slate-900 p-6 md:p-7"
            >
              <h3 className="font-heading text-xl font-bold text-white mb-4">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.bullets.map((b) => (
                  <li key={b} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
                    <span className="text-brand mt-1 shrink-0">&#x2713;</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-3xl text-slate-400">
          Athena is vendor-neutral at the planning layer while supporting the
          workflows used by the major wireline service companies.
        </p>
      </div>
    </section>
  );
}
