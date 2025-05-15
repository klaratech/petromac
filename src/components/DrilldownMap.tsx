'use client';

import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { useEffect, useRef, useState, useMemo } from 'react';
import regionDataJson from '@/data/region_data.json';
import { successStories, type SuccessStory } from '@/data/successStories';
import type { Topology } from 'topojson-specification';
import type { FeatureCollection, Geometry, Feature } from 'geojson';
import { motion, AnimatePresence } from 'framer-motion';
import type { JobRecord } from '@/types/JobRecord';

interface RegionData {
  [region: string]: {
    lat: number;
    lon: number;
  };
}

const regionData = regionDataJson as unknown as RegionData;

interface Props {
  data: JobRecord[];
  initialSystem?: string;
}

export default function DrilldownMap({ data, initialSystem }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const [focusedRegion, setFocusedRegion] = useState<string | null>(null);
  const [worldData, setWorldData] = useState<FeatureCollection<Geometry, { name?: string }> | null>(null);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [storyModal, setStoryModal] = useState<SuccessStory | null>(null);

  const systemOptions = useMemo(() => {
    return Array.from(new Set(data.map((job) => job.System).filter(Boolean))).sort();
  }, [data]);

  useEffect(() => {
    if (selectedSystems.length > 0 || systemOptions.length === 0) return;
    if (initialSystem && systemOptions.includes(initialSystem)) {
      setSelectedSystems([initialSystem]);
    } else {
      setSelectedSystems(systemOptions);
    }
  }, [initialSystem, systemOptions, selectedSystems.length]);

  const filteredData = useMemo(() => {
    return selectedSystems.length > 0 ? data.filter((job) => selectedSystems.includes(job.System)) : [];
  }, [data, selectedSystems]);

  const filteredStories: SuccessStory[] = useMemo(() => {
    return successStories.filter((s) => selectedSystems.includes(s.system));
  }, [selectedSystems]);

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

  const countryMap = useMemo(() => new Map(countryStats), [countryStats]);

  const totalJobs = useMemo(() => focusedRegion
    ? filteredData.filter((d) => d.Region === focusedRegion).length
    : filteredData.length
  , [filteredData, focusedRegion]);

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
      .attr('fill', '#f3f4f6')
      .attr('stroke', '#ccc');

    if (!focusedRegion) {
      regionStats.forEach(([region, count]) => {
        const coords = regionData[region];
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
          .on('click', () => setFocusedRegion(region));

        circle.append('title').text(`${region}: ${count} successful jobs`);
      });

      // Region-level stars
      filteredStories.forEach((story) => {
        const regionCoords = regionData[story.region];
        if (!regionCoords) return;

        const projected = projection([regionCoords.lon, regionCoords.lat]);
        if (!projected) return;
        const [x, y] = projected;

        gSel.append('text')
          .attr('x', x)
          .attr('y', y)
          .text('★')
          .attr('font-size', 18)
          .attr('fill', '#facc15')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .style('cursor', 'pointer')
          .on('click', () => setStoryModal(story));
      });
    }
  }, [worldData, regionStats, focusedRegion, filteredStories]);

  useEffect(() => {
    if (!worldData || !focusedRegion || !gRef.current) return;
    const projection = d3.geoNaturalEarth1().fitSize([960, 540], worldData);
    const gSel = d3.select(gRef.current);
    const coords = regionData[focusedRegion];
    if (!coords) return;

    const projected = projection([coords.lon, coords.lat]);
    if (!projected) return;
    const [tx, ty] = projected;
    const k = 2;

    gSel.transition()
      .duration(750)
      .attr('transform', `translate(${960 / 2 - k * tx}, ${540 / 2 - k * ty}) scale(${k})`);

    gSel.selectAll('path')
      .transition()
      .duration(800)
      .attr('fill', (d) => {
        const name = (d as Feature<Geometry, { name?: string }>).properties?.name || '';
        const exists = countryMap.has(name);
        return exists ? '#34d399' : '#f3f4f6';
      });

    gSel.selectAll('path')
      .select('title')
      .remove();

    gSel.selectAll('path')
      .append('title')
      .text((d) => {
        const name = (d as Feature<Geometry, { name?: string }>).properties?.name || 'Unknown';
        const count = countryMap.get(name) || 0;
        return `${name}: ${count} successful job${count !== 1 ? 's' : ''}`;
      });

    // Country-level stars
    filteredStories.forEach((story) => {
      const [lon, lat] = [story.countryLon, story.countryLat];
      const projected = projection([lon, lat]);
      if (!projected) return;
      const [x, y] = projected;

      gSel.append('text')
        .attr('x', x)
        .attr('y', y)
        .text('★')
        .attr('font-size', 18)
        .attr('fill', '#facc15')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .style('cursor', 'pointer')
        .on('click', () => setStoryModal(story));
    });
  }, [focusedRegion, worldData, countryMap, filteredStories]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusedRegion(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="relative w-full h-[100vh] max-h-[100vh] overflow-hidden bg-white">
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 1200, top: 0, bottom: 900 }}
        className="absolute top-1/2 left-4 -translate-y-1/2 z-50 bg-white text-black border border-gray-200 rounded-lg shadow px-4 py-4 w-64"
      >
        <div className="text-sm font-medium">
          {focusedRegion ? `Jobs in ${focusedRegion}` : 'Global Jobs'}
        </div>
        <div className="text-2xl font-bold mb-3">{totalJobs}</div>
      </motion.div>

      {focusedRegion && (
        <button
          className="absolute top-4 left-4 text-sm font-semibold z-50 bg-white text-black hover:bg-gray-100 rounded px-4 py-2 border border-gray-300 shadow flex items-center gap-1"
          onClick={() => setFocusedRegion(null)}
        >
          <span className="text-xl">←</span> Back
        </button>
      )}

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

      <AnimatePresence>
        {storyModal && (
          <motion.div
            key="story-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center"
            onClick={() => setStoryModal(null)}
          >
            <div className="bg-white rounded-lg p-4 w-[80vw] h-[80vh] shadow-xl overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
              <iframe src={storyModal.link} className="w-full h-full" />
              <button
                className="absolute top-2 right-2 px-3 py-1 bg-black text-white rounded"
                onClick={() => setStoryModal(null)}
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
