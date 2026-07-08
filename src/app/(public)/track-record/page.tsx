'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { preload } from 'react-dom';
import type { JobRecord } from '@/types/JobRecord';
import { fetchOperationsData } from '@/lib/map/data';
import { EXTERNAL_URLS } from '@/constants/app';

// Success Stories opens as an overlay here (via ?stories=1) instead of its
// own page. Kept out of the bundle until the URL asks for it.
const StoriesOverlay = dynamic(() => import('@/components/public/track-record/StoriesOverlay'), {
  ssr: false,
});

// DrilldownMapCore brings d3 + r3f-adjacent deps; keep it lazy and CSR-only.
const DrilldownMapCore = dynamic(() => import('@/components/geo/DrilldownMapCore'), {
  ssr: false,
  loading: () => (
    <div className="h-[80vh] flex items-center justify-center text-slate-500" role="status">
      Loading map…
    </div>
  ),
});

interface Stats {
  deployments: number;
  countries: number;
  years: number;
}

// Year Petromac started operating. Used to compute the "years of operations"
// hero stat dynamically — no future-staling.
const FOUNDED_YEAR = 2013;

export default function TrackRecordPage() {
  const [data, setData] = useState<JobRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The map used to load as a 3-step serial waterfall: operations JSON →
  // (map renders) → d3 chunk → world topojson, ~2 MB back-to-back. Kick
  // all three off in parallel instead: preload the world file the map
  // will fetch, and warm the dynamic chunk while the data downloads.
  preload(EXTERNAL_URLS.WORLD_MAP_DATA, { as: 'fetch' });

  useEffect(() => {
    void import('@/components/geo/DrilldownMapCore');
    fetchOperationsData()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load track record'));
  }, []);

  const stats: Stats | null = useMemo(() => {
    if (!data) return null;
    const deployments = data.reduce((sum, r) => sum + (Number(r.Successful) || 0), 0);
    const countries = new Set(
      data.filter((r) => (Number(r.Successful) || 0) > 0).map((r) => r.Country)
    ).size;
    const years = new Date().getFullYear() - FOUNDED_YEAR;
    return { deployments, countries, years };
  }, [data]);

  return (
    <main className="bg-slate-50">
      {/* Header band — constrained width */}
      <section className="container mx-auto px-4 pt-12 pb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.05] max-w-3xl md:whitespace-nowrap">
            Every Petromac job — <span className="text-brand">Mapped</span>.
          </h1>
          <Link
            href="/track-record?stories=1"
            scroll={false}
            className="
              self-start md:self-end inline-flex items-center gap-2 whitespace-nowrap
              px-6 py-3 rounded-full font-semibold text-white
              bg-brand hover:bg-brand/90 shadow-lg shadow-blue-900/20
              ring-1 ring-blue-900/10
              transition-all hover:translate-y-[-1px] hover:shadow-xl
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            "
          >
            <span>Read the Success Stories</span>
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
      </section>

      {/* Hero stats — 3 tiles, big bold numbers */}
      <section className="container mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <StatTile
            label="Deployments"
            value={stats?.deployments}
            suffix="+"
            loading={!stats && !error}
          />
          <StatTile label="Countries" value={stats?.countries} loading={!stats && !error} />
          <StatTile label="Years of operations" value={stats?.years} loading={!stats && !error} />
        </div>
      </section>

      {/* Map — full bleed on large screens with a deep brand frame */}
      <section className="bg-slate-900 pt-6 md:pt-10 pb-12 md:pb-16">
        <div className="px-3 md:px-6 lg:px-10">
          <div className="relative w-full rounded-2xl overflow-hidden bg-white shadow-2xl ring-1 ring-slate-200">
            {error ? (
              <div className="h-[75vh] flex flex-col items-center justify-center gap-3 p-6 text-center">
                <h3 className="text-lg font-semibold text-red-600">
                  Couldn&apos;t load track record
                </h3>
                <p className="text-slate-600 max-w-md">{error}</p>
              </div>
            ) : !data ? (
              <div
                className="h-[82vh] flex items-center justify-center text-slate-500"
                role="status"
              >
                Loading map data…
              </div>
            ) : (
              <DrilldownMapCore
                data={data}
                hideInlineStats
                showSuccessStoriesLink={false}
                className="relative w-full h-[78vh] md:h-[85vh] overflow-hidden bg-slate-50"
              />
            )}
          </div>
        </div>
      </section>

      {/* Success Stories overlay — reads ?stories=1. Suspense is required
          because it calls useSearchParams. */}
      <Suspense fallback={null}>
        <StoriesOverlay />
      </Suspense>
    </main>
  );
}

function StatTile({
  label,
  value,
  suffix = '',
  loading,
}: {
  label: string;
  value: number | undefined;
  suffix?: string;
  loading?: boolean;
}) {
  const display = value === undefined ? '—' : value.toLocaleString();
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-6 py-6 md:py-8">
      <p
        className={`font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-brand tabular-nums leading-none transition-opacity duration-500 ${
          loading ? 'opacity-30' : 'opacity-100'
        }`}
        aria-busy={loading}
      >
        {display}
        {value !== undefined && suffix}
      </p>
      <p className="mt-3 text-xs md:text-sm uppercase tracking-[0.18em] text-slate-500 font-medium">
        {label}
      </p>
    </div>
  );
}
