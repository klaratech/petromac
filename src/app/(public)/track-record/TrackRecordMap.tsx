'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { preload } from 'react-dom';
import type { JobRecord } from '@/types/JobRecord';
import { fetchOperationsData } from '@/lib/map/data';
import { EXTERNAL_URLS } from '@/constants/app';

// DrilldownMapCore brings d3 + r3f-adjacent deps; keep it lazy and CSR-only.
const DrilldownMapCore = dynamic(() => import('@/components/geo/DrilldownMapCore'), {
  ssr: false,
  loading: () => (
    <div className="h-[80vh] flex items-center justify-center text-slate-500" role="status">
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
 * Client island for the interactive operations map. The page shell, headline
 * stats, and metadata are server-rendered in page.tsx; only the map (which
 * needs d3 + a ~600 KB dataset) hydrates client-side. The pre-fetch state
 * renders a track-record summary paragraph — that's what crawlers and social
 * preview bots see in the initial HTML instead of a bare spinner.
 */
export default function TrackRecordMap({
  stats,
  dataVersion,
}: {
  stats: TrackRecordStats;
  /** Build-time operations_stats generatedAt stamp — versions the data
   *  fetch so the map always shows the same dataset generation as the
   *  server-rendered numbers (see fetchOperationsData). */
  dataVersion: string;
}) {
  const [data, setData] = useState<JobRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The map used to load as a 3-step serial waterfall: operations JSON →
  // (map renders) → d3 chunk → world topojson, ~2 MB back-to-back. Kick
  // all three off in parallel instead: preload the world file the map
  // will fetch, and warm the dynamic chunk while the data downloads.
  // Runs in an effect, NOT during render: react-dom preload() calls in the
  // render path write into the SSR stream and can truncate it mid-flush
  // (Next 16 turbopack dev), leaving the route stuck on a fallback.
  useEffect(() => {
    preload(EXTERNAL_URLS.WORLD_MAP_DATA, { as: 'fetch' });
    void import('@/components/geo/DrilldownMapCore');
    fetchOperationsData(dataVersion)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load track record'));
  }, [dataVersion]);

  const summary = `Petromac has completed ${stats.deployments.toLocaleString()}+ successful wireline deployments across ${stats.countries}+ countries over ${stats.years}+ years of operations.`;

  if (error) {
    return (
      <div className="h-[75vh] flex flex-col items-center justify-center gap-3 p-6 text-center">
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
    );
  }

  if (!data) {
    // Initial (server-rendered) state: real content for crawlers, with a
    // quiet hint that the interactive map is on its way.
    return (
      <div
        className="h-[82vh] flex flex-col items-center justify-center gap-3 p-6 text-center"
        role="status"
      >
        <p className="text-slate-600 max-w-md leading-relaxed">{summary}</p>
        <p className="text-sm text-slate-400">Loading interactive map…</p>
      </div>
    );
  }

  return (
    <DrilldownMapCore
      data={data}
      hideInlineStats
      showSuccessStoriesLink={false}
      className="relative w-full h-[78vh] md:h-[85vh] overflow-hidden bg-slate-50"
    />
  );
}
