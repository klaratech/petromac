'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  filterFinderEntries,
  PURPOSE_LABELS,
  type FinderEntry,
  type Purpose,
} from '@/features/catalog/content/enrich';

/** Common hole/casing sizes as one-tap presets. */
const PRESETS: { label: string; value: number }[] = [
  { label: '6″', value: 6 },
  { label: '7″', value: 7 },
  { label: '8-1/2″', value: 8.5 },
  { label: '9-5/8″', value: 9.625 },
  { label: '12-1/4″', value: 12.25 },
  { label: '17-1/2″', value: 17.5 },
];

/**
 * Device Finder v1 — hole/casing size + purpose → matching models.
 * Pure client-side filtering over the build-time finder index (the entry
 * list reaches the page only via serialized props, so no SKU names appear
 * in the page markup). Without JS the inputs render inert and no device
 * data is visible — the family cards below remain the no-JS path.
 */
export default function DeviceFinder({ entries }: { entries: FinderEntry[] }) {
  const [sizeText, setSizeText] = useState('');
  const [purpose, setPurpose] = useState<Purpose | ''>('');

  const sizeIn = sizeText.trim() === '' ? undefined : Number(sizeText);
  const active = sizeIn != null || purpose !== '';

  const results = useMemo(
    () => (active ? filterFinderEntries(entries, { sizeIn, purpose }) : []),
    [entries, active, sizeIn, purpose]
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card p-5">
      <h2 className="font-heading text-base font-bold text-slate-900">Device finder</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Filter by hole or casing size and what you need the device to do.
      </p>

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        {/* Size */}
        <div className="flex-1">
          <label
            htmlFor="finder-size"
            className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
          >
            Hole / casing size (in)
          </label>
          <input
            id="finder-size"
            type="number"
            inputMode="decimal"
            min={1}
            max={30}
            step={0.125}
            value={sizeText}
            onChange={(e) => setSizeText(e.target.value)}
            placeholder="e.g. 8.5"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => {
              const isOn = sizeIn === preset.value;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setSizeText(isOn ? '' : String(preset.value))}
                  aria-pressed={isOn}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    isOn
                      ? 'bg-blue-50 text-brand border border-brand/40'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Purpose */}
        <div className="sm:w-56">
          <label
            htmlFor="finder-purpose"
            className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
          >
            Purpose
          </label>
          <select
            id="finder-purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as Purpose | '')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="">Any purpose</option>
            {(Object.keys(PURPOSE_LABELS) as Purpose[]).map((key) => (
              <option key={key} value={key}>
                {PURPOSE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {active && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          {results.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">
              No devices match — try a nearby size or clear the purpose.
            </p>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">
                {results.length} matching {results.length === 1 ? 'device' : 'devices'}
              </p>
              <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                {results.map((entry) => (
                  <li key={entry.slug}>
                    <Link
                      href={entry.href}
                      className="group flex items-baseline justify-between gap-4 py-2 hover:bg-slate-50 rounded px-1.5 -mx-1.5 transition-colors"
                    >
                      <span className="min-w-0">
                        <span className="font-semibold text-sm text-slate-900 group-hover:text-brand transition-colors">
                          {entry.models}
                        </span>
                        <span className="ml-2 text-[11px] text-slate-400">{entry.family}</span>
                        <span className="block text-xs text-slate-500 truncate">
                          {entry.summary}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {entry.holeRange}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
