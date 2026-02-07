const columns = [
  {
    title: "Design",
    bullets: [
      "Build configurations for conveyance, orientation, and centralization",
      "Compare options by risk, friction, and operational constraints",
      "Document decisions for the program and well file",
    ],
  },
  {
    title: "Simulate",
    subtitle: "Powered by Hermes\u2122",
    bullets: [
      "Run downhole tension/drag simulations with Hermes\u2122",
      "Identify pass/fail envelopes and contingency triggers",
      "Pressure-test assumptions before the job",
    ],
  },
  {
    title: "Execute",
    bullets: [
      "Generate a run-ready configuration summary",
      "Align tool placement with objectives (reach TD / stable standoff / sample quality)",
      "Shorten the loop between planning and field execution",
    ],
  },
];

export default function WhatAthenaDoes() {
  return (
    <section className="py-20 px-6 bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
          From &ldquo;should work&rdquo; to &ldquo;will work.&rdquo;
        </h2>
        <p className="text-slate-300 max-w-3xl mb-14 text-lg">
          Athena helps wireline teams choose the right configuration, predict
          downhole behavior, and de-risk execution&mdash;before you mobilize.
          It&rsquo;s built for the failure modes that cost the most: inability to
          reach TD, differential sticking, stick-slip, ledges/washouts, unstable
          tool standoff, and poor data quality.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {columns.map((col) => (
            <div
              key={col.title}
              className="bg-slate-800/60 border border-slate-700 rounded-xl p-8"
            >
              <h3 className="font-heading text-xl font-bold text-white mb-1">
                {col.title}
              </h3>
              {col.subtitle && (
                <p className="text-brand text-sm font-medium mb-4">
                  {col.subtitle}
                </p>
              )}
              {!col.subtitle && <div className="mb-4" />}
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
      </div>
    </section>
  );
}
