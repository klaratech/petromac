"use client";

const outputs = [
  "Recommended configuration (with alternates)",
  "Key assumptions (friction factors, contact points, constraints)",
  "Pass/fail envelope and limiting sections",
  "Tension vs depth profiles (from Hermes\u2122)",
  "Run notes and contingency triggers",
];

export default function OutputsSection() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-20 px-6 bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
          Practical outputs, not generic reports.
        </h2>
        <p className="text-slate-300 text-lg mb-10">
          Athena produces a concise job planning summary that crews can use and
          engineers can defend.
        </p>

        <ul className="space-y-4 mb-12">
          {outputs.map((o) => (
            <li key={o} className="flex gap-3 text-slate-300 leading-relaxed">
              <span className="text-brand mt-1 shrink-0">&#x2713;</span>
              {o}
            </li>
          ))}
        </ul>

        <button
          onClick={() => scrollTo("contact")}
          className="px-8 py-3 rounded-lg bg-brand text-white font-semibold text-lg hover:bg-brand/90 transition-colors shadow-lg"
        >
          Request a Simulation
        </button>
      </div>
    </section>
  );
}
