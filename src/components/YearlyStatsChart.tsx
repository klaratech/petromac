import { memo } from 'react';
import type { YearlyStatsChartProps } from '@/types/MapTypes';
import { MAP_CONSTANTS } from '@/constants/mapConstants';

const YearlyStatsChart = memo(function YearlyStatsChart({
  countryName,
  yearlyStats,
  onClose
}: YearlyStatsChartProps) {
  if (yearlyStats.length === 0) return null;

  const maxValue = Math.max(...yearlyStats.map(stat => stat.count));
  const chartHeight = Math.min(yearlyStats.length * MAP_CONSTANTS.YEAR_CHART_BAR_HEIGHT, 300);

  return (
    <div 
      className="absolute top-6 right-4 z-50 bg-white text-black border border-gray-300 rounded-lg shadow px-4 py-4 w-[320px]"
      style={{ height: `${MAP_CONSTANTS.YEARLY_CHART_HEIGHT_RATIO * 100}vh` }}
      role="region"
      aria-label={`Deployment statistics for ${countryName} by year`}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="text-md font-semibold">
          Deployments in {countryName} by Year
        </div>
        <button
          onClick={onClose}
          className={`text-gray-500 hover:text-gray-700 ${MAP_CONSTANTS.FOCUS_RING}`}
          aria-label="Close yearly statistics"
        >
          ✕
        </button>
      </div>
      
      <div className="overflow-y-auto h-full">
        <svg 
          viewBox={`0 0 ${MAP_CONSTANTS.YEARLY_CHART_WIDTH} ${chartHeight}`} 
          width="100%" 
          height="100%"
          role="img"
          aria-label={`Bar chart showing deployments in ${countryName} by year`}
        >
          {yearlyStats.map((stat, i) => {
            const barWidth = maxValue > 0 ? (stat.count / maxValue) * 200 : 0;
            const y = i * MAP_CONSTANTS.YEAR_CHART_BAR_HEIGHT;
            
            return (
              <g key={stat.year} transform={`translate(0,${y})`}>
                {/* Year label */}
                <text 
                  x={0} 
                  y={15} 
                  fontSize="10" 
                  fill={MAP_CONSTANTS.COLORS.TEXT_SECONDARY}
                  className="font-medium"
                >
                  {stat.year}
                </text>
                
                {/* Bar */}
                <rect 
                  x={50} 
                  y={4} 
                  height={12} 
                  width={Math.max(barWidth, 2)} 
                  fill={MAP_CONSTANTS.COLORS.CHART_BAR}
                  rx={2}
                  className="transition-all duration-200"
                />
                
                {/* Value label */}
                <text 
                  x={50 + barWidth + 8} 
                  y={14} 
                  fontSize="10" 
                  fill={MAP_CONSTANTS.COLORS.TEXT_PRIMARY}
                  className="font-medium"
                >
                  {stat.count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Summary footer */}
      <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
        Total: {yearlyStats.reduce((sum, stat) => sum + stat.count, 0)} deployments
      </div>
    </div>
  );
});

export default YearlyStatsChart;
