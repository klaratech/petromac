'use client';

import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import type { JobRecord } from '@/types/JobRecord';
import LoadingSpinner from './LoadingSpinner';
import { useMapData } from '@/hooks/useMapData';
import { useCountryLabels } from '@/hooks/useCountryLabels';
import { useDebounce } from '@/hooks/useDebounce';
import YearlyStatsChart from './YearlyStatsChart';
import CountryChart from './CountryChart';
import MapRenderer from './MapRenderer';
import { processMapData, calculateCountryStats } from '@/lib/maps';
import type { CountryStats, ProcessedMapData } from '@/types/MapTypes';
import { MAP_CONSTANTS } from '@/constants/mapConstants';
import Link from 'next/link';

interface Props {
  data: JobRecord[];
  initialSystem?: string;
  onClose?: () => void;
}

const DrilldownMap = memo(function DrilldownMap({ data, initialSystem, onClose }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [tappedCountry, setTappedCountry] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Custom hooks for data loading
  const { worldData, isLoading: isLoadingMap, error: mapError, retry: retryMap } = useMapData();
  const { countryLabels, isLoading: isLoadingLabels, error: labelsError } = useCountryLabels();

  // Debounce system selection changes to prevent rapid re-renders
  const debouncedSelectedSystems = useDebounce(selectedSystems, 300);

  const systemOptions = useMemo(() => {
    return Array.from(new Set(data.map((job) => job.System).filter(Boolean))).sort();
  }, [data]);

  // Initialize selected systems
  useEffect(() => {
    if (selectedSystems.length > 0 || systemOptions.length === 0) return;
    if (initialSystem) {
      const matches = systemOptions.filter(s => s.toLowerCase().startsWith(initialSystem.toLowerCase()));
      setSelectedSystems(matches.length > 0 ? matches : systemOptions);
    } else {
      setSelectedSystems(systemOptions);
    }
  }, [initialSystem, systemOptions, selectedSystems.length]);

  // Process data once instead of filtering on every render
  const processedData: ProcessedMapData = useMemo(() => {
    return processMapData(data, debouncedSelectedSystems);
  }, [data, debouncedSelectedSystems]);

  const { filteredData, isPathfinderOnly } = processedData;

  // Calculate country statistics
  const countryStats: CountryStats[] = useMemo(() => {
    return calculateCountryStats(data, filteredData, isPathfinderOnly);
  }, [data, filteredData, isPathfinderOnly]);

  const countryMap = useMemo(() => new Map(countryStats.map(([country, count]) => [country, count])), [countryStats]);

  const sortedCountries = useMemo(() => 
    [...countryStats].sort((a, b) => b[1] - a[1]), 
    [countryStats]
  );

  const chartCountries = useMemo(() => 
    sortedCountries.filter(([, count]) => count > 0), 
    [sortedCountries]
  );

  const totalDeployments = useMemo(() => {
    return countryStats.reduce((sum, [, count]) => sum + count, 0);
  }, [countryStats]);

  const countryCount = useMemo(() => {
    return countryStats.filter(([, count]) => count > 0).length;
  }, [countryStats]);

  const yearlyStats = useMemo(() => {
    if (!tappedCountry) return [];

    const source = isPathfinderOnly ? data : filteredData;
    const countryData = source.filter((d: JobRecord) => d.Country === tappedCountry);
    
    const yearGroups = countryData.reduce((acc: Record<string, number>, d: JobRecord) => {
      const year = d.Year;
      if (!acc[year]) acc[year] = 0;
      
      if (isPathfinderOnly) {
        acc[year] += (d['PathFinder Run (Y/N)'] || '').trim().toUpperCase() === 'YES' ? 1 : 0;
      } else {
        acc[year] += +d.Successful || 0;
      }
      
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(yearGroups)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => +a.year - +b.year);
  }, [data, filteredData, tappedCountry, isPathfinderOnly]);

  // Handle system selection with proper state management
  const handleSystemToggle = useCallback((system: string) => {
    setSelectedSystems((prev) =>
      prev.includes(system) ? prev.filter((s) => s !== system) : [...prev, system]
    );
  }, []);

  const handleSelectAllSystems = useCallback(() => {
    setSelectedSystems(systemOptions);
  }, [systemOptions]);

  // Handle country selection
  const handleCountryClick = useCallback((countryName: string | null) => {
    setTappedCountry(current => current === countryName ? null : countryName);
  }, []);

  // Handle retry with exponential backoff
  const handleRetry = useCallback(async () => {
    if (retryCount < MAP_CONSTANTS.MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        retryMap();
      }, 1000 * (retryCount + 1));
    }
  }, [retryCount, retryMap]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setTappedCountry(null);
    }
  }, []);

  const isLoading = isLoadingMap || isLoadingLabels;
  const error = mapError || labelsError;

  if (error && retryCount >= MAP_CONSTANTS.MAX_RETRIES) {
    return (
      <div className="relative w-full h-[100vh] max-h-[100vh] overflow-hidden bg-white">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-xl font-semibold z-50 bg-white text-black hover:bg-gray-100 rounded-full px-2 py-1 shadow"
          aria-label="Close map"
        >
          ✕
        </button>
        
        <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
          <div className="text-center p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Map</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                disabled={retryCount >= MAP_CONSTANTS.MAX_RETRIES}
              >
                Retry ({MAP_CONSTANTS.MAX_RETRIES - retryCount} attempts left)
              </button>
              <div className="text-sm text-gray-500">
                Showing simplified view as fallback
              </div>
              {/* Fallback: Simple list view */}
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
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-[100vh] max-h-[100vh] overflow-hidden bg-white"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Interactive deployment map"
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-4 text-xl font-semibold z-50 bg-white text-black hover:bg-gray-100 rounded-full px-2 py-1 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Close map"
      >
        ✕
      </button>

      {/* Stats Summary */}
      <div className="absolute top-6 left-4 z-50 bg-white/90 backdrop-blur-md text-black border border-gray-200 rounded-lg shadow px-4 py-3">
        <div className="text-sm font-medium" role="status" aria-live="polite">
          <span className="text-green-600 font-bold">{totalDeployments}</span> Total Deployments in{' '}
          <span className="text-blue-600 font-bold">{countryCount}</span> Countries
        </div>
        <Link
          href="/success-stories/flipbook"
          className="mt-2 inline-block px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Success Stories"
        >
          Success Stories
        </Link>
      </div>

      {/* Yearly Stats Chart */}
      {tappedCountry && yearlyStats.length > 0 && (
        <YearlyStatsChart
          countryName={countryLabels[tappedCountry] || tappedCountry}
          yearlyStats={yearlyStats}
          onClose={() => setTappedCountry(null)}
        />
      )}

      {/* Country Chart */}
      <CountryChart
        countries={chartCountries}
        countryLabels={countryLabels}
        selectedCountry={tappedCountry}
        onCountryClick={handleCountryClick}
      />

      {/* System Selection */}
      {systemOptions.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg shadow flex gap-2 overflow-x-auto">
          {selectedSystems.length < systemOptions.length && (
            <button
              onClick={handleSelectAllSystems}
              className="text-xs px-2 py-1 border border-blue-300 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Select all systems"
            >
              Select All
            </button>
          )}

          {selectedSystems.length === 0 && (
            <span className="text-xs text-gray-500 italic" role="status">
              No systems selected
            </span>
          )}

          {systemOptions.map((sys) => (
            <button
              key={sys}
              className={`text-xs px-2 py-1 border rounded-full flex items-center gap-1 transition whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                selectedSystems.includes(sys)
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-gray-100 text-gray-500 border-gray-300 line-through'
              }`}
              onClick={() => handleSystemToggle(sys)}
              aria-pressed={selectedSystems.includes(sys)}
              aria-label={`${selectedSystems.includes(sys) ? 'Deselect' : 'Select'} ${sys} system`}
            >
              {sys} <span className="text-xs">✕</span>
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
          <LoadingSpinner size="lg" message="Loading map data..." />
        </div>
      )}

      {/* Map Renderer */}
      <MapRenderer
        worldData={worldData}
        countryMap={countryMap}
        selectedCountry={tappedCountry}
        onCountryClick={handleCountryClick}
        isLoading={isLoading}
        svgRef={svgRef}
        gRef={gRef}
      />

    </div>
  );
});

export default DrilldownMap;
