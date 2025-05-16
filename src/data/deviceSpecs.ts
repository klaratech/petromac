export interface DeviceMedia {
  introVideo?: string;
  successStories?: string[];
}

export const deviceSpecs: Record<
  string,
  {
    specs: Record<string, string>;
    media?: DeviceMedia;
    system?: string;
    subsystem: string;
    systemIcon: string;
  }
> = {
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
      introVideo: '/videos/cp12-placeholder.mp4',
    },
    system: 'Focus',
    subsystem: 'Focus-OH',
    systemIcon: '/images/focus.png',
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
      introVideo: '/videos/cp8-placeholder.mp4',
    },
    system: 'Focus',
    subsystem: 'Focus - OH',
    systemIcon: '/images/focus.png',
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
      introVideo: '/videos/WirelineExpress.mp4',
    },
    system: 'Wireline Express',
    subsystem: 'Wireline Express',
    systemIcon: '/images/wirelineexpress.png',
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
      introVideo: '/videos/helix.mp4',
    },
    system: 'Thor',
    subsystem: 'Thor',
    systemIcon: '/images/thor.png',
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
      introVideo: '/videos/helix.mp4',
    },
    system: 'Focus',
    subsystem: 'Focus - CH',
    systemIcon: '/images/focus.png',
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
      introVideo: '/videos/Pathfinder_16May_subtitled.mp4',
    },
    system: 'PathFinder',
    subsystem: 'Pathfinder HT',
    systemIcon: '/images/pathfinder.png',
  },
};
