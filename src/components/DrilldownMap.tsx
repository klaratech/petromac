'use client';

import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { useEffect, useRef, useState, useMemo } from 'react';
import rawRegionCoords from '@/data/region_coords.json';
import type { Topology } from 'topojson-specification';
import type { FeatureCollection, Geometry, Feature } from 'geojson';
import { motion } from 'framer-motion';

interface RegionCoords {
  [region: string]: { lon: number; lat: number };
}

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
  const gRef = useRef<SVGGElement | null>(null);
  const [focusedRegion, setFocusedRegion] = useState<string | null>(null);
  const [worldData, setWorldData] = useState<FeatureCollection<Geometry, { name?: string }> | null>(null);

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

  const regionStats = useMemo(() => {
    return d3.rollups(
      data,
      (entries) => d3.sum(entries, (d) => +d.Successful),
      (d) => d.Region || 'Unknown'
    );
  }, [data]);

  const countryStats = useMemo(() => {
    if (!focusedRegion) return [];
    const filtered = data.filter((d) => d.Region === focusedRegion);
    return d3.rollups(
      filtered,
      (entries) => d3.sum(entries, (d) => +d.Successful),
      (d) => d.Country
    );
  }, [data, focusedRegion]);

  const totalJobs = useMemo(() => {
    return focusedRegion
      ? data.filter((d) => d.Region === focusedRegion).length
      : data.length;
  }, [data, focusedRegion]);

  useEffect(() => {
    if (!worldData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 960;
    const height = 540;

    const projection = d3.geoNaturalEarth1().fitSize([width, height], worldData);
    const path = d3.geoPath(projection);

    const zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
      if (gRef.current) {
        d3.select(gRef.current).attr('transform', event.transform.toString());
      }
    });

    if (svgRef.current) {
      const svgEl = svgRef.current;
      d3.select<SVGSVGElement, unknown>(svgEl).call(zoom);
    }

    const g = svg.append('g').node();
    if (!g) return;
    gRef.current = g as SVGGElement;
    const gSel = d3.select(g);

    gSel.selectAll('path')
      .data(worldData.features)
      .enter()
      .append('path')
      .attr('d', (d) => path(d as Feature<Geometry>) || '')
      .attr('fill', '#f3f4f6')
      .attr('stroke', '#ccc');

    if (!focusedRegion) {
      regionStats.forEach(([region, count]) => {
        const coords = regionCoords[region];
        if (!coords || count <= 0) return;

        const projected = projection([coords.lon, coords.lat]);
        if (!projected) return;

        const [x, y] = projected;

        const circle = gSel.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', Math.sqrt(count) * 2)
          .attr('fill', 'rgba(34,197,94,0.6)')
          .attr('stroke', '#fff')
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))')
          .on('click', () => {
            console.log('Region clicked:', region);
            setFocusedRegion(region);
          })
          .on('mouseover', function () {
            d3.select(this)
              .transition().duration(150)
              .attr('r', parseFloat(d3.select(this).attr('r')) * 1.2)
              .style('filter', 'drop-shadow(0 0 6px rgba(34,197,94,0.8))');
          })
          .on('mouseout', function () {
            d3.select(this)
              .transition().duration(150)
              .attr('r', parseFloat(d3.select(this).attr('r')) / 1.2)
              .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))');
          });

        circle.append('title').text(`${region}: ${count} successful jobs`);
      });
    } else {
      const coords = regionCoords[focusedRegion];
      const projected = projection([coords.lon, coords.lat]);
      if (!projected) return;

      const [tx, ty] = projected;
      const k = 2;

      gSel.transition()
        .duration(750)
        .attr('transform', `translate(${width / 2 - k * tx}, ${height / 2 - k * ty}) scale(${k})`);

      const countryMap = new Map(countryStats);
      const max = d3.max(countryStats, ([, val]) => val) || 1;
      const color = d3.scaleLinear<string>().domain([0, max]).range(['#d1fae5', '#065f46']);

      gSel.selectAll('path')
        .transition()
        .duration(800)
        .attr('fill', (d) => {
          const name = (d as Feature<Geometry, { name?: string }>).properties?.name || '';
          const count = countryMap.get(name) || 0;
          return count > 0 ? color(count) : '#f3f4f6';
        })
        .selectAll('title')
        .remove();

      gSel.selectAll('path')
        .append('title')
        .text((d) => {
          const name = (d as Feature<Geometry, { name?: string }>).properties?.name || 'Unknown';
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

  if (!data?.length) {
    return <div className="p-8 text-gray-600 text-lg">⚠️ No data to display.</div>;
  }

  if (!worldData) {
    return <div className="p-8 text-gray-600 text-lg">🌍 Waiting for world map...</div>;
  }

  return (
    <div className="relative w-full max-w-[1440px] aspect-[16/9] mx-auto overflow-hidden rounded-xl shadow-lg">
      <motion.div
        drag
        dragConstraints={{ left: 0, top: 0, right: 1200, bottom: 900 }}
        className="absolute top-4 left-4 z-50 pointer-events-none"
      >
        <div className="pointer-events-auto bg-white border border-gray-200 rounded-lg shadow px-4 py-2 text-gray-800 cursor-grab">
          <div className="text-sm font-medium">
            {focusedRegion ? `Jobs in ${focusedRegion}` : 'Global Jobs'}
          </div>
          <div className="text-2xl font-bold">{totalJobs}</div>
        </div>
      </motion.div>

      {focusedRegion && (
        <button
          className="absolute top-4 left-36 text-2xl z-50 bg-white/80 hover:bg-white rounded-full p-1 border border-gray-300 shadow"
          onClick={() => setFocusedRegion(null)}
        >
          ←
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