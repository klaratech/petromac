// New structured data model

export type Lane = 'oh' | 'ch';

export interface SystemMedia {
  video: string;
  logo: string;
}

export interface DeviceMedia {
  model: string; // GLB path
  image: string;
}

export interface DeviceSpec {
  specs: Record<string, string>;
  media: DeviceMedia;
  system: string;
  subsystem: string;
  /** Which kiosk lane this device belongs to. */
  lane: Lane;
}

export const systemMedia: Record<string, SystemMedia> = {
  'Focus': {
    video: '/videos/helix.mp4?v=20240517',
    logo: '/images/focus.png',
  },
  'Wireline Express': {
    video: '/videos/WirelineExpress.mp4?v=20240519',
    logo: '/images/wirelineexpress.png',
  },
  'Thor': {
    video: '/videos/helix.mp4?v=20240517',
    logo: '/images/thor.png',
  },
  'PathFinder': {
    video: '/videos/pf.mp4?v=20240519',
    logo: '/images/pathfinder.png',
  },
  // Cased-hole systems (split out for the OH/CH kiosk lane)
  'Helix': {
    // TODO(graphics): replace with dedicated Helix logo + intro video
    // (extracted from ICOTA 2026 MaIn.pptx, slide 2 → media1.mp4 transcoded)
    video: '/videos/helix.mp4?v=20240517',
    logo: '/images/focus.png',
  },
  'Rocker': {
    // TODO(graphics): Rocker logo, intro video, and 3D model are all pending.
    // Placeholder reuses the Focus assets so the tile renders.
    video: '/videos/helix.mp4?v=20240517',
    logo: '/images/focus.png',
  },
};

export const deviceSpecs: Record<string, DeviceSpec> = {
  '/models/cp12.glb': {
    specs: {
      Name: 'CP-12 Centraliser',
      Material: '17-4 PH Stainless Steel',
      Length: '16"',
      Weight: '45 lbs',
      OD: '9.8" (collapsed)',
      'Max OD': '11.75"',
      'Hole Size': 'Open hole ≥ 10-5/8”',
      'Operating Temp': 'Up to 400°F',
      'Pressure Rating': '30,000 psi',
      'Drag Coefficient (Dynamic)': '5%',
      'Drag Coefficient (Static)': '12%',
      'Carry Load': 'Up to 500 lbs',
    },
    media: {
      model: '/models/cp12.glb',
      image: '/images/cp12.png',
    },
    system: 'Focus',
    subsystem: 'Focus-OH',
    lane: 'oh',
  },
  '/models/cp8.glb': {
    specs: {
      Name: 'CP-8 Centraliser',
      Material: '17-4 PH Stainless Steel',
      Length: '19"',
      Weight: '39 lbs',
      OD: '7.5" (collapsed)',
      'Max OD': '8.25"',
      'Hole Size': 'Open hole ≥ 8”',
      'Operating Temp': 'Up to 400°F',
      'Pressure Rating': '30,000 psi',
      'Drag Coefficient (Dynamic)': '5%',
      'Drag Coefficient (Static)': '12%',
      'Carry Load': 'Up to 350 lbs',
    },
    media: {
      model: '/models/cp8.glb',
      image: '/images/cp8.png',
    },
    system: 'Focus',
    subsystem: 'Focus - OH',
    lane: 'oh',
  },
  '/models/ttbs75.glb': {
    specs: {
      Name: 'TTB-S75 Formation Tester Taxi',
      Material: '17-4 PH Stainless Steel',
      Length: '9.5"',
      Weight: '22 lbs',
      'Max OD': '7.5"',
      'Hole Size': '8-1/4” to 14-3/4”',
      'Operating Temp': 'Up to 350°F',
      'Pressure Rating': '30,000 psi',
      'Drag Coefficient (Dynamic)': '2%',
      'Drag Coefficient (Static)': '4%',
      'Carry Load': 'Up to 12,700 lbs (tool-dependent)',
    },
    media: {
      model: '/models/ttbs75.glb',
      image: '/images/ttbs75.png',
    },
    system: 'Wireline Express',
    subsystem: 'Wireline Express',
    lane: 'oh',
  },
  '/models/thor.glb': {
    specs: {
      Name: 'Thor Controlled Impulse Jar',
      Material: 'Titanium Alloy',
      'Make-Up Length (Jar Cocked)': '11.5ft',
      'Make-Up Length (Jar Fired)': '12.0ft',
      Weight: '387 lbs',
      OD: '4.125"',
      'Hole Size': 'Open hole ≥ 5-1/8"',
      'Operating Temp': 'Up to 450°F',
      'Pressure Rating': '35,000 psi',
      'Jarring Force': 'Up to xxx,xxx lbs',
      'Time Delay to Fire': 'Up to 6 minutes',
      'Tool Compatibility': 'All SLB Logging Tools',
    },
    media: {
      model: '/models/thor.glb',
      image: '/images/thor.png',
    },
    system: 'Thor',
    subsystem: 'Thor',
    lane: 'oh',
  },
  '/models/helix.glb': {
    specs: {
      Name: 'CX-9 Helix Centraliser',
      Material: '17-4 PH Stainless Steel',
      Length: '25"',
      Weight: '40 lbs',
      OD: '5.625" (collapsed)',
      'Max OD': '9.00"',
      'Casing Sizes': '7” to 9-5/8” casing',
      'Operating Temp': 'Up to 400°F',
      'Pressure Rating': '30,000 psi',
      'Drag Coefficient (Dynamic)': '3%',
      'Carry Load': '190–225 lbs',
    },
    media: {
      model: '/models/helix.glb',
      image: '/images/helix.png',
    },
    // Promoted to its own top-level system so the cased-hole kiosk lane can
    // surface it as a discrete tile (with its own video + sub-buttons),
    // separate from the Focus open-hole centralisers.
    system: 'Helix',
    subsystem: 'Helix CX-9',
    lane: 'ch',
  },
  '/models/pathfinderht.glb': {
    specs: {
      Name: 'Pathfinder HT Universal Hole Finder',
      Material: '2205 and 17-4 PH Stainless Steel',
      Length: '90.5"',
      Weight: '77 lbs',
      OD: '5.00" (collapsed)',
      'Hole Size': 'Open hole ≥ 5-3/4"',
      'Operating Temp': 'Up to 400°F',
      'Pressure Rating': '30,000 psi',
      'Flex Joint': '6° all directions',
      'Tool Compatibility': 'HAL J-Latch, Baker WTS, SLB Threaded ring',
    },
    media: {
      model: '/models/pathfinderht.glb',
      image: '/images/pathfinder.png',
    },
    system: 'PathFinder',
    subsystem: 'Pathfinder HT',
    lane: 'oh',
  },
  // Stub for ROCKER — sister cased-hole tool to Helix for smaller casing.
  // No 3D model yet; the entry exists so the tile renders in the CH lane and
  // we can wire up real specs/media as graphics delivers them.
  '/models/rocker.glb': {
    specs: {
      Name: 'Rocker Centraliser',
      Status: 'Coming soon',
      Notes: 'Sister tool to Helix for small casing sizes (3.3"–6.3" range).',
    },
    media: {
      model: '/models/rocker.glb', // placeholder — file not yet present
      image: '/images/focus.png',  // placeholder
    },
    system: 'Rocker',
    subsystem: 'Rocker',
    lane: 'ch',
  },
};
