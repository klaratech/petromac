"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { JobRecord } from "@/types/JobRecord";
import { fetchOperationsData } from "@/lib/map/data";

// DrilldownMapCore brings d3 + r3f-adjacent deps; keep it lazy and CSR-only.
const DrilldownMapCore = dynamic(
  () => import("@/components/geo/DrilldownMapCore"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[80vh] flex items-center justify-center text-slate-500" role="status">
        Loading map…
      </div>
    ),
  },
);

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

  useEffect(() => {
    fetchOperationsData()
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load track record"),
      );
  }, []);

  const stats: Stats | null = useMemo(() => {
    if (!data) return null;
    const deployments = data.reduce((sum, r) => sum + (Number(r.Successful) || 0), 0);
    const countries = new Set(
      data
        .filter((r) => (Number(r.Successful) || 0) > 0)
        .map((r) => r.Country),
    ).size;
    const years = new Date().getFullYear() - FOUNDED_YEAR;
    return { deployments, countries, years };
  }, [data]);

  return (
    <main className="bg-slate-50">
      {/* Header band — constrained width */}
      <section className="container mx-auto px-4 pt-12 pb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-600 font-semibold mb-3">
              Track Record
            </p>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.05] mb-4">
              Every job. Every country. Since 2013.
            </h1>
            <p className="text-lg text-slate-600">
              From the first wireline run to thousands of deployments across
              every major basin — every Petromac job, mapped.
            </p>
          </div>
          <Link
            href="/success-stories/flipbook"
            className="self-start md:self-end inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-slate-300 text-slate-700 hover:border-blue-600 hover:text-blue-700 transition-colors font-medium whitespace-nowrap"
          >
            Success Stories
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Hero stats — 3 tiles, big bold numbers */}
      <section className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile
            label="Deployments"
            value={stats?.deployments}
            suffix="+"
            loading={!stats && !error}
          />
          <StatTile
            label="Countries"
            value={stats?.countries}
            loading={!stats && !error}
          />
          <StatTile
            label="Years of operations"
            value={stats?.years}
            loading={!stats && !error}
          />
        </div>
      </section>

      {/* Map — full bleed on large screens with a deep brand frame */}
      <section className="bg-slate-900 py-6 md:py-8">
        <div className="px-3 md:px-6 lg:px-10">
          <div className="relative w-full rounded-2xl overflow-hidden bg-white shadow-2xl ring-1 ring-slate-200">
            {error ? (
              <div className="h-[60vh] flex flex-col items-center justify-center gap-3 p-6 text-center">
                <h3 className="text-lg font-semibold text-red-600">
                  Couldn&apos;t load track record
                </h3>
                <p className="text-slate-600 max-w-md">{error}</p>
              </div>
            ) : !data ? (
              <div className="h-[70vh] flex items-center justify-center text-slate-500" role="status">
                Loading map data…
              </div>
            ) : (
              <DrilldownMapCore
                data={data}
                hideInlineStats
                showSuccessStoriesLink={false}
                className="relative w-full h-[70vh] md:h-[78vh] overflow-hidden bg-slate-50"
              />
            )}
          </div>
        </div>
      </section>

      {/* Footnote */}
      <section className="container mx-auto px-4 py-10 text-center">
        <p className="text-sm text-slate-500">
          Tap a country to see the year-by-year breakdown. Filter by system in
          the panel at the bottom of the map.
        </p>
      </section>
    </main>
  );
}

function StatTile({
  label,
  value,
  suffix = "",
  loading,
}: {
  label: string;
  value: number | undefined;
  suffix?: string;
  loading?: boolean;
}) {
  const display = value === undefined ? "—" : value.toLocaleString();
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-6 py-6 md:py-8">
      <p
        className={`font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-blue-700 tabular-nums leading-none transition-opacity duration-500 ${
          loading ? "opacity-30" : "opacity-100"
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
