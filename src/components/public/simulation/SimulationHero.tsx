'use client';

import Image from 'next/image';

// In-page anchors use scrollIntoView instead of plain hash hrefs: setting
// the same location.hash twice is a no-op, so a second click on the CTA
// (after scrolling back up) silently did nothing. No behavior option —
// the scroll inherits the reduced-motion-aware CSS scroll-behavior.
function scrollToId(id: string) {
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView();
  };
}

/**
 * The three inputs Athena combines into a single recommendation.
 * Hermes is the physics/modelling engine; AI checks and regional-manager
 * experience drive the configuration side (which doesn't touch Hermes).
 */
const inputs = [
  {
    name: 'Hermes™',
    text: 'Modelling engine for drag, tension, and sticking risk.',
  },
  {
    name: 'AI checks',
    text: 'Automated validation of the tool-string configuration.',
  },
  {
    name: 'Regional managers',
    text: 'Field experience from the people who run the jobs.',
  },
];

export default function SimulationHero() {
  // Pure-CSS background (was a priority-loaded wallpaper image dimmed to
  // near-invisibility — wasted LCP bandwidth). Same navy gradient family
  // as the homepage Hardware/Athena bands.
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#081a3a] via-slate-900 to-slate-950 px-6 py-14 md:py-16">
      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Brand block. The logo carries the name, so the text beside it
            carries the descriptors instead of repeating "Athena".
            `unoptimized` because the Next image optimizer refuses SVG
            unless `dangerouslyAllowSVG` is set — and a 5 KB single-colour
            vector has nothing to optimize anyway. The white variant is
            deliberate: the blue master (#0c55a6) all but disappears on
            this navy band. */}
        <div className="mb-6 flex items-center gap-4 sm:gap-5">
          <Image
            src="/images/logos/athena-logo-white.svg"
            alt="Athena by Petromac"
            width={466}
            height={360}
            className="h-16 w-auto shrink-0 sm:h-20"
            priority
            unoptimized
          />
          <div className="border-l border-white/15 pl-4 sm:pl-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
              Wireline conveyance decision engine
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Vendor-neutral planning intelligence, by Petromac
            </p>
          </div>
        </div>

        <h1 className="mb-5 max-w-4xl font-heading text-4xl font-bold leading-[1.04] text-white sm:text-5xl md:text-6xl">
          Not just hardware. A planning partner.
        </h1>

        <p className="mb-8 max-w-2xl text-lg leading-relaxed text-slate-100 md:text-xl">
          Athena turns a well plan into a go / no-go call before the operations start. Operators and
          wireline service companies use it to weigh sticking risk and conveyance options while the
          job is still on paper.
        </p>

        {/* The three inputs behind every Athena recommendation */}
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
            Three inputs, one recommendation
          </p>
          <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-3">
            {inputs.map((item) => (
              <div key={item.name} className="bg-slate-950/70 p-4">
                <p className="font-heading text-sm font-bold text-white">{item.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <a
            href="#contact"
            onClick={scrollToId('contact')}
            className="inline-flex items-center justify-center rounded-full bg-brand px-7 py-3 font-semibold text-white shadow-lg shadow-blue-900/30 transition-all hover:-translate-y-0.5 hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black"
          >
            Request a simulation
          </a>
          <a
            href="#athena-demo"
            onClick={scrollToId('athena-demo')}
            className="inline-flex items-center justify-center rounded-full border-2 border-white/60 px-7 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          >
            See Athena in action
          </a>
        </div>
      </div>
    </section>
  );
}
