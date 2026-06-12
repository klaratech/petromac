// New structured data model

export type Lane = 'oh' | 'ch';

export interface SystemMedia {
  video: string;
  logo: string;
}

export interface DeviceSpec {
  specs: Record<string, string>;
  /** Optional graph image (load-capacity curve, performance plot, etc.) shown
   *  beneath the spec table inside the kiosk Specifications modal. Sized to
   *  fit the modal — a cropped page from the product catalog works well. */
  graph?: string;
  system: string;
  subsystem: string;
  /** Which kiosk lane this device belongs to. */
  lane: Lane;
}

export const systemMedia: Record<string, SystemMedia> = {
  Focus: {
    video: '/videos/transcoded/helix.mp4?v=20240517',
    logo: '/images/focus.png',
  },
  'Wireline Express': {
    video: '/videos/transcoded/WirelineExpress.mp4?v=20240519',
    logo: '/images/wirelineexpress.png',
  },
  Thor: {
    video: '/videos/transcoded/helix.mp4?v=20240517',
    logo: '/images/thor.png',
  },
  PathFinder: {
    video: '/videos/transcoded/pf.mp4?v=20240519',
    logo: '/images/pathfinder.png',
  },
  // Cased-hole experience. The CH lane shows a single "Focus Centralizers"
  // tile which opens the Helix-centric experience (looping video + HUD
  // overlay + Rocker corner badge). Helix and Rocker are NOT separate tiles.
  'Focus Centralizers': {
    // Uses the subtitled Helix clip so the kiosk gets narration + on-screen
    // captions in the Focus Centralizers experience. Routed through
    // useKioskVideo in HelixExperience so the kiosk-hd 1080p
    // variant is picked up automatically when present.
    video: '/videos/transcoded/helix-subtitled.mp4?v=20240517',
    // Focus Centralizers brandmark — reuses focus.png intentionally; a
    // dedicated brandmark is tracked under "Helix product image" in TODO.md.
    logo: '/images/focus.png',
  },
  // Other cased-hole product family — placeholder slot. The chooser shows it
  // as a tile but tapping opens a "Coming soon" screen until populated.
  'Other CH': {
    video: '/videos/transcoded/helix.mp4?v=20240517',
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
    system: 'Thor',
    subsystem: 'Thor',
    lane: 'oh',
  },
  '/models/helix.glb': {
    // Sourced from product catalog p.54 (CX9 Helix Centralser tech specs +
    // materials + load-capacity graph). Insertion order is preserved by the
    // 2-column grid in SpecsModal — technical specs first, materials second.
    specs: {
      Name: 'CX9 Helix Centraliser',
      Model: 'CX9',
      Weight: '40 lbs',
      Length: '25" (0.64 m)',
      Volume: '0.08 ft³',
      'Min Casing Size': '7" – #38 (ID 5.92")',
      'Max Casing Size': '9-5/8" – #32.3 (ID 9.00")',
      'Load Carry Capability': '190 – 225 lbs',
      'Drag Coefficient (Dynamic)': '3%',
      'Drag Force': '6 lbs',
      'Temperature Rating': '400°F',
      'Pressure Rating': '30,000 psi',
      'Collapsed OD': '5-⅝"',
      'Taxi Bore': '3-⅝"',
      Body: '17-4 PH SS, heat treated H1075',
      Bearings: 'Custom bush bearing',
      Grease: 'Lubriplate 930AA',
      Attachment: 'Alloy steel grub screw, ¼" hex, UNC thread, dog end',
      'SWL (Shear set screws)': '17,000 lbs',
    },
    graph: '/images/kiosk-images/helix-load-capacity.png',
    // Helix lives inside the "Focus Centralizers" CH experience — it's the
    // primary tool, with the Helix intro video looping in the background.
    // Rocker is the secondary tool accessed via a corner badge inside the
    // same experience.
    system: 'Focus Centralizers',
    subsystem: 'Helix CX9',
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
    system: 'PathFinder',
    subsystem: 'Pathfinder HT',
    lane: 'oh',
  },
  // ROCKER — sister cased-hole tool to Helix for smaller casing (CRU).
  // Sourced from product-catalog p.52. Two configurations (Small kit and
  // Standard) differ only on Minimum OD; everything else is shared.
  // 3D model file is still pending — see TODO.md.
  rocker: {
    specs: {
      Name: 'CRU Rocker Centraliser',
      Model: 'CRU',
      Weight: '23 lbs (10.5 kg)',
      Length: 'Assembled to USIS Sonde',
      Volume: '0.05 ft³',
      'Min Casing Size': '4-1/2"',
      'Max Casing Size': '7"',
      'Minimum OD': '3-⅜" (Small kit) · 3-⅝" (Standard)',
      'Max Load Carry Capability': '200 lbs',
      'Drag Coefficient (Dynamic)': '2%',
      'Drag Force': '6 lbs',
      'Temperature Rating': '400°F',
      'Pressure Rating': '30,000 psi',
      Body: '17-4 PH SS, heat treated H1075',
      Bearings: 'Custom bush bearing',
      Grease: 'Lubriplate 930AA',
    },
    graph: '/images/kiosk-images/rocker-load-capacity.png',
    system: 'Rocker',
    subsystem: 'Rocker',
    lane: 'ch',
  },
};
