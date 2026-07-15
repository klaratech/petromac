import Link from 'next/link';

/**
 * Quiet transition beat between the challenge cards and the Athena band —
 * replaced the old "Purpose-built hardware" product-card grid (Jul 2026).
 * One centered statement + a single catalog link; no cards, no grid.
 */
export default function BridgeSection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-slate-50">
      <div className="max-w-3xl mx-auto text-center">
        <p className="font-heading text-2xl md:text-3xl lg:text-4xl font-semibold text-slate-900 leading-snug tracking-tight">
          Every one of these challenges is solved by purpose-built hardware — and engineered in
          advance with purpose-built software.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 mt-8 text-brand font-semibold text-lg hover:text-brand/80 transition-colors"
        >
          Browse the catalog
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
