'use client';

import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { useEffect, useRef, useState, useMemo } from 'react';
import regionMapping from '@/data/region_mapping.json';
import regionCoords from '@/data/region_coords.json';

interface JobRecord {
  Region: string;
  Country: string;
  Successful: number;
  Job_Status: string;
}

interface Props {
  data: JobRecord[];
}

interface RegionCoords {
  [region: string]: { lon: number; lat: number };
}

interface WorldAtlas {
  type: 'Topology';
  objects: {
    countries: {
      type: 'GeometryCollection';
      geometries: any[];
    };
  };
  arcs: any[];
  transform: any;
}

export default function DrilldownMap({ data }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [focusedRegion, setFocusedRegion] = useState<string | null>(null);
  const [worldData, setWorldData] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then((world: unknown) => {
        const topology = world as WorldAtlas;
        const countries = topojson.feature(topology, topology.objects.countries) as GeoJSON.FeatureCollection;

        countries.features = countries.features.filter((d) => {
          const name = d.properties?.name;
          const [lon, lat] = d3.geoCentroid(d);
          return name !== 'Antarctica' && !(lon < -150 && lat > 10);
        });

        setWorldData(countries);
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
      .attr('d', (d) => path(d) || '')
      .attr('fill', '#f3f4f6')
      .attr('stroke', '#ccc');

    if (!focusedRegion) {
      regionStats.forEach(([region, count]) => {
        const coords = (regionCoords as RegionCoords)[region];
        if (!coords || count <= 0) return;
        const [x, y] = projection([coords.lon, coords.lat]);

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
      const coords = (regionCoords as RegionCoords)[focusedRegion];
      const [tx, ty] = projection([coords.lon, coords.lat]);
      const k = 2;

      g.transition()
        .duration(750)
        .attr('transform', `translate(${width / 2 - k * tx}, ${height / 2 - k * ty}) scale(${k})`);

      countryStats.forEach(([country, count]) => {
        const feature = worldData.features.find((f) => f.properties?.name === country);
        if (!feature) {
          console.warn(`No shape found for country: ${country}`);
          return;
        }

        const [x, y] = path.centroid(feature);

        g.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 0)
          .attr('fill', 'rgba(34,197,94,0.7)')
          .attr('stroke', '#000')
          .attr('stroke-width', 1.2)
          .transition()
          .duration(1000)
          .attr('r', Math.sqrt(count) * 2);
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
      {focusedRegion && (
        <button
          className="absolute top-4 left-4 bg-white border border-gray-300 shadow px-3 py-1 rounded z-50 hover:bg-gray-100"
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