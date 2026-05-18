// Kiosk routes
export const KIOSK_HOME_PATH = '/intranet/kiosk';
// OH still uses the lane attractor; CH lands directly in the Helix
// experience via its own route. The `/lane?lane=ch` URL redirects to
// KIOSK_CH_PATH for backward compatibility.
export const KIOSK_LANE_PATH = '/intranet/kiosk/lane';
export const KIOSK_CH_PATH = '/intranet/kiosk/ch';
export const KIOSK_PRODUCTLINES_PATH = '/intranet/kiosk/productlines';

// App-wide constants
export const APP_CONSTANTS = {
  // Timeouts
  TYPING_SPEED: 50, // milliseconds per character
  BUTTON_SHOW_DELAY: 500, // milliseconds

  // Map dimensions
  MAP_WIDTH: 960,
  MAP_HEIGHT: 540,

  // Chart settings
  MAX_CHART_COUNTRIES: 15,
  MIN_BAR_HEIGHT: 8, // pixels
  MAX_BAR_HEIGHT: 80, // pixels

  // Cache settings
  MEDIA_CACHE_MAX_ENTRIES: 50,
  MEDIA_CACHE_MAX_AGE: 60 * 60 * 24 * 30, // 30 days in seconds

  // UI settings
  COUNTRY_CHART_WIDTH: 320,
  YEARLY_STATS_HEIGHT: '45vh',
} as const;

// External URLs
export const EXTERNAL_URLS = {
  // Natural-earth 50m via world-atlas@2 — smoother country outlines than the
  // 110m generalization (notably fixes Bolivia's coarse south-east border).
  // 739 KB vs 106 KB; cached aggressively by the service worker.
  WORLD_MAP_DATA: '/data/world-50m.json',
} as const;

// Device types
export const DEVICE_TYPES = [
  'Taxi',
  'Pathfinder',
  'Helix',
  'CP-12',
  'CP-8',
  'Rocker',
  'THOR'
] as const;

export type DeviceType = typeof DEVICE_TYPES[number];
