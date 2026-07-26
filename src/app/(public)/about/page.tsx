import Image from 'next/image';
import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'About',
  description:
    "Learn about Petromac's origins, our founder Stephen McCormick, and the engineering drive behind our wireline logging solutions.",
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Header band */}
        <header className="mb-10 md:mb-12 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-brand font-semibold mb-3">About</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Origins of Petromac
          </h1>
          <p className="text-base md:text-lg text-slate-600 leading-relaxed">
            Founded out of decades of wireline logging experience and a persistent frustration with
            the limitations of conventional conveyance.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Story (3 cols) */}
          <article className="lg:col-span-3 bg-white rounded-2xl ring-1 ring-slate-200 shadow-card p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Founder portrait */}
              <div className="md:w-1/4 flex-shrink-0">
                <Image
                  src="/images/team/Steve.jpg"
                  alt="Stephen McCormick — Founder"
                  width={300}
                  height={400}
                  className="rounded-xl shadow-md w-full h-auto ring-1 ring-slate-200"
                />
              </div>

              {/* Story body */}
              <div className="md:w-3/4 space-y-4 text-slate-700 leading-relaxed">
                <p>
                  Throughout my career in petrophysics, I became increasingly frustrated with the
                  poor log data from drill pipe conveyance and logging while drilling measurements.
                  It is well recognised that wireline logs can deliver the most accurate, high
                  resolution information in a very efficient manner. Wireline logging operations
                  however, do not always run smoothly. Ledges, cuttings and high deviation can
                  impede tool-string descent. Tool sticking compromises data quality and often leads
                  to considerable unplanned expense.
                </p>

                <p>
                  Qualified as a mechanical engineer, with a drive for perfection, I set out to
                  design, validate and manufacture a range of bespoke devices with the aim to
                  minimise wireline logging risk, improve operational efficiency and data quality.
                  The Petromac wireline express system was born to resolve the challenges that have
                  plagued wireline logging for over 50&nbsp;years.
                </p>

                <p>
                  Our passionate team of highly experienced regional managers pride themselves on
                  delivery of exceptional outcomes to customers through the use of our
                  world&nbsp;leading bespoke devices.
                </p>

                {/* Founder credit */}
                <div className="pt-5 mt-2 border-t border-slate-200">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold mb-1">
                    Founder
                  </p>
                  <p className="text-xl font-bold text-slate-900">Stephen McCormick</p>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar (1 col) */}
          <aside className="lg:col-span-1">
            <p className="text-[11px] uppercase tracking-[0.3em] text-brand font-semibold mb-3 lg:mb-4 lg:pl-1">
              Explore
            </p>
            <div className="space-y-3">
              <SidebarLink
                href="/team"
                title="Team"
                description="Regional managers across the major oil & gas basins, plus the HQ engineering team."
              />
              <SidebarLink
                href="/about/patents"
                title="Patents"
                description="44 granted patents across 9 device categories."
              />
              <SidebarLink
                href="/about/publications"
                title="Publications"
                description="SPE, SPWLA, IPTC and related peer-reviewed papers."
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group block p-4 rounded-xl bg-white ring-1 ring-slate-200 hover:ring-brand/40 shadow-sm hover:shadow-card transition-all"
    >
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-heading text-base font-bold text-slate-900 group-hover:text-brand transition-colors">
          {title}
        </h4>
        <span
          aria-hidden="true"
          className="text-brand opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
        >
          →
        </span>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </Link>
  );
}
