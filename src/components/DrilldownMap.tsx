'use client';

import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import rawRegionCoords from '@/data/region_coords.json';
import type { Topology } from 'topojson-specification';
import type { FeatureCollection, Geometry, Feature } from 'geojson';
import { motion } from 'framer-motion';
import type { JobRecord } from '@/types/JobRecord';

interface RegionCoords {
  [region: string]: { lon: number; lat: number };
}

const regionCoords = rawRegionCoords as RegionCoords;

interface Props {
  data: JobRecord[];
}

export default function DrilldownMap({ data }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const [focusedRegion, setFocusedRegion] = useState<string | null>(null);
  const [worldData, setWorldData] = useState<FeatureCollection<Geometry, { name?: string }> | null>(null);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);

  const systemOptions = useMemo(() => {
    const systems = Array.from(new Set(data.map((job) => job.System).filter(Boolean))).sort();
    return systems;
  }, [data]);

  useEffect(() => {
    if (systemOptions.length && selectedSystems.length === 0) {
      setSelectedSystems(systemOptions);
    }
  }, [systemOptions, selectedSystems.length]);

  const filteredData = useMemo(() => {
    return selectedSystems.length > 0
      ? data.filter((job) => selectedSystems.includes(job.System))
      : data;
  }, [data, selectedSystems]);

  const regionStats = useMemo(() => d3.rollups(
    filteredData,
    (entries) => d3.sum(entries, (d) => +d.Successful),
    (d) => d.Region || 'Unknown'
  ), [filteredData]);

  const countryStats = useMemo(() => {
    if (!focusedRegion) return [];
    return d3.rollups(
      filteredData.filter((d) => d.Region === focusedRegion),
      (entries) => d3.sum(entries, (d) => +d.Successful),
      (d) => d.Country
    );
  }, [filteredData, focusedRegion]);

  const totalJobs = useMemo(() => {
    return focusedRegion
      ? filteredData.filter((d) => d.Region === focusedRegion).length
      : filteredData.length;
  }, [filteredData, focusedRegion]);

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

  const drawRegionBubbles = useCallback((gSel: d3.Selection<SVGGElement, unknown, null, undefined>, projection: d3.GeoProjection) => {
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
        .on('click', () => setFocusedRegion(region))
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
  }, [regionStats]);

  const zoomToRegion = useCallback((gSel: d3.Selection<SVGGElement, unknown, null, undefined>, projection: d3.GeoProjection) => {
    const coords = regionCoords[focusedRegion!];
    const projected = projection([coords.lon, coords.lat]);
    if (!projected) return;

    const [tx, ty] = projected;
    const k = 2;

    gSel.transition()
      .duration(750)
      .attr('transform', `translate(${960 / 2 - k * tx}, ${540 / 2 - k * ty}) scale(${k})`);

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
  }, [focusedRegion, countryStats]);

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
      d3.select(svgRef.current as SVGSVGElement).call(zoom);
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
      drawRegionBubbles(gSel, projection);
    } else {
      zoomToRegion(gSel, projection);
    }
  }, [worldData, regionStats, countryStats, focusedRegion, drawRegionBubbles, zoomToRegion]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusedRegion(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="relative w-full max-w-[1440px] aspect-[16/9] mx-auto overflow-hidden rounded-xl shadow-lg bg-gray-100">
      {/* Draggable stats + filters panel */}
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 1200, top: 0, bottom: 900 }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white text-black border border-gray-200 rounded-lg shadow px-4 py-4 w-64"
      >
        <div className="text-sm font-medium">
          {focusedRegion ? `Jobs in ${focusedRegion}` : 'Global Jobs'}
        </div>
        <div className="text-2xl font-bold mb-3">{totalJobs}</div>

        <div className="flex flex-wrap gap-2">
          {systemOptions.map((sys) => (
            <span
              key={sys}
              className={`text-xs px-2 py-1 border rounded-full flex items-center gap-1 cursor-pointer transition ${
                selectedSystems.includes(sys) ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-300 line-through'
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
      </motion.div>

      {focusedRegion && (
        <button
          className="absolute top-4 left-36 text-sm font-semibold z-50 bg-white text-black hover:bg-gray-100 rounded px-4 py-2 border border-gray-300 shadow flex items-center gap-1"
          onClick={() => setFocusedRegion(null)}
        >
          <span className="text-xl">←</span> Back
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
