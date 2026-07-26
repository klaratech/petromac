'use client';

import Image from 'next/image';
import Link from 'next/link';
import AthenaTerminal from './AthenaTerminal';

/**
 * Compact "platform band" on the homepage. The full Athena pitch lives
 * on /simulation — this is a single-line tease that keeps the narrative
 * beat (hardware + software) without taking 600px of homepage real estate
 * to repeat what that dedicated page already says.
 */
export default function SoftwareHighlight() {
  return (
    <section className="relative py-10 md:py-12 px-6 bg-gradient-to-b from-[#081a3a] via-slate-900 to-slate-950 scroll-reveal">
      {/* Top hairline — same brand stamp the full section had */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent"
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8">
          {/* Logo + name */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src="/images/athena_logo.png"
                alt=""
                fill
                className="object-contain"
                sizes="48px"
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-blue-300 font-semibold">
                Software
              </p>
              <h3 className="font-heading text-2xl font-bold text-white leading-tight">
                Planning intelligence
              </h3>
            </div>
          </div>

          {/* Copy — mirrors the /simulation hero pitch; Athena is named here
              since the band title is now the capability, not the product. */}
          <p className="text-slate-300 md:flex-1 md:max-w-xl text-base leading-relaxed">
            Athena&trade; turns wireline run planning into a risk / return decision —{' '}
            <span className="text-white font-semibold whitespace-nowrap">
              simulate with confidence
            </span>
            .
          </p>

          {/* CTA */}
          <Link
            href="/simulation"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white border-2 border-white/40 hover:bg-white hover:text-slate-900 hover:border-white transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900 whitespace-nowrap self-start md:self-auto"
          >
            See the platform
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

        {/* Simulated Athena run — fully rendered on the server, replayed as
            a typewriter once when it first scrolls into view. */}
        <div className="mt-8 max-w-3xl mx-auto">
          <AthenaTerminal />
        </div>
      </div>
    </section>
  );
}
