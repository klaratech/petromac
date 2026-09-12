import { memo, useState } from 'react';
import type { CountryChartProps } from '@/types/MapTypes';
import { MAP_CONSTANTS } from '@/constants/mapConstants';

/** Roughly how many rows the scroll viewport shows — only used for the
 *  "+N more countries" arithmetic, not for slicing the list. */
const VISIBLE_ROWS = 5;

/**
 * CountryChart — horizontal bar chart of country deployment counts.
 *
 * The FULL list renders in a scroll viewport sized to ~5 rows with a
 * visible scrollbar — there is no expand/collapse (v3, Rajesh Sep 2026:
 * "why click to let the scrolling appear"). The "+N more countries"
 * footer is a passive callout whose only job is to say the list doesn't
 * stop at what's visible; it fades out once the user scrolls down and
 * comes back at the top. Each row is a button that selects that country
 * on the map (opening its yearly-stats drawer); the trailing chevron is
 * the visual hint for that. Renders as a compact pill anchored to the
 * bottom-left of the map container.
 */
const CountryChart = memo(function CountryChart({
  countries,
  countryLabels,
  selectedCountry,
  onCountryClick,
}: CountryChartProps) {
  const [atTop, setAtTop] = useState(true);

  if (countries.length === 0) return null;

  const maxCount = countries[0][1];
  const moreCount = countries.length - VISIBLE_ROWS;

  return (
    <div
      className="
        absolute z-40
        bottom-4 left-4
        bg-white text-slate-900
        border border-slate-200 rounded-xl shadow-lg
        px-3.5 py-2.5
        w-[240px] md:w-[260px]
      "
      role="region"
      aria-label="Countries by deployments"
    >
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-slate-500">
        Deployments by country
      </p>

      <ul
        onScroll={(e) => setAtTop(e.currentTarget.scrollTop < 8)}
        className="space-y-1.5 max-h-[248px] overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300"
      >
        {countries.map(([country, count]) => {
          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const isSelected = selectedCountry === country;
          const label = countryLabels[country] || country;

          return (
            <li key={country}>
              <button
                type="button"
                onClick={() => onCountryClick(selectedCountry === country ? null : country)}
                className={`group w-full grid grid-cols-[1fr_auto_auto] items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-slate-100 ${MAP_CONSTANTS.FOCUS_RING} ${
                  isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : ''
                }`}
                aria-label={`${label}: ${count} deployment${count !== 1 ? 's' : ''}. ${isSelected ? 'Selected — click to deselect.' : 'Click to see yearly detail.'}`}
                aria-pressed={isSelected}
              >
                <div className="min-w-0">
                  <div
                    className={`text-xs font-medium truncate ${
                      isSelected ? 'text-blue-900' : 'text-slate-700'
                    }`}
                    title={label}
                  >
                    {label}
                  </div>
                  <div className="h-1.5 mt-1 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${Math.max(pct, 4)}%`,
                        backgroundColor: isSelected ? MAP_CONSTANTS.COLORS.CHART_BAR : '#60a5fa',
                      }}
                    />
                  </div>
                </div>
                <div
                  className={`text-xs tabular-nums font-semibold ${
                    isSelected ? 'text-blue-700' : 'text-slate-700'
                  }`}
                >
                  {count}
                </div>
                {/* The affordance that rows drill into the map */}
                <span
                  aria-hidden="true"
                  className={`text-sm leading-none ${
                    isSelected ? 'text-blue-400' : 'text-slate-300 group-hover:text-slate-500'
                  }`}
                >
                  ›
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {moreCount > 0 && (
        <p
          aria-hidden={!atTop}
          className={`mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-500 text-center transition-opacity duration-300 ${
            atTop ? 'opacity-100' : 'opacity-0'
          }`}
        >
          + {moreCount} more countries
        </p>
      )}
    </div>
  );
});

export default CountryChart;
