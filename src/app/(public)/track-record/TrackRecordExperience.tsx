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

  const systemOptions = useMemo(
    () => (data ? Array.from(new Set(data.map((job) => job.System).filter(Boolean))).sort() : []),
    [data]
  );

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
                      aria-label={`${isOn ? 'Hide' : 'Show'} ${sys} deployments`}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isOn
                          ? 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700'
                          : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {sys}
                    </button>
                  );
                })}
                {allSelected ? (
                  <button
                    onClick={() => setSelectedSystems([])}
                    className="text-xs text-slate-500 hover:text-slate-800 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    Clear
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedSystems(systemOptions)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    All
                  </button>
                )}
              </>
            )}
          </div>

          {/* Live counter (tile style) + quiet records anchor */}
          <div className="flex items-center justify-between md:justify-end gap-4">
            <div
              className="bg-white/95 border border-slate-200 rounded-lg shadow px-3 py-2"
              role="status"
              aria-live="polite"
            >
              <p className="text-lg font-bold text-brand tabular-nums leading-none">
                {counterText}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Deployments
              </p>
            </div>
            <a
              href="#records"
              className="text-sm font-medium text-slate-500 hover:text-brand whitespace-nowrap transition-colors"
            >
              Records &amp; success stories ↓
            </a>
          </div>
        </div>

        {/* Map area — the page's hero. */}
        <div className="h-[62vh] min-h-[420px] md:h-[66vh] md:min-h-[520px]">
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

      {/* Growth chart — same filter state as the map and counter. */}
      <div className="mt-3 rounded-2xl bg-white ring-1 ring-slate-200 shadow-2xl px-5 py-4 md:px-8 md:py-5">
        <GrowthChart points={chartPoints} allSelected={allSelected || !data} summary={summary} />
      </div>
    </div>
  );
}

/** Dependency-free inline-SVG cumulative area chart. Server-renders the
 *  all-systems default; re-renders client-side when the filter changes. */
function GrowthChart({
  points,
  allSelected,
  summary,
}: {
  points: YearPoint[];
  allSelected: boolean;
  summary: string;
}) {
  if (points.length < 2) {
    return (
      <div>
        <p className="text-sm text-slate-500 py-6 text-center">
          Not enough data for this selection.
        </p>
        <figcaption className="mt-1 text-xs text-slate-500">{summary}</figcaption>
      </div>
    );
  }

  const W = 800;
  const H = 150;
  const PAD = { top: 14, right: 16, bottom: 22, left: 16 };
  const minYear = points[0].year;
  const maxYear = points[points.length - 1].year;
  const maxTotal = points[points.length - 1].total;

  const x = (year: number) =>
    PAD.left + ((year - minYear) / Math.max(1, maxYear - minYear)) * (W - PAD.left - PAD.right);
  const y = (total: number) => PAD.top + (1 - total / maxTotal) * (H - PAD.top - PAD.bottom);

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.year)},${y(p.total)}`).join(' ');
  const area = `${line} L${x(maxYear)},${H - PAD.bottom} L${x(minYear)},${H - PAD.bottom} Z`;
  const last = points[points.length - 1];

  // Intermediate ticks every 3 years, always including the last year.
  const ticks: number[] = [];
  for (let yr = minYear; yr < maxYear; yr += 3) ticks.push(yr);
  if (ticks[ticks.length - 1] !== maxYear) ticks.push(maxYear);

  return (
    <figure aria-label={`Cumulative successful deployments, ${minYear} to ${maxYear}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          Cumulative deployments{allSelected ? '' : ' — filtered'}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-1 w-full h-auto"
        role="img"
        aria-hidden="true"
        focusable="false"
      >
        <path d={area} fill="#1E4A9A" fillOpacity="0.08" />
        <path d={line} fill="none" stroke="#1E4A9A" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={x(last.year)} cy={y(last.total)} r="4" fill="#1E4A9A" />
        {ticks.map((yr) => (
          <g key={yr}>
            <line
              x1={x(yr)}
              x2={x(yr)}
              y1={H - PAD.bottom}
              y2={H - PAD.bottom + 4}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
            <text
              x={x(yr)}
              y={H - 6}
              fontSize="11"
              fill="#64748b"
              textAnchor={yr === maxYear ? 'end' : yr === minYear ? 'start' : 'middle'}
            >
              {yr}
            </text>
          </g>
        ))}
        <text
          x={x(last.year) - 10}
          y={y(last.total) + 4}
          fontSize="12"
          fontWeight="700"
          fill="#1E4A9A"
          textAnchor="end"
        >
          {last.total.toLocaleString()}
        </text>
      </svg>
      {/* The page's crawler-visible summary sentence lives here (the old
          header band's intro). Static all-systems figures by design. */}
      <figcaption className="mt-1.5 text-xs text-slate-500">{summary}</figcaption>
    </figure>
  );
}
