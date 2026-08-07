'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { preload } from 'react-dom';
import type { JobRecord } from '@/types/JobRecord';
import { fetchOperationsData } from '@/lib/map/data';
import { EXTERNAL_URLS } from '@/constants/app';
import { cumulativeDeploymentsByYear, type YearPoint } from '@/lib/map/process';

// DrilldownMapCore brings d3 + r3f-adjacent deps; keep it lazy and CSR-only.
const DrilldownMapCore = dynamic(() => import('@/components/geo/DrilldownMapCore'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-slate-500" role="status">
      Loading map…
    </div>
  ),
});

// Chip display order (product priority, not alphabetical). Values must
// match the System column of operations_data.json exactly.
const SYSTEM_ORDER = [
  'Wireline Express',
  'Wireline Express - FT',
  'PathFinder',
  'Focus - CH',
  'Focus - OH',
  'Thor',
  'Other',
];

// Display names for the chips. Keys are System values from
// operations_data.json — which stay the filter values untouched, so the
// data pipeline and map are unaffected. Anything unmapped shows as-is.
// 'Wireline Express - FT' reads as internal shorthand; reviewers asked
// for the plain product term (Martin, Aug 2026).
const SYSTEM_LABELS: Record<string, string> = {
  'Wireline Express - FT': 'Formation Testing',
  Thor: 'Thor™',
};

const systemLabel = (sys: string): string => SYSTEM_LABELS[sys] ?? sys;

export interface TrackRecordStats {
  deployments: number;
  countries: number;
  years: number;
}

/**
 * The Track Record page's interactive core: card header (H1, filter chips,
 * live deployment counter, records anchor link), the map, and the
 * filter-aware cumulative chart beneath — one filter state shared by all
 * three (lifted here so map, counter, and chart can never disagree).
 *
 * Server-rendered defaults: the all-systems counter value and the
 * all-systems chart curve arrive as props computed at build time from the
 * same pipeline generation the map fetches (versioned by `dataVersion`),
 * so crawlers/no-JS get real content and hydration changes nothing until
 * the user filters.
 */
export default function TrackRecordExperience({
  stats,
  dataVersion,
  defaultChart,
}: {
  stats: TrackRecordStats;
  /** Build-time operations_stats generatedAt stamp — versions the data
   *  fetch so all surfaces describe the same dataset generation. */
  dataVersion: string;
  /** All-systems cumulative curve, computed server-side at build. */
  defaultChart: YearPoint[];
}) {
  const [data, setData] = useState<JobRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // null = "everything" (pre-hydration / pre-data default); becomes a real
  // array once the user interacts or data seeds it.
  const [selectedSystems, setSelectedSystems] = useState<string[] | null>(null);

  // Parallelize the three big loads (operations JSON, world topojson, d3
  // chunk) instead of a serial waterfall. Effect-only: preload() in the
  // render path can truncate the SSR stream (Next 16 turbopack dev).
  useEffect(() => {
    preload(EXTERNAL_URLS.WORLD_MAP_DATA, { as: 'fetch' });
    void import('@/components/geo/DrilldownMapCore');
    fetchOperationsData(dataVersion)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load track record'));
  }, [dataVersion]);

  const systemOptions = useMemo(() => {
    if (!data) return [];
    const found = Array.from(new Set(data.map((job) => job.System).filter(Boolean)));
    // Display order per product priority; anything new lands at the end.
    return found.sort((a, b) => {
      const ia = SYSTEM_ORDER.indexOf(a);
      const ib = SYSTEM_ORDER.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [data]);

  const effectiveSelection = selectedSystems ?? systemOptions;
  const allSelected = effectiveSelection.length === systemOptions.length;

  // Counter + chart from ONE shared calculation with the map's exact
  // counting semantics (lib/map/process). Default (all systems / no data
  // yet) uses the build-time curve so SSR and first client render match.
  const chartPoints = useMemo<YearPoint[]>(() => {
    if (!data || allSelected) return defaultChart;
    return cumulativeDeploymentsByYear(data, effectiveSelection);
  }, [data, allSelected, effectiveSelection, defaultChart]);

  const liveCount = chartPoints.length > 0 ? chartPoints[chartPoints.length - 1].total : 0;
  // All-systems shows the marketing "+" figure; a subset shows its exact count.
  const counterText =
    allSelected || !data ? `${stats.deployments.toLocaleString()}+` : liveCount.toLocaleString();

  const toggleSystem = (system: string) => {
    setSelectedSystems((prev) => {
      const base = prev ?? systemOptions;
      return base.includes(system) ? base.filter((s) => s !== system) : [...base, system];
    });
  };

  const summary = `Petromac has completed ${stats.deployments.toLocaleString()}+ successful wireline deployments across ${stats.countries}+ countries over ${stats.years}+ years of operations.`;

  return (
    <div>
      {/* Map card. `isolate` fences the in-map overlay z-indexes (Top 5
          panel, hover tooltip) into their own stacking context so they can
          never paint over the sticky site header. */}
      <div className="relative isolate w-full rounded-2xl overflow-hidden bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Card header row: title · filter chips · live counter + anchor.
            Stacks on mobile (chips scroll horizontally). */}
        <div className="flex flex-col gap-3 px-4 py-3 md:px-5 md:flex-row md:items-center md:gap-5 border-b border-slate-100">
          <h1 className="font-heading text-xl md:text-2xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
            Track record
          </h1>

          {/* Filter chips — appear once the dataset arrives */}
          <div
            className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto no-scrollbar md:justify-center"
            role="group"
            aria-label="Filter by system"
          >
            {systemOptions.length > 0 && (
              <>
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap">
                  Filter
                </span>
                {systemOptions.map((sys) => {
                  const isOn = effectiveSelection.includes(sys);
                  return (
                    <button
                      key={sys}
                      onClick={() => toggleSystem(sys)}
                      aria-pressed={isOn}
                      aria-label={`${isOn ? 'Hide' : 'Show'} ${systemLabel(sys)} deployments`}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isOn
                          ? 'bg-blue-50 text-brand border border-brand/40 hover:border-brand/70'
                          : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
                      }`}
                    >
                      {systemLabel(sys)}
                    </button>
                  );
                })}
                {/* Both controls always available — Clear supports the
                    "clear then pick one" flow without unticking chips
                    one by one. */}
                <button
                  onClick={() => setSelectedSystems(systemOptions)}
                  disabled={allSelected}
                  className="text-xs font-medium whitespace-nowrap rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-blue-600 hover:text-blue-800 disabled:text-slate-300 disabled:cursor-default"
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedSystems([])}
                  disabled={effectiveSelection.length === 0}
                  className="text-xs whitespace-nowrap rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-slate-500 hover:text-slate-800 disabled:text-slate-300 disabled:cursor-default"
                >
                  Clear
                </button>
              </>
            )}
          </div>

          {/* Quiet records anchor (the live counter lives in the in-map
              chart overlay, top-right) */}
          <a
            href="#records"
            className="self-start md:self-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-brand/30 px-4 py-2 text-sm font-semibold text-brand hover:border-brand hover:bg-brand/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Records &amp; success stories <span aria-hidden="true">↓</span>
          </a>
        </div>

        {/* Map area — the page's hero. The chart overlay (top-left, clear
            of the right-side yearly-stats drawer) merges the live
            deployment counter with a filter-driven cumulative sparkline;
            pointer-transparent so it never blocks map interaction. */}
        <div className="relative h-[62vh] min-h-[420px] md:h-[66vh] md:min-h-[520px]">
          <ChartOverlay points={chartPoints} counterText={counterText} />
          {error ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
              <h3 className="text-lg font-semibold text-red-600">
                Couldn&apos;t load the operations map
              </h3>
              <p className="text-slate-600 max-w-md">
                {summary} Please try refreshing the page — or{' '}
                <Link href="/#contact" className="text-brand font-semibold hover:underline">
                  contact us
                </Link>{' '}
                for the full track record.
              </p>
            </div>
          ) : !data ? (
            // Initial (server-rendered) state: real content for crawlers,
            // with a quiet hint that the interactive map is on its way.
            <div
              className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center"
              role="status"
            >
              <p className="text-slate-600 max-w-md leading-relaxed">{summary}</p>
              <p className="text-sm text-slate-400">Loading interactive map…</p>
            </div>
          ) : (
            <DrilldownMapCore
              data={data}
              hideInlineStats
              hideSystemFilter
              selectedSystems={effectiveSelection}
              showSuccessStoriesLink={false}
              className="relative w-full h-full overflow-hidden bg-slate-50"
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** Compact in-map overlay: live deployment count + filter-driven
 *  cumulative sparkline. Sits top-right (the old legend position),
 *  pointer-transparent, server-rendered with the build-time defaults. */
function ChartOverlay({
  points: rawPoints,
  counterText,
}: {
  points: YearPoint[];
  counterText: string;
}) {
  const W = 200;
  const H = 48;
  const PAD = 3;
  // Cumulative curves start from a zero baseline the year before the first
  // deployment — also guarantees single-year series (e.g. Thor, all 2024)
  // still draw a rising line instead of a suppressed chart.
  const points: YearPoint[] =
    rawPoints.length > 0 ? [{ year: rawPoints[0].year - 1, total: 0 }, ...rawPoints] : rawPoints;
  const hasCurve = points.length >= 2;

  let line = '';
  let area = '';
  if (hasCurve) {
    const minYear = points[0].year;
    const maxYear = points[points.length - 1].year;
    const maxTotal = points[points.length - 1].total;
    const x = (year: number) =>
      PAD + ((year - minYear) / Math.max(1, maxYear - minYear)) * (W - PAD * 2);
    const y = (total: number) => PAD + (1 - total / maxTotal) * (H - PAD * 2);
    line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.year)},${y(p.total)}`).join(' ');
    area = `${line} L${x(maxYear)},${H - PAD} L${x(points[0].year)},${H - PAD} Z`;
  }

  return (
    <div className="absolute top-3 left-3 md:top-4 md:left-4 z-40 w-[170px] md:w-[210px] pointer-events-none">
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow px-3 py-2.5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Deployments</p>
        <p
          className="mt-0.5 text-lg font-bold text-brand tabular-nums leading-none"
          role="status"
          aria-live="polite"
        >
          {counterText}
        </p>
        {hasCurve ? (
          <>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="mt-1.5 w-full h-auto"
              aria-hidden="true"
              focusable="false"
            >
              <path d={area} fill="#1E4A9A" fillOpacity="0.1" />
              <path d={line} fill="none" stroke="#1E4A9A" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <div className="flex justify-between text-[9px] text-slate-400 tabular-nums leading-none mt-0.5">
              <span>{points[0].year}</span>
              <span>{points[points.length - 1].year}</span>
            </div>
          </>
        ) : (
          <p className="mt-1.5 text-[10px] text-slate-400">No deployments for this selection</p>
        )}
      </div>
    </div>
  );
}
