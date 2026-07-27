'use client';

import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import type { JobRecord } from '@/types/JobRecord';
import LoadingSpinner from '@/components/kiosk/LoadingSpinner';
import { useMapData } from '@/hooks/useMapData';
import { useCountryLabels } from '@/hooks/useCountryLabels';
import { useDebounce } from '@/hooks/useDebounce';
import YearlyStatsChart from '@/components/kiosk/YearlyStatsChart';
import CountryChart from '@/components/kiosk/CountryChart';
import MapRenderer from '@/components/geo/MapRenderer';
import { processMapData, calculateCountryStats, buildIntensityScale } from '@/lib/map/process';
import type { CountryStats, ProcessedMapData, HoverPayload } from '@/types/MapTypes';
import { MAP_CONSTANTS } from '@/constants/mapConstants';

export interface DrilldownMapCoreProps {
  data: JobRecord[];
  initialSystem?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
  showSuccessStoriesLink?: boolean;
  /** Optional handler for the in-map "Success Stories" button. When provided
   *  the button calls this instead of navigating to /success-stories/flipbook,
   *  so kiosk experiences can open success stories as an inline sub-view. */
  onSuccessStoriesClick?: () => void;
  /** When true, hides the small in-map deployments pill (e.g. on the
   *  public Track Record page where the page already has a hero stats
   *  row above the map). */
  hideInlineStats?: boolean;
  className?: string;
}

const DrilldownMapCore = memo(function DrilldownMapCore({
  data,
  initialSystem,
  showCloseButton = false,
  onClose,
  showSuccessStoriesLink = false,
  onSuccessStoriesClick,
  hideInlineStats = false,
  className = 'relative w-full h-[100vh] max-h-[100vh] overflow-hidden bg-white',
}: DrilldownMapCoreProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [tappedCountry, setTappedCountry] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hover, setHover] = useState<HoverPayload | null>(null);
  // One-time guard so the selection is seeded only when the data first
  // loads — NOT every time the user changes the selection. Previously
  // this effect re-ran on `selectedSystems.length` and re-selected every
  // system whenever the array went empty, which made "Clear" impossible.
  const seededRef = useRef(false);

  const { worldData, isLoading: isLoadingMap, error: mapError, retry: retryMap } = useMapData();
  const { countryLabels, isLoading: isLoadingLabels, error: labelsError } = useCountryLabels();

  const debouncedSelectedSystems = useDebounce(selectedSystems, 300);

  const systemOptions = useMemo(() => {
    return Array.from(new Set(data.map((job) => job.System).filter(Boolean))).sort();
  }, [data]);

  useEffect(() => {
    if (seededRef.current || systemOptions.length === 0) return;
    seededRef.current = true;
    if (initialSystem) {
      const matches = systemOptions.filter((s) =>
        s.toLowerCase().startsWith(initialSystem.toLowerCase())
      );
      setSelectedSystems(matches.length > 0 ? matches : systemOptions);
    } else {
      setSelectedSystems(systemOptions);
    }
  }, [initialSystem, systemOptions]);

  const processedData: ProcessedMapData = useMemo(
    () => processMapData(data, debouncedSelectedSystems),
    [data, debouncedSelectedSystems]
  );

  const { filteredData, isPathfinderOnly } = processedData;

  const countryStats: CountryStats[] = useMemo(
    () => calculateCountryStats(data, filteredData, isPathfinderOnly),
    [data, filteredData, isPathfinderOnly]
  );

  const countryMap = useMemo(
    () => new Map(countryStats.map(([country, count]) => [country, count])),
    [countryStats]
  );

  // Quantile-based intensity scale — drives both the choropleth fill and
  // the legend swatches. Rebuilds when the filtered data changes.
  const intensity = useMemo(() => buildIntensityScale(countryStats), [countryStats]);

  const sortedCountries = useMemo(
    () => [...countryStats].sort((a, b) => b[1] - a[1]),
    [countryStats]
  );

  const chartCountries = useMemo(
    () => sortedCountries.filter(([, count]) => count > 0),
    [sortedCountries]
  );

  const totalDeployments = useMemo(
    () => countryStats.reduce((sum, [, count]) => sum + count, 0),
    [countryStats]
  );

  const countryCount = useMemo(
    () => countryStats.filter(([, count]) => count > 0).length,
    [countryStats]
  );

  const yearlyStats = useMemo(() => {
    if (!tappedCountry) return [];

    const source = isPathfinderOnly ? data : filteredData;
    const countryData = source.filter((d: JobRecord) => d.Country === tappedCountry);

    const yearGroups = countryData.reduce(
      (acc: Record<string, number>, d: JobRecord) => {
        const year = d.Year;
        if (!acc[year]) acc[year] = 0;

        if (isPathfinderOnly) {
          acc[year] += (d['PathFinder Run (Y/N)'] || '').trim().toUpperCase() === 'YES' ? 1 : 0;
        } else {
          acc[year] += +d.Successful || 0;
        }

        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(yearGroups)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => +a.year - +b.year);
  }, [data, filteredData, tappedCountry, isPathfinderOnly]);

  const handleSystemToggle = useCallback((system: string) => {
    setSelectedSystems((prev) =>
      prev.includes(system) ? prev.filter((s) => s !== system) : [...prev, system]
    );
  }, []);

  const handleSelectAllSystems = useCallback(() => {
    setSelectedSystems(systemOptions);
  }, [systemOptions]);

  const handleClearSystems = useCallback(() => {
    setSelectedSystems([]);
  }, []);

  const handleCountryClick = useCallback((countryName: string | null) => {
    setTappedCountry((current) => (current === countryName ? null : countryName));
  }, []);

  // Defensive guard (freeze audit, Jul 2026): mousemove fires per pixel and
  // each hover update re-renders this whole overlay tree. Coalesce to one
  // state update per animation frame — a single rAF id, always cancelled or
  // consumed, so there is no unbounded loop and no render flood on
  // low-powered devices. (No ResizeObserver/rAF loops exist elsewhere in
  // the map stack; this was the only unbounded-frequency render path.)
  const hoverRafRef = useRef<number | null>(null);
  const handleCountryHover = useCallback((payload: HoverPayload | null) => {
    if (hoverRafRef.current !== null) cancelAnimationFrame(hoverRafRef.current);
    hoverRafRef.current = requestAnimationFrame(() => {
      hoverRafRef.current = null;
      setHover(payload);
    });
  }, []);
  useEffect(() => {
    return () => {
      if (hoverRafRef.current !== null) cancelAnimationFrame(hoverRafRef.current);
    };
  }, []);

  const handleRetry = useCallback(async () => {
    if (retryCount < MAP_CONSTANTS.MAX_RETRIES) {
      setRetryCount((prev) => prev + 1);
      setTimeout(
        () => {
          retryMap();
        },
        1000 * (retryCount + 1)
      );
    }
  }, [retryCount, retryMap]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setTappedCountry(null);
    }
  }, []);

  // Document-level Escape handler — the map container's onKeyDown only
  // fires when it has focus, which is lost the moment the user clicks a
  // country (focus often moves into the drawer or to <body>). Listen
  // globally while a country is selected so Esc reliably dismisses it.
  useEffect(() => {
    if (!tappedCountry) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTappedCountry(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tappedCountry]);

  const isLoading = isLoadingMap || isLoadingLabels;
  const error = mapError || labelsError;

  if (error && retryCount >= MAP_CONSTANTS.MAX_RETRIES) {
    return (
      <div className={className}>
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-xl font-semibold z-50 bg-white text-black hover:bg-gray-100 rounded-full px-2 py-1 shadow"
            aria-label="Close map"
          >
            ✕
          </button>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
          <div className="text-center p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Map</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
              disabled={retryCount >= MAP_CONSTANTS.MAX_RETRIES}
            >
              Retry ({MAP_CONSTANTS.MAX_RETRIES - retryCount} attempts left)
            </button>
            <div className="mt-4 max-w-md mx-auto">
              <h4 className="font-semibold mb-2">Deployment Summary</h4>
              <div className="space-y-1 text-left">
                {chartCountries.slice(0, 10).map(([country, count]) => (
                  <div key={country} className="flex justify-between py-1 border-b">
                    <span>{countryLabels[country] || country}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Interactive deployment map"
    >
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-xl font-semibold z-50 bg-white text-black hover:bg-gray-100 rounded-full px-2 py-1 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close map"
        >
          ✕
        </button>
      )}

      {/* Inline stats pill (hidden on the public Track Record page where
          the page already has a hero stats row above the map). Two big
          stat tiles — easier to read across a trade-show booth than the
          previous one-line text. */}
      {!hideInlineStats && (
        <div
          className="absolute top-4 left-4 z-40 bg-white/95 text-slate-900 border border-slate-200 rounded-xl shadow-lg px-4 py-3 min-w-[220px]"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-stretch gap-4">
            <div className="flex flex-col items-center justify-center min-w-[80px]">
              <span className="text-3xl font-extrabold tabular-nums text-brand leading-none">
                {totalDeployments}
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Deployments
              </span>
            </div>
            <div className="w-px bg-slate-200" aria-hidden="true" />
            <div className="flex flex-col items-center justify-center min-w-[80px]">
              <span className="text-3xl font-extrabold tabular-nums text-brand leading-none">
                {countryCount}
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Countries
              </span>
            </div>
          </div>
          {showSuccessStoriesLink &&
            (onSuccessStoriesClick ? (
              <button
                type="button"
                onClick={onSuccessStoriesClick}
                className="mt-3 w-full px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-full hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label="Success Stories"
              >
                Success Stories →
              </button>
            ) : (
              <a
                href="/success-stories/flipbook"
                className="mt-3 block text-center px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-full hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label="Success Stories"
              >
                Success Stories →
              </a>
            ))}
        </div>
      )}

      {/* Legend — intensity scale */}
      {!isLoading && intensity.max > 0 && (
        <div
          className="absolute top-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg shadow px-3 py-2.5"
          role="img"
          aria-label="Deployment intensity legend"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1.5">
            Deployments
          </p>
          <div className="flex items-center gap-1">
            {MAP_CONSTANTS.COLORS.INTENSITY_RAMP.map((c) => (
              <span
                key={c}
                className="block w-5 h-3"
                style={{ backgroundColor: c }}
                aria-hidden="true"
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 tabular-nums">
            <span>{intensity.min}</span>
            <span>{intensity.max}+</span>
          </div>
        </div>
      )}

      {/* Yearly stats — right-side drawer (or bottom sheet on mobile) */}
      {tappedCountry && yearlyStats.length > 0 && (
        <YearlyStatsChart
          countryName={countryLabels[tappedCountry] || tappedCountry}
          yearlyStats={yearlyStats}
          onClose={() => setTappedCountry(null)}
        />
      )}

      {/* Bottom-left country chart — desktop only. On mobile it would
          collide with the filter pills at the bottom; the map + drawer +
          tap interaction covers the same need. */}
      <div className="hidden md:block">
        <CountryChart
          countries={chartCountries}
          countryLabels={countryLabels}
          selectedCountry={tappedCountry}
          onCountryClick={handleCountryClick}
        />
      </div>

      {/* System filter pills — labeled, filled/outline toggle pattern */}
      {systemOptions.length > 0 && (
        <div
          className="
            absolute z-40
            bottom-4 left-1/2 -translate-x-1/2
            md:left-auto md:right-4 md:translate-x-0
            bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg
            px-3 py-2 max-w-[calc(100%-2rem)]
            flex items-center gap-2 overflow-x-auto
          "
          role="group"
          aria-label="Filter by system"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap pl-1">
            Filter
          </span>
          <div className="h-4 w-px bg-slate-200" aria-hidden="true" />

          {systemOptions.map((sys) => {
            const isOn = selectedSystems.includes(sys);
            return (
              <button
                key={sys}
                onClick={() => handleSystemToggle(sys)}
                aria-pressed={isOn}
                aria-label={`${isOn ? 'Hide' : 'Show'} ${sys} deployments`}
                className={`
                  text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${
                    isOn
                      ? 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700'
                      : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                  }
                `}
              >
                {sys}
              </button>
            );
          })}

          <div className="h-4 w-px bg-slate-200 mx-1" aria-hidden="true" />
          {selectedSystems.length === systemOptions.length ? (
            <button
              onClick={handleClearSystems}
              className="text-xs text-slate-500 hover:text-slate-800 whitespace-nowrap pr-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              Clear
            </button>
          ) : (
            <button
              onClick={handleSelectAllSystems}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap pr-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              All
            </button>
          )}
        </div>
      )}

      {/* Floating hover tooltip — desktop pointer affordance. Suppressed
          while a country is tapped so it doesn't overlap the drawer. */}
      {hover && !tappedCountry && (
        <div
          className="fixed z-[60] pointer-events-none px-3 py-1.5 rounded-md bg-slate-900/95 text-white text-xs shadow-lg whitespace-nowrap"
          style={{
            left: hover.x + 14,
            top: hover.y + 14,
          }}
          role="tooltip"
        >
          <div className="font-semibold">{countryLabels[hover.country] || hover.country}</div>
          <div className="text-slate-300">
            {hover.count} deployment{hover.count !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
          <LoadingSpinner size="lg" message="Loading map data..." />
        </div>
      )}

      <MapRenderer
        worldData={worldData}
        countryMap={countryMap}
        selectedCountry={tappedCountry}
        onCountryClick={handleCountryClick}
        onCountryHover={handleCountryHover}
        getColor={intensity.color}
        isLoading={isLoading}
        svgRef={svgRef}
        gRef={gRef}
      />
    </div>
  );
});

export default DrilldownMapCore;
