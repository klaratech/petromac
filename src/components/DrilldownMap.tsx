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

  const systemOptions = useMemo(() => {
    return Array.from(new Set(data.map((job) => job.System).filter(Boolean))).sort();
  }, [data]);

  useEffect(() => {
    if (selectedSystems.length > 0 || systemOptions.length === 0) return;
    if (initialSystem) {
      const matches = systemOptions.filter(s => s.toLowerCase().startsWith(initialSystem.toLowerCase()));
      setSelectedSystems(matches.length > 0 ? matches : systemOptions);
    } else {
      setSelectedSystems(systemOptions);
    }
  }, [initialSystem, systemOptions, selectedSystems.length]);

  const filteredData = useMemo(() => {
    return selectedSystems.length > 0 ? data.filter((job) => selectedSystems.includes(job.System)) : [];
  }, [data, selectedSystems]);

  const countryStats = useMemo(() => {
    return d3.rollups(
      filteredData,
      (entries) => d3.sum(entries, (d) => +d.Successful),
      (d) => d.Country
    );
  }, [filteredData]);

  const countryMap = useMemo(() => new Map(countryStats), [countryStats]);
  const sortedCountries = [...countryStats].sort((a, b) => d3.descending(a[1], b[1]));
  const chartCountries = sortedCountries;

  const totalDeployments = filteredData.length;
  const countryCount = countryStats.filter(([, count]) => count > 0).length;

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
        return countryMap.has(name) ? '#34d399' : '#f3f4f6';
      })
      .attr('stroke', '#ccc')
      .append('title')
      .text((d) => {
        const name = d.properties?.name || 'Unknown';
        const count = countryMap.get(name) || 0;
        return `${name}: ${count} successful job${count !== 1 ? 's' : ''}`;
      });
  }, [worldData, countryMap]);

  return (
    <div className="relative w-full h-[100vh] max-h-[100vh] overflow-hidden bg-white">
      <button
        onClick={onClose}
        className="absolute top-3 right-4 text-xl font-semibold z-50 bg-white text-black hover:bg-gray-100 rounded-full px-2 py-1 shadow"
      >
        ✕
      </button>

      <div className="absolute bottom-6 left-4 z-50 bg-white text-black border border-gray-200 rounded-lg shadow px-4 py-4 max-w-[25vw] h-[45vh]">
        <div className="text-sm font-medium mb-3">
          <span className="text-green-600 font-bold">{totalDeployments}</span> Total Deployments in <span className="text-blue-600 font-bold">{countryCount}</span> Countries
        </div>
        <div className="overflow-x-auto overflow-y-hidden w-full h-[85%]">
          <svg
            width={chartCountries.length * 80}
            height={120}
            viewBox={`0 0 ${chartCountries.length * 80} 120`}
          >
            {chartCountries.map(([country, count], i) => (
              <g key={country} transform={`translate(${i * 80},0)`} onClick={() => setTappedCountry(country)}>
                <rect
                  y={100 - (count / chartCountries[0][1]) * 80}
                  width={30}
                  height={(count / chartCountries[0][1]) * 80}
                  fill="#34d399"
                />
                {tappedCountry === country && (
                  <text
                    x={15}
                    y={80 - (count / chartCountries[0][1]) * 80 - 5}
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {count}
                  </text>
                )}
                <text x={15} y={110} fontSize="10" textAnchor="middle">
                  {country}
                </text>
              </g>
            ))}
          </svg>
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
