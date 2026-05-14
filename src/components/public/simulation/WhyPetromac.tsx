import Link from "next/link";

const proofPoints = [
  "Engineering-led planning support",
  "Field-backed configuration logic",
  "Hardware, simulation, and job design in one conversation",
];

export default function WhyPetromac() {
  return (
    <section className="bg-white px-6 py-16 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
        <div>
          <p className="mb-3 text-xs uppercase text-brand font-semibold">
            Planning partner
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-5">
            Not just hardware. Decision support before execution.
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Petromac pairs purpose-built conveyance technology with simulation
            and field experience. The result is a practical recommendation: what
            to run, where the risk sits, and what should trigger a change of plan.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/track-record"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand px-6 py-3 font-semibold text-brand transition-colors hover:bg-brand hover:text-white focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
            >
              Explore track record
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
            >
              Browse hardware
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
          <h3 className="font-heading text-xl font-bold text-slate-900">
            Credibility signals
          </h3>
          <ul className="mt-5 space-y-4">
            {proofPoints.map((point) => (
              <li key={point} className="flex gap-3 text-slate-700">
                <span className="text-brand mt-1 shrink-0">&#x2713;</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-600">
            Compatible planning workflows for all three major wireline providers,
            with final constraints validated during the simulation request.
          </div>
        </div>
      </div>
    </section>
  );
}
