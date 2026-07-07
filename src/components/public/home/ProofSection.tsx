import Link from 'next/link';
// Headline stats are computed by the data pipeline (generate_json.py) and
// committed alongside the operations JSON. Importing them at build time
// means the homepage no longer downloads the ~600 KB operations dataset
// just to show two numbers — and there's no hardcoded fallback to drift.
import operationsStats from '../../../../public/data/operations_stats.json';

const FOUNDED_YEAR = 2013;

export default function ProofSection() {
  const stats = {
    countries: operationsStats.countries,
    deployments: operationsStats.deployments,
    years: new Date().getFullYear() - FOUNDED_YEAR,
  };

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-brand font-semibold mb-3">Proof</p>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-14">
          Proven in the field
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-14">
          <div>
            <p className="font-heading text-5xl md:text-6xl font-bold text-brand tabular-nums">
              {stats.countries}+
            </p>
            <p className="text-slate-600 mt-2 font-medium">Countries</p>
          </div>
          <div>
            <p className="font-heading text-5xl md:text-6xl font-bold text-brand tabular-nums">
              {stats.deployments.toLocaleString()}+
            </p>
            <p className="text-slate-600 mt-2 font-medium">Successful Deployments</p>
          </div>
          <div>
            <p className="font-heading text-5xl md:text-6xl font-bold text-brand tabular-nums">
              {stats.years}+
            </p>
            <p className="text-slate-600 mt-2 font-medium">Years of Experience</p>
          </div>
        </div>

        <Link
          href="/track-record"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full border-2 border-brand text-brand font-semibold hover:bg-brand hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        >
          Explore our track record
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Reach summary — replaces the placeholder logo strip. */}
        <div className="mt-16 pt-12 border-t border-slate-200">
          <p className="text-base md:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Deployed with{' '}
            <span className="font-semibold text-slate-900">all major IOCs and NOCs</span> across{' '}
            <span className="font-semibold text-slate-900">{stats.countries}+ countries</span>.
          </p>
        </div>
      </div>
    </section>
  );
}
