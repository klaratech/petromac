import { useEffect, useMemo, memo } from 'react';
import { select } from 'd3-selection';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import 'd3-transition';
import type { Feature, Geometry } from 'geojson';
import type { MapRendererProps } from '@/types/MapTypes';
import { APP_CONSTANTS } from '@/constants/app';
import { MAP_CONSTANTS } from '@/constants/mapConstants';
import { formatDeploymentCount } from '@/lib/map/process';

/** Whole features never drawn — no wells, and Antarctica dominates the fit. */
const HIDDEN_COUNTRIES = new Set(['Antarctica']);

/** Hawaii's bbox, used to drop it from the USA's MultiPolygon. */
const HAWAII_BOX = { minLon: -161, maxLon: -154, minLat: 18, maxLat: 23.5 };

function ringInsideHawaii(ring: number[][]): boolean {
  return ring.every(
    ([lon, lat]) =>
      lon >= HAWAII_BOX.minLon &&
      lon <= HAWAII_BOX.maxLon &&
      lat >= HAWAII_BOX.minLat &&
      lat <= HAWAII_BOX.maxLat
  );
}

type WorldData = NonNullable<MapRendererProps['worldData']>;

/**
 * Inhabited-world view: drops Antarctica entirely and Hawaii out of the USA.
 * Done here rather than in world-50m.json so the file stays canonical
 * reference geometry — both really are US / Antarctic territory, we just don't
 * want them on a wireline operations choropleth.
 */
function trimWorld(world: WorldData): WorldData {
  const features = world.features
    .filter((f) => !HIDDEN_COUNTRIES.has((f.properties?.name as string) || ''))
    .map((f) => {
      if ((f.properties?.name as string) !== 'United States of America') return f;
      if (f.geometry?.type !== 'MultiPolygon') return f;
      const kept = f.geometry.coordinates.filter(
        (polygon) => !polygon.some((ring) => ringInsideHawaii(ring as number[][]))
      );
      return { ...f, geometry: { ...f.geometry, coordinates: kept } };
    });
  return { ...world, features } as WorldData;
}

const MapRenderer = memo(function MapRenderer({
  worldData,
  countryMap,
  selectedCountry,
  onCountryClick,
  onCountryHover,
  getColor,
  isLoading,
  svgRef,
  gRef,
}: MapRendererProps) {
  // Trim once per data load. This used to sit inside the effect below, whose
  // deps include countryMap/selectedCountry — so every filter or country click
  // re-filtered 242 features and the USA's 127 polygons for no reason.
  const visibleWorld = useMemo(() => (worldData ? trimWorld(worldData) : null), [worldData]);

  useEffect(() => {
    if (!visibleWorld || isLoading) return;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const width = APP_CONSTANTS.MAP_WIDTH;
    const height = APP_CONSTANTS.MAP_HEIGHT;
    // Fit and draw the INHABITED world only. Antarctica reaches -90°, so
    // including it stretched the latitude span to 173° and squeezed everything
    // that matters into the middle — dropping it takes the southern bound to
    // -58.5° (Chile/Argentina) and buys ~18% more vertical room at the same
    // SVG size. Hawaii goes for a different reason: it shades with the USA and
    // reads as operations in the mid-Pacific, the same misreading French
    // Guiana caused inside the France feature. It frees no space (Alaska and
    // Russia already set ±180) — it just stops saying something untrue.
    const projection = geoNaturalEarth1().fitSize([width, height], visibleWorld);
    const path = geoPath(projection);

    // Then crop the canvas to what was actually drawn. fitSize preserves the
    // aspect ratio, so a 2.5:1 world inside a 960x540 (1.78:1) box is
    // width-constrained and letterboxes top and bottom — that was the wasted
    // space, and dropping Antarctica made it worse, not better, by widening
    // the content further. Setting the viewBox to the projected bounds removes
    // the slack entirely and lets the map fill its container.
    const [[x0, y0], [x1, y1]] = path.bounds(visibleWorld);
    const boxWidth = Math.max(1, x1 - x0);
    const boxHeight = Math.max(1, y1 - y0);
    svg.attr('viewBox', `${x0} ${y0} ${boxWidth} ${boxHeight}`);

    // Ocean / canvas — gives the choropleth a frame instead of bleeding
    // into the page background. Matches the cropped viewBox, not the
    // nominal constants.
    svg
      .append('rect')
      .attr('x', x0)
      .attr('y', y0)
      .attr('width', boxWidth)
      .attr('height', boxHeight)
      .attr('fill', '#f8fafc')
      .attr('rx', 0);

    const g = svg.append('g').node();
    if (!g) return;

    if (gRef.current) {
      gRef.current = g as SVGGElement;
    }

    const gSel = select(g);

    const resolveFill = (count: number) => {
      if (getColor) return getColor(count);
      return count > 0 ? '#34d399' : MAP_CONSTANTS.COLORS.COUNTRY_DEFAULT;
    };

    // Add countries
    const countries = gSel
      .selectAll('path')
      .data(visibleWorld.features)
      .enter()
      .append('path')
      .attr('d', (d) => path(d as Feature<Geometry>) || '')
      .attr('fill', (d) => {
        const feature = d as Feature<Geometry>;
        const name = feature.properties?.name || '';
        const count = countryMap.get(name) || 0;
        return resolveFill(count);
      })
      .attr('stroke', (d) => {
        const feature = d as Feature<Geometry>;
        const name = feature.properties?.name || '';
        return name === selectedCountry ? MAP_CONSTANTS.COLORS.COUNTRY_SELECTED_STROKE : '#ffffff';
      })
      .style('stroke-width', (d) => {
        const feature = d as Feature<Geometry>;
        const name = feature.properties?.name || '';
        return name === selectedCountry
          ? MAP_CONSTANTS.STROKE_WIDTH_SELECTED
          : MAP_CONSTANTS.STROKE_WIDTH_DEFAULT;
      })
      .style('cursor', (d) => {
        const feature = d as Feature<Geometry>;
        const name = feature.properties?.name || '';
        return countryMap.has(name) ? 'pointer' : 'default';
      })
      .attr('tabindex', (d) => {
        const feature = d as Feature<Geometry>;
        const name = feature.properties?.name || '';
        return countryMap.has(name) ? 0 : -1;
      })
      .attr('role', 'button')
      .attr('aria-label', (d) => {
        const feature = d as Feature<Geometry>;
        const name = feature.properties?.name || 'Unknown';
        const count = countryMap.get(name) || 0;
        const isSelected = name === selectedCountry;

        if (count === 0) return `${name}: No deployments`;
        return `${name}: ${formatDeploymentCount(count)}. ${isSelected ? 'Selected. Press Enter to deselect.' : 'Press Enter to select.'}`;
      })
      .on('click', (_, d) => {
        const feature = d as Feature<Geometry>;
        const name = feature.properties?.name || null;
        if (countryMap.has(name || '')) {
          onCountryClick(name === selectedCountry ? null : name);
        }
      })
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          const feature = d as Feature<Geometry>;
          const name = feature.properties?.name || null;
          if (countryMap.has(name || '')) {
            onCountryClick(name === selectedCountry ? null : name);
          }
        }
      })
      .on('mousemove', function (event, d) {
        const feature = d as Feature<Geometry>;
        const name = feature.properties?.name || '';
        if (!countryMap.has(name)) return;

        if (onCountryHover) {
          // event.clientX/Y are viewport-relative; the React tooltip
          // overlay is positioned with `position: fixed`, so that's
          // exactly what we want.
          const mouseEvent = event as MouseEvent;
          onCountryHover({
            country: name,
            count: countryMap.get(name) || 0,
            x: mouseEvent.clientX,
            y: mouseEvent.clientY,
          });
        }
        select(this).attr('stroke', MAP_CONSTANTS.COLORS.HOVER_STROKE).style('stroke-width', 1);
      })
      .on('mouseout', function (_, d) {
        const feature = d as Feature<Geometry>;
        const name = feature.properties?.name || '';
        if (onCountryHover) onCountryHover(null);
        const isSelected = name === selectedCountry;
        select(this)
          .attr('stroke', isSelected ? MAP_CONSTANTS.COLORS.COUNTRY_SELECTED_STROKE : '#ffffff')
          .style(
            'stroke-width',
            isSelected ? MAP_CONSTANTS.STROKE_WIDTH_SELECTED : MAP_CONSTANTS.STROKE_WIDTH_DEFAULT
          );
      });

    // Accessibility — native title element for OS-level tooltip fallback.
    countries.append('title').text((d) => {
      const feature = d as Feature<Geometry>;
      const name = feature.properties?.name || 'Unknown';
      const count = countryMap.get(name) || 0;
      return `${name}: ${formatDeploymentCount(count)}`;
    });

    return () => {
      svg.selectAll('*').remove();
    };
  }, [
    visibleWorld,
    countryMap,
    selectedCountry,
    onCountryClick,
    onCountryHover,
    getColor,
    isLoading,
    svgRef,
    gRef,
  ]);

  // viewBox below is the initial value only — the effect replaces it with the
  // drawn content's projected bounds so the map crops tight, not letterboxed.
  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      viewBox={`0 0 ${APP_CONSTANTS.MAP_WIDTH} ${APP_CONSTANTS.MAP_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Interactive world map showing deployment data by country"
    />
  );
});

export default MapRenderer;
