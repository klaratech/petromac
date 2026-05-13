import { memo, useState } from 'react';
import type { CountryChartProps } from '@/types/MapTypes';
import { APP_CONSTANTS } from '@/constants/app';
import { MAP_CONSTANTS } from '@/constants/mapConstants';

const TOP_N_DEFAULT = 5;

/**
 * CountryChart — horizontal bar chart of country deployment counts.
 *
 * Default view shows the top 5 by count. "Show all" expands to the
 * existing 15-country cap; "Show top 5" collapses back. Renders as a
 * compact pill anchored to the bottom-left of the map container.
 */
const CountryChart = memo(function CountryChart({
  countries,
  countryLabels,
  selectedCountry,
  onCountryClick,
}: CountryChartProps) {
  const [expanded, setExpanded] = useState(false);

  if (countries.length === 0) return null;

  const maxCount = countries[0][1];
  const limit = expanded ? APP_CONSTANTS.MAX_CHART_COUNTRIES : TOP_N_DEFAULT;
  const visibleCountries = countries.slice(0, limit);
  const moreCount = countries.length - visibleCountries.length;

  return (
    <div
      className="
        absolute z-40
        bottom-4 left-4
        bg-white/95 backdrop-blur-md text-slate-900
        border border-slate-200 rounded-xl shadow-lg
        px-4 py-3
        w-[280px] md:w-[320px]
      "
      role="region"
      aria-label="Top countries by deployments"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
            By Country
          </p>
          <p className="text-sm font-semibold text-slate-900">
            {expanded ? 'All deployments' : 'Top 5'}
          </p>
        </div>
        {countries.length > TOP_N_DEFAULT && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className={`text-xs font-medium text-blue-600 hover:text-blue-800 ${MAP_CONSTANTS.FOCUS_RING} rounded px-1`}
          >
            {expanded ? 'Top 5' : `Show all (${countries.length})`}
          </button>
        )}
      </div>

      <ul className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
        {visibleCountries.map(([country, count]) => {
          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const isSelected = selectedCountry === country;
          const label = countryLabels[country] || country;

          return (
            <li key={country}>
              <button
                type="button"
                onClick={() =>
                  onCountryClick(selectedCountry === country ? null : country)
                }
                className={`w-full grid grid-cols-[1fr_auto] items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-slate-100 ${MAP_CONSTANTS.FOCUS_RING} ${
                  isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : ''
                }`}
                aria-label={`${label}: ${count} deployment${count !== 1 ? 's' : ''}. ${isSelected ? 'Selected — click to deselect.' : 'Click to select.'}`}
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
                        backgroundColor: isSelected
                          ? MAP_CONSTANTS.COLORS.CHART_BAR
                          : '#60a5fa',
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
              </button>
            </li>
          );
        })}
      </ul>

      {moreCount > 0 && !expanded && (
        <p className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-500 text-center">
          +{moreCount} more countries
        </p>
      )}
    </div>
  );
});

export default CountryChart;
