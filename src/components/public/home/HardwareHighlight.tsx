import Image from 'next/image';
import Link from 'next/link';

/**
 * Hardware twin of the Athena band (SoftwareHighlight) — same layout and
 * chrome so the two read as a matched pair directly above one another.
 * Replaced the centered bridge statement (Jul 2026): eyebrow + title on the
 * left, one line of copy, single catalog CTA. The catalog cover doubles as
 * the "logo" in the same 48px slot Athena's mark uses.
 */
export default function HardwareHighlight() {
  return (
    <section className="relative py-10 md:py-12 px-6 bg-gradient-to-b from-[#081a3a] via-slate-900 to-slate-950">
      {/* Top hairline — same brand stamp the Athena band carries */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent"
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8">
          {/* Cover + name */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src="/images/catalog.png"
                alt=""
                fill
                className="object-contain"
                sizes="48px"
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-blue-300 font-semibold">
                Hardware
              </p>
              <h3 className="font-heading text-2xl font-bold text-white leading-tight">
                Purpose-built hardware
              </h3>
            </div>
          </div>

          {/* Copy */}
          <p className="text-slate-300 md:flex-1 md:max-w-xl text-base leading-relaxed">
            Engineered devices behind every solution above.
          </p>

          {/* CTA */}
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white border-2 border-white/40 hover:bg-white hover:text-slate-900 hover:border-white transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900 whitespace-nowrap self-start md:self-auto"
          >
            Browse the catalog
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
