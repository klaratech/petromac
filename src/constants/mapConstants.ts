export const MAP_CONSTANTS = {
  // Rendering constants
  STROKE_WIDTH_DEFAULT: 0.5,
  STROKE_WIDTH_SELECTED: 1.5,
  TOOLTIP_OFFSET: 6,
  YEAR_CHART_BAR_HEIGHT: 24,

  // Error handling
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000, // 1 second base delay

  // Chart dimensions
  YEARLY_CHART_WIDTH: 320,
  YEARLY_CHART_HEIGHT_RATIO: 0.45, // 45vh

  // Animation durations
  TRANSITION_DURATION: 150,
  HOVER_SCALE: 1.05,

  // Colors — brand-blue intensity ramp (5 buckets) for the choropleth.
  // Tightly correlated with the brand navy #1E4A9A so the map reads as
  // an extension of the site, not a generic data viz.
  COLORS: {
    COUNTRY_DEFAULT: '#eef2f7',          // very light gray — no deployments
    COUNTRY_SELECTED_STROKE: '#0f172a',  // near-black ring on the tapped country
    SELECTED_GLOW: '#1E4A9A',
    CHART_BAR: '#1E4A9A',
    TEXT_PRIMARY: '#0f172a',
    TEXT_SECONDARY: '#334155',
    TEXT_MUTED: '#64748b',
    // Sequential 5-step intensity scale (light → brand navy).
    // Used both by the map and the legend.
    INTENSITY_RAMP: [
      '#dbeafe', // blue-100
      '#93c5fd', // blue-300
      '#60a5fa', // blue-400
      '#2563eb', // blue-600
      '#1E4A9A', // brand
    ] as const,
    // Hover highlight stroke
    HOVER_STROKE: '#0f172a',
  },

  // Accessibility
  FOCUS_RING: 'focus:outline-none focus:ring-2 focus:ring-blue-500',

  // Layout
  CHART_CONTAINER_MAX_WIDTH: '90vw',
  SYSTEM_SELECTOR_GAP: 2,
  COUNTRY_BAR_GAP: 3,
} as const;
