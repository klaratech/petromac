const cards = [
  {
    step: "01",
    title: "Early feasibility",
    quote: "Can we reach TD without tractors or contingency runs?",
  },
  {
    step: "02",
    title: "Configuration selection",
    quote:
      "Which conveyance + centralization set gives the best chance of success?",
  },
  {
    step: "03",
    title: "Risk & contingency planning",
    quote:
      "What\u2019s the failure envelope, and what\u2019s Plan B if friction rises?",
  },
  {
    step: "04",
    title: "Post-job learning",
    quote:
      "What did we assume, what happened, and what do we change next time?",
  },
];

export default function WorkflowCards() {
  return (
    <section className="py-20 px-6 bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-14">
          How teams use Athena.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((c) => (
            <div
              key={c.step}
              className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 flex flex-col"
            >
              <span className="text-brand font-heading text-sm font-bold mb-3">
                {c.step}
              </span>
              <h3 className="font-heading text-lg font-bold text-white mb-4">
                {c.title}
              </h3>
              <p className="text-slate-400 text-sm italic mt-auto">
                &ldquo;{c.quote}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
