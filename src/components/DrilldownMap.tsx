'use client';

import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { useEffect, useRef, useState, useMemo } from 'react';
import rawRegionMapping from '@/data/region_mapping.json';
import rawRegionCoords from '@/data/region_coords.json';
import type { Topology } from 'topojson-specification';
import type { FeatureCollection, Geometry, Feature } from 'geojson';

type RegionMapping = {
  [country: string]: string;
};

type RegionCoords = {
  [region: string]: { lon: number; lat: number };
};

const regionMapping = rawRegionMapping as RegionMapping;
const regionCoords = rawRegionCoords as RegionCoords;

interface JobRecord {
  Region: string;
  Country: string;
  Successful: number;
  Job_Status: string;
}

interface Props {
  data: JobRecord[];
}

export default function DrilldownMap({ data }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [focusedRegion, setFocusedRegion] = useState<string | null>(null);
  const [worldData, setWorldData] = useState<FeatureCollection<Geometry, { name?: string }> | null>(null);

  useEffect(() => {
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then((topologyData) => {
        const topology = topologyData as Topology;
        const countryObjects = topology.objects?.countries;
        if (!countryObjects) {
          throw new Error('No "countries" object found in topology.');
        }

        const geo = topojson.feature(topology, countryObjects);
        if (!('features' in geo)) {
          throw new Error('Invalid GeoJSON FeatureCollection');
        }

        const countries = geo as FeatureCollection<Geometry, { name?: string }>;

        const filteredFeatures = countries.features.filter(
          (feature: Feature<Geometry, { name?: string }>) => {
            const name = feature.properties?.name;
            const [lon, lat] = d3.geoCentroid(feature);
            return name !== 'Antarctica' && !(lon < -150 && lat > 10);
          }
        );

        setWorldData({ ...countries, features: filteredFeatures });
      })
      .catch((err) => console.error('Failed to load world map:', err));
  }, []);

  const regionStats = useMemo(() => {
    return d3.rollups(
      data,
      (entries) => entries.filter((d) => d.Job_Status === 'Successful').length,
      (d) => regionMapping[d.Country] || 'Other'
    );
  }, [data]);

  const countryStats = useMemo(() => {
    if (!focusedRegion) return [];
    const filtered = data.filter((d) => regionMapping[d.Country] === focusedRegion);
    return d3.rollups(
      filtered,
      (entries) => entries.filter((d) => d.Job_Status === 'Successful').length,
      (d) => d.Country
    );
  }, [data, focusedRegion]);

  const totalJobs = useMemo(() => {
    if (!focusedRegion) return data.length;
    return data.filter((d) => regionMapping[d.Country] === focusedRegion).length;
  }, [data, focusedRegion]);

  useEffect(() => {
    if (!worldData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 960;
    const height = 540;

    const projection = d3.geoNaturalEarth1().fitSize([width, height], worldData);
    const path = d3.geoPath(projection);
    const g = svg.append('g');

    g.selectAll('path')
      .data(worldData.features)
      .enter()
      .append('path')
      .attr('d', (feature) => path(feature as Feature<Geometry, { name?: string }>) || '')
      .attr('fill', '#f3f4f6')
      .attr('stroke', '#ccc');

    if (!focusedRegion) {
      // Region-level bubbles
      regionStats.forEach(([region, count]) => {
        const coords = regionCoords[region];
        if (!coords || count <= 0) return;

        const projected = projection([coords.lon, coords.lat]);
        if (!projected) return;

        const [x, y] = projected;

        g.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 0)
          .attr('fill', 'rgba(34,197,94,0.6)')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5)
          .on('click', () => setFocusedRegion(region))
          .transition()
          .duration(1000)
          .attr('r', Math.sqrt(count) * 2);
      });
    } else {
      // Country-level choropleth
      const coords = regionCoords[focusedRegion];
      const projected = projection([coords.lon, coords.lat]);
      if (!projected) return;

      const [tx, ty] = projected;
      const k = 2;

      g.transition()
        .duration(750)
        .attr(
          'transform',
          `translate(${width / 2 - k * tx}, ${height / 2 - k * ty}) scale(${k})`
        );

      const countryMap = new Map(countryStats);
      const max = d3.max(countryStats, ([, val]) => val) || 1;

      const color = d3
        .scaleLinear<string>()
        .domain([0, max])
        .range(['#d1fae5', '#065f46']);

      g.selectAll('path')
        .attr('fill', (feature) => {
          const typed = feature as Feature<Geometry, { name?: string }>;
          const name = typed.properties?.name;
          const count = countryMap.get(name || '') || 0;
          return count > 0 ? color(count) : '#f3f4f6';
        })
        .on('click', null)
        .append('title')
        .text((feature) => {
          const typed = feature as Feature<Geometry, { name?: string }>;
          const name = typed.properties?.name || 'Unknown';
          const count = countryMap.get(name) || 0;
          return `${name}: ${count} successful job${count !== 1 ? 's' : ''}`;
        });
    }
  }, [worldData, regionStats, countryStats, focusedRegion]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusedRegion(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="relative w-full max-w-[1440px] aspect-[16/9] mx-auto overflow-hidden rounded-xl shadow-lg">
      {/* Data Card */}
      <div className="absolute top-4 left-4 z-50 bg-white border border-gray-200 rounded-lg shadow px-4 py-2 text-gray-800">
        <div className="text-sm font-medium">
          {focusedRegion ? `Jobs in ${focusedRegion}` : 'Global Jobs'}
        </div>
        <div className="text-2xl font-bold">{totalJobs}</div>
      </div>

      {/* Back Button */}
      {focusedRegion && (
        <button
          className="absolute top-4 left-36 bg-white border border-gray-300 shadow px-3 py-1 rounded z-50 hover:bg-gray-100"
          onClick={() => setFocusedRegion(null)}
        >
          ⬅ Back
        </button>
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