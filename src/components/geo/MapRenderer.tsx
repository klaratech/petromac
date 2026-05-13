import { useEffect, memo } from 'react';
import { select } from 'd3-selection';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import 'd3-transition';
import type { Feature, Geometry } from 'geojson';
import type { MapRendererProps } from '@/types/MapTypes';
import { APP_CONSTANTS } from '@/constants/app';
import { MAP_CONSTANTS } from '@/constants/mapConstants';
import { formatDeploymentCount } from '@/lib/maps';

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
  useEffect(() => {
    if (!worldData || isLoading) return;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const width = APP_CONSTANTS.MAP_WIDTH;
    const height = APP_CONSTANTS.MAP_HEIGHT;
    const projection = geoNaturalEarth1().fitSize([width, height], worldData);
    const path = geoPath(projection);

    // Ocean / canvas — gives the choropleth a frame instead of bleeding
    // into the page background.
    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
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
      .data(worldData.features)
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
        return name === selectedCountry
          ? MAP_CONSTANTS.COLORS.COUNTRY_SELECTED_STROKE
          : '#ffffff';
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
        select(this)
          .attr('stroke', MAP_CONSTANTS.COLORS.HOVER_STROKE)
          .style('stroke-width', 1);
      })
      .on('mouseout', function (_, d) {
        const feature = d as Feature<Geometry>;
        const name = feature.properties?.name || '';
        if (onCountryHover) onCountryHover(null);
        const isSelected = name === selectedCountry;
        select(this)
          .attr(
            'stroke',
            isSelected
              ? MAP_CONSTANTS.COLORS.COUNTRY_SELECTED_STROKE
              : '#ffffff',
          )
          .style(
            'stroke-width',
            isSelected
              ? MAP_CONSTANTS.STROKE_WIDTH_SELECTED
              : MAP_CONSTANTS.STROKE_WIDTH_DEFAULT,
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
    worldData,
    countryMap,
    selectedCountry,
    onCountryClick,
    onCountryHover,
    getColor,
    isLoading,
    svgRef,
    gRef,
  ]);

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
