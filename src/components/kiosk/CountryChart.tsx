import { memo } from 'react';
import type { CountryChartProps } from '@/types/MapTypes';
import { APP_CONSTANTS } from '@/constants/app';
import { MAP_CONSTANTS } from '@/constants/mapConstants';

const CountryChart = memo(function CountryChart({
  countries,
  countryLabels,
  selectedCountry,
  onCountryClick
}: CountryChartProps) {
  if (countries.length === 0) return null;

  const maxCount = countries[0][1];
  const visibleCountries = countries.slice(0, APP_CONSTANTS.MAX_CHART_COUNTRIES);
  const remainingCount = countries.length - APP_CONSTANTS.MAX_CHART_COUNTRIES;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md text-black border border-gray-200 rounded-lg shadow px-6 py-4 max-w-[90vw] w-fit">
      <div className="text-sm font-medium mb-4 text-center">
        Deployments by Country
      </div>
      
      <div className="overflow-x-auto">
        <div className="flex items-end gap-3 min-w-fit px-2">
          {visibleCountries.map(([country, count]) => {
            const barHeight = Math.max(
              (count / maxCount) * APP_CONSTANTS.MAX_BAR_HEIGHT, 
              APP_CONSTANTS.MIN_BAR_HEIGHT
            );
            const isSelected = selectedCountry === country;
            
            return (
              <div 
                key={country} 
                className="flex flex-col items-center cursor-pointer group transition-all duration-200 hover:scale-105"
                onClick={() => onCountryClick(selectedCountry === country ? null : country)}
                role="button"
                tabIndex={0}
                aria-label={`${countryLabels[country] || country}: ${count} deployments. Click to ${isSelected ? 'deselect' : 'select'}.`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onCountryClick(selectedCountry === country ? null : country);
                  }
                }}
              >
                <div className="relative">
                  {/* Tooltip */}
                  {isSelected && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {count} deployment{count !== 1 ? 's' : ''}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                  
                  {/* Bar */}
                  <div
                    className={`w-8 rounded-t transition-all duration-200 ${MAP_CONSTANTS.FOCUS_RING} ${
                      isSelected 
                        ? 'bg-green-500 shadow-lg ring-2 ring-green-300' 
                        : 'bg-green-400 group-hover:bg-green-500'
                    }`}
                    style={{ height: `${barHeight}px` }}
                    role="img"
                    aria-label={`Bar representing ${count} deployments`}
                  />
                </div>
                
                {/* Country label and count */}
                <div className="mt-2 text-xs text-center max-w-[60px] leading-tight">
                  <div className="font-medium truncate" title={countryLabels[country] || country}>
                    {countryLabels[country] || country}
                  </div>
                  <div className={`${isSelected ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
                    {count}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* "More countries" indicator */}
          {remainingCount > 0 && (
            <div 
              className="flex flex-col items-center justify-end text-gray-500"
              role="status"
              aria-label={`${remainingCount} more countries with deployments`}
            >
              <div className="w-8 h-4 bg-gray-200 rounded-t opacity-60" />
              <div className="mt-2 text-xs text-center">
                <div className="font-medium">+{remainingCount}</div>
                <div className="text-gray-400">more</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Chart summary */}
      <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-600 text-center">
        Showing top {Math.min(countries.length, APP_CONSTANTS.MAX_CHART_COUNTRIES)} of {countries.length} countries
      </div>
    </div>
  );
});

export default CountryChart;
