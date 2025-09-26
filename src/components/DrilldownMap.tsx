'use client';

import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { useEffect, useRef, useState, useMemo } from 'react';
import type { Topology } from 'topojson-specification';
import type { FeatureCollection, Geometry, Feature } from 'geojson';
import type { JobRecord } from '@/types/JobRecord';

interface Props {
  data: JobRecord[];
  initialSystem?: string;
  onClose?: () => void;
}

export default function DrilldownMap({ data, initialSystem, onClose }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const [worldData, setWorldData] = useState<FeatureCollection<Geometry, { name?: string }> | null>(null);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [tappedCountry, setTappedCountry] = useState<string | null>(null);
  const [countryLabels, setCountryLabels] = useState<Record<string, string>>({});

  const systemOptions = useMemo(() => {
    return Array.from(new Set(data.map((job) => job.System).filter(Boolean))).sort();
  }, [data]);

  useEffect(() => {
    fetch('/data/country_labels.json')
      .then(res => res.json())
      .then(setCountryLabels);
  }, []);

  useEffect(() => {
    if (selectedSystems.length > 0 || systemOptions.length === 0) return;
    if (initialSystem) {
      const matches = systemOptions.filter(s => s.toLowerCase().startsWith(initialSystem.toLowerCase()));
      setSelectedSystems(matches.length > 0 ? matches : systemOptions);
    } else {
      setSelectedSystems(systemOptions);
    }
  }, [initialSystem, systemOptions, selectedSystems.length]);

  const isPathfinderOnly = selectedSystems.length === 1 && selectedSystems[0].toLowerCase() === 'pathfinder';

  const filteredData = useMemo(() => {
    return selectedSystems.length > 0
      ? data.filter((job) => selectedSystems.includes(job.System))
      : [];
  }, [data, selectedSystems]);

  const countryStats = useMemo(() => {
    const source = isPathfinderOnly ? data : filteredData;

    return d3.rollups(
      source,
      (entries) =>
        d3.sum(entries, (d) => {
          if (isPathfinderOnly) {
            return (d['PathFinder Run (Y/N)'] || '').trim().toUpperCase() === 'YES' ? 1 : 0;
          }
          return +d.Successful || 0;
        }),
      (d) => d.Country
    );
  }, [data, filteredData, isPathfinderOnly]);

  const countryMap = useMemo(() => new Map(countryStats), [countryStats]);


  const sortedCountries = [...countryStats].sort((a, b) => d3.descending(a[1], b[1]));
  const chartCountries = sortedCountries.filter(([, count]) => count > 0); // ✅ Hides zero values


  const totalDeployments = d3.sum(
    isPathfinderOnly ? data : filteredData,
    (d) =>
      isPathfinderOnly
        ? (d['PathFinder Run (Y/N)'] || '').trim().toUpperCase() === 'YES' ? 1 : 0
        : +d.Successful || 0
  );

  const countryCount = countryStats.filter(([, count]) => count > 0).length;

  const yearlyStats = useMemo(() => {
    if (!tappedCountry) return [];

    const source = isPathfinderOnly ? data : filteredData;

    return d3.rollups(
      source.filter((d) => d.Country === tappedCountry),
      (entries) =>
        d3.sum(entries, (d) => {
          if (isPathfinderOnly) {
            return (d['PathFinder Run (Y/N)'] || '').trim().toUpperCase() === 'YES' ? 1 : 0;
          }
          return +d.Successful || 0;
        }),
      (d) => d.Year
    ).sort((a, b) => d3.ascending(+a[0], +b[0]));
  }, [data, filteredData, tappedCountry, isPathfinderOnly]);

  useEffect(() => {
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then((topologyData) => {
        const topology = topologyData as Topology;
        const geo = topojson.feature(topology, topology.objects.countries);
        if (!('features' in geo)) throw new Error('Invalid GeoJSON FeatureCollection');

        const countries = geo as FeatureCollection<Geometry, { name?: string }>;
        const filtered = countries.features.filter((f) => {
          const [lon, lat] = d3.geoCentroid(f);
          return f.properties?.name !== 'Antarctica' && !(lon < -150 && lat > 10);
        });

        setWorldData({ ...countries, features: filtered });
      })
      .catch((err) => console.error('❌ Failed to load world map:', err));
  }, []);

  useEffect(() => {
    if (!worldData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 960;
    const height = 540;
    const projection = d3.geoNaturalEarth1().fitSize([width, height], worldData);
    const path = d3.geoPath(projection);

    const g = svg.append('g').node();
    if (!g) return;
    gRef.current = g as SVGGElement;
    const gSel = d3.select(g);

    gSel.selectAll('path')
      .data(worldData.features)
      .enter()
      .append('path')
      .attr('d', (d) => path(d as Feature<Geometry>) || '')
      .attr('fill', (d) => {
        const name = d.properties?.name || '';
        return name === tappedCountry ? '#4ade80' : (countryMap.has(name) ? '#34d399' : '#f3f4f6');
      })
      .attr('stroke', '#ccc')
      .style('stroke-width', (d) => d.properties?.name === tappedCountry ? 2 : 1)
      .style('filter', (d) => d.properties?.name === tappedCountry ? 'drop-shadow(0 0 4px #22c55e)' : 'none')
      .on('click', (event, d) => {
        const name = d.properties?.name || null;
        setTappedCountry(name === tappedCountry ? null : name);
      })
      .append('title')
      .text((d) => {
        const name = d.properties?.name || 'Unknown';
        const count = countryMap.get(name) || 0;
        return `${name}: ${count} deployment${count !== 1 ? 's' : ''}`;
      });
  }, [worldData, countryMap, tappedCountry]);

  return (
    <div className="relative w-full h-[100vh] max-h-[100vh] overflow-hidden bg-white">
      <button
        onClick={onClose}
        className="absolute top-3 right-4 text-xl font-semibold z-50 bg-white text-black hover:bg-gray-100 rounded-full px-2 py-1 shadow"
      >
        ✕
      </button>

      <div className="absolute top-6 left-4 z-50 bg-white/90 backdrop-blur-md text-black border border-gray-200 rounded-lg shadow px-4 py-3">
        <div className="text-sm font-medium">
          <span className="text-green-600 font-bold">{totalDeployments}</span> Total Deployments in <span className="text-blue-600 font-bold">{countryCount}</span> Countries
        </div>
      </div>

      {tappedCountry && yearlyStats.length > 0 && (
        <div className="absolute top-6 right-4 z-50 bg-white text-black border border-gray-300 rounded-lg shadow px-4 py-4 w-[320px] h-[45vh]">
          <div className="text-md font-semibold mb-3">
            Deployments in {countryLabels[tappedCountry] || tappedCountry} by Year
          </div>
          <svg viewBox={`0 0 320 ${yearlyStats.length * 24}`} width="100%" height="100%">
            {yearlyStats.map(([year, value], i) => (
              <g key={year} transform={`translate(0,${i * 24})`}>
                <text x={0} y={12} fontSize="10" fill="#333">{year}</text>
                <rect x={50} y={4} height={12} width={value} fill="#60a5fa" />
                <text x={50 + value + 5} y={14} fontSize="10" fill="#111">{value}</text>
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* Country Chart - Bottom Panel */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md text-black border border-gray-200 rounded-lg shadow px-6 py-4 max-w-[90vw] w-fit">
        <div className="text-sm font-medium mb-4 text-center">
          Deployments by Country
        </div>
        <div className="overflow-x-auto">
          <div className="flex items-end gap-3 min-w-fit px-2">
            {chartCountries.slice(0, 15).map(([country, count]) => {
              const maxCount = chartCountries[0][1];
              const barHeight = Math.max((count / maxCount) * 80, 8); // Min height of 8px
              const isSelected = tappedCountry === country;
              
              return (
                <div 
                  key={country} 
                  className="flex flex-col items-center cursor-pointer group transition-all duration-200 hover:scale-105"
                  onClick={() => setTappedCountry(tappedCountry === country ? null : country)}
                >
                  <div className="relative">
                    {isSelected && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {count} deployment{count !== 1 ? 's' : ''}
                      </div>
                    )}
                    <div
                      className={`w-8 rounded-t transition-all duration-200 ${
                        isSelected 
                          ? 'bg-green-500 shadow-lg' 
                          : 'bg-green-400 group-hover:bg-green-500'
                      }`}
                      style={{ height: `${barHeight}px` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-center max-w-[60px] leading-tight">
                    <div className="font-medium">{countryLabels[country] || country}</div>
                    <div className="text-gray-600">{count}</div>
                  </div>
                </div>
              );
            })}
            {chartCountries.length > 15 && (
              <div className="flex flex-col items-center justify-end text-gray-500">
                <div className="w-8 h-4 bg-gray-200 rounded-t" />
                <div className="mt-2 text-xs text-center">
                  +{chartCountries.length - 15} more
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {systemOptions.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg shadow flex gap-2 overflow-x-auto">
          {selectedSystems.length < systemOptions.length && (
            <button
              onClick={() => setSelectedSystems(systemOptions)}
              className="text-xs px-2 py-1 border border-blue-300 rounded-full bg-blue-50 text-blue-700"
            >
              Select All
            </button>
          )}

          {selectedSystems.length === 0 && (
            <span className="text-xs text-gray-500 italic">No systems selected</span>
          )}

          {systemOptions.map((sys) => (
            <span
              key={sys}
              className={`text-xs px-2 py-1 border rounded-full flex items-center gap-1 cursor-pointer transition whitespace-nowrap ${
                selectedSystems.includes(sys)
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-gray-100 text-gray-500 border-gray-300 line-through'
              }`}
              onClick={() => {
                setSelectedSystems((prev) =>
                  prev.includes(sys) ? prev.filter((s) => s !== sys) : [...prev, sys]
                );
              }}
            >
              {sys} <span className="text-xs">✕</span>
            </span>
          ))}
        </div>
      )}

      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox="0 0 960 540"
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
}
