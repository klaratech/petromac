import { memo } from 'react';
import type { YearlyStatsChartProps } from '@/types/MapTypes';
import { MAP_CONSTANTS } from '@/constants/mapConstants';

/**
 * YearlyStatsChart — right-side slide-in drawer (was a floating popup).
 *
 * On desktop renders as a 360-wide drawer pinned to the right edge of
 * the map container. On mobile (<768px) it slides up from the bottom
 * as a sheet so it doesn't dominate the small viewport.
 */
const YearlyStatsChart = memo(function YearlyStatsChart({
  countryName,
  yearlyStats,
  onClose,
}: YearlyStatsChartProps) {
  if (yearlyStats.length === 0) return null;

  const maxValue = Math.max(...yearlyStats.map((s) => s.count));
  const total = yearlyStats.reduce((sum, s) => sum + s.count, 0);
  const firstYear = yearlyStats[0]?.year;
  const lastYear = yearlyStats[yearlyStats.length - 1]?.year;

  // Mobile: bottom sheet (inset-x-0 bottom-0 max-h-[75%]).
  // Desktop (md+): right-side drawer, full map height, 360px wide.
  const drawerClasses = [
    'absolute z-50 bg-white shadow-2xl flex flex-col',
    'inset-x-0 bottom-0 max-h-[75%] rounded-t-2xl border-t border-slate-200',
    'md:inset-x-auto md:bottom-auto md:top-0 md:right-0 md:h-full md:w-[360px]',
    'md:rounded-t-none md:border-t-0 md:border-l md:border-slate-200',
  ].join(' ');

  return (
    <aside
      role="region"
      aria-label={`Deployment statistics for ${countryName} by year`}
      className={drawerClasses}
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Deployments by Year
          </p>
          <h3 className="text-lg font-bold text-slate-900 truncate mt-0.5">
            {countryName}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {firstYear} — {lastYear} · {total} total
          </p>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center text-lg ${MAP_CONSTANTS.FOCUS_RING}`}
          aria-label="Close yearly statistics"
        >
          ✕
        </button>
      </header>

      {/* Body — horizontal bars per year, scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <ul className="space-y-2.5" aria-label="Yearly deployment counts">
          {yearlyStats.map((stat) => {
            const pct = maxValue > 0 ? (stat.count / maxValue) * 100 : 0;
            return (
              <li
                key={stat.year}
                className="grid grid-cols-[44px_1fr_auto] items-center gap-3"
              >
                <span className="text-sm font-medium text-slate-600 tabular-nums">
                  {stat.year}
                </span>
                <div className="h-5 rounded bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-300"
                    style={{
                      width: `${Math.max(pct, 2)}%`,
                      backgroundColor: MAP_CONSTANTS.COLORS.CHART_BAR,
                    }}
                    aria-label={`${stat.count} deployments in ${stat.year}`}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-900 tabular-nums w-10 text-right">
                  {stat.count}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <footer className="px-5 py-3 border-t border-slate-200 text-xs text-slate-500">
        Tap another country, or hit Esc to close.
      </footer>
    </aside>
  );
});

export default YearlyStatsChart;
