import { useEffect, memo } from 'react';
import * as d3 from 'd3';
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
  isLoading,
  svgRef,
  gRef
}: MapRendererProps) {

  useEffect(() => {
    if (!worldData || isLoading) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = APP_CONSTANTS.MAP_WIDTH;
    const height = APP_CONSTANTS.MAP_HEIGHT;
    const projection = d3.geoNaturalEarth1().fitSize([width, height], worldData);
    const path = d3.geoPath(projection);

    const g = svg.append('g').node();
    if (!g) return;
    
    if (gRef.current) {
      gRef.current = g as SVGGElement;
    }
    
    const gSel = d3.select(g);

    // Add countries  
    const countries = gSel.selectAll('path')
      .data(worldData.features)
      .enter()
      .append('path')
      .attr('d', (d) => path(d as Feature<Geometry>) || '')
      .attr('fill', (d) => {
        const feature = d as Feature<Geometry>;
        const name = feature.properties?.name || '';
        const hasData = countryMap.has(name);
        const isSelected = name === selectedCountry;
        
        if (isSelected) return MAP_CONSTANTS.COLORS.COUNTRY_SELECTED;
        if (hasData) return MAP_CONSTANTS.COLORS.COUNTRY_WITH_DATA;
        return MAP_CONSTANTS.COLORS.COUNTRY_DEFAULT;
      })
      .attr('stroke', '#ccc')
      .style('stroke-width', (d) => {
        const feature = d as Feature<Geometry>;
        const name = feature.properties?.name || '';
        return name === selectedCountry ? MAP_CONSTANTS.STROKE_WIDTH_SELECTED : MAP_CONSTANTS.STROKE_WIDTH_DEFAULT;
      })
      .style('filter', (d) => {
        const feature = d as Feature<Geometry>;
        const name = feature.properties?.name || '';
        return name === selectedCountry 
          ? `drop-shadow(0 0 4px ${MAP_CONSTANTS.COLORS.SELECTED_GLOW})` 
          : 'none';
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
      .on('mouseover', function(_, d) {
        const feature = d as Feature<Geometry>;
        const name = feature.properties?.name || '';
        if (countryMap.has(name)) {
          d3.select(this)
            .transition()
            .duration(MAP_CONSTANTS.TRANSITION_DURATION)
            .style('filter', `drop-shadow(0 0 2px ${MAP_CONSTANTS.COLORS.SELECTED_GLOW})`);
        }
      })
      .on('mouseout', function(_, d) {
        const feature = d as Feature<Geometry>;
        const name = feature.properties?.name || '';
        const isSelected = name === selectedCountry;
        
        d3.select(this)
          .transition()
          .duration(MAP_CONSTANTS.TRANSITION_DURATION)
          .style('filter', isSelected 
            ? `drop-shadow(0 0 4px ${MAP_CONSTANTS.COLORS.SELECTED_GLOW})` 
            : 'none'
          );
      });

    // Add tooltip functionality using title elements for better accessibility
    countries.append('title')
      .text((d) => {
        const feature = d as Feature<Geometry>;
        const name = feature.properties?.name || 'Unknown';
        const count = countryMap.get(name) || 0;
        return `${name}: ${formatDeploymentCount(count)}`;
      });

    // Cleanup function
    return () => {
      svg.selectAll('*').remove();
    };
  }, [worldData, countryMap, selectedCountry, onCountryClick, isLoading, svgRef, gRef]);

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
