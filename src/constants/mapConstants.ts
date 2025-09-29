export const MAP_CONSTANTS = {
  // Rendering constants
  STROKE_WIDTH_DEFAULT: 1,
  STROKE_WIDTH_SELECTED: 2,
  TOOLTIP_OFFSET: 6,
  YEAR_CHART_BAR_HEIGHT: 24,
  
  // Error handling
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000, // 1 second base delay
  
  // Chart dimensions
  YEARLY_CHART_WIDTH: 320,
  YEARLY_CHART_HEIGHT_RATIO: 0.45, // 45vh
  
  // Animation durations
  TRANSITION_DURATION: 200,
  HOVER_SCALE: 1.05,
  
  // Colors
  COLORS: {
    COUNTRY_DEFAULT: '#f3f4f6',
    COUNTRY_WITH_DATA: '#34d399',
    COUNTRY_SELECTED: '#4ade80',
    SELECTED_GLOW: '#22c55e',
    CHART_BAR: '#60a5fa',
    TEXT_PRIMARY: '#111',
    TEXT_SECONDARY: '#333',
    TEXT_MUTED: '#666',
  },
  
  // Accessibility
  FOCUS_RING: 'focus:outline-none focus:ring-2 focus:ring-blue-500',
  
  // Layout
  CHART_CONTAINER_MAX_WIDTH: '90vw',
  SYSTEM_SELECTOR_GAP: 2,
  COUNTRY_BAR_GAP: 3,
} as const;
