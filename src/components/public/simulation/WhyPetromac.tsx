import Link from "next/link";

const bullets = [
  "Engineering-led support (not call-center support)",
  "Field-backed configurations (built from track record)",
  "Faster alignment between program, planning, and execution",
];

export default function WhyPetromac() {
  return (
    <section className="py-20 px-6 bg-slate-900">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
          Software + hardware, engineered together.
        </h2>
        <p className="text-slate-300 text-lg mb-10">
          Most vendors sell accessories. Petromac solves expensive failure modes
          with engineered conveyance hardware&mdash;and supports it with planning
          and simulation so teams can commit with higher confidence.
        </p>

        <ul className="space-y-4 mb-12">
          {bullets.map((b) => (
            <li key={b} className="flex gap-3 text-slate-300 leading-relaxed">
              <span className="text-brand mt-1 shrink-0">&#x2713;</span>
              {b}
            </li>
          ))}
        </ul>

        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-brand text-brand font-semibold hover:bg-brand hover:text-white transition-colors"
        >
          Explore Solutions
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
