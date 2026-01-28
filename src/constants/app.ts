// Kiosk routes
export const KIOSK_HOME_PATH = '/intranet/kiosk';

// App-wide constants
export const APP_CONSTANTS = {
  // Timeouts
  IDLE_TIMEOUT: 30_000, // 30 seconds
  IDLE_CHECK_INTERVAL: 10_000, // 10 seconds
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

// Video sources
export const VIDEO_SOURCES = [
  '/videos/dice.mp4?v=20250520',
  '/videos/WirelineExpress.mp4?v=20250519',
  '/videos/helix.mp4?v=20250519',
  '/videos/pf.mp4?v=250519'
] as const;

// External URLs
export const EXTERNAL_URLS = {
  WORLD_MAP_DATA: '/data/world-110m.json',
  COUNTRY_LABELS: '/data/country_labels.json',
  OPERATIONS_DATA: '/data/operations_data.json',
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
