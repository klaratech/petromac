export interface DeviceMedia {
  introVideo?: string;
  successStories?: string[];
}

export const deviceSpecs: Record<
  string,
  {
    specs: Record<string, string>;
    media?: DeviceMedia;
  }
> = {
  '/models/cp12.glb': {
    specs: {
      Name: 'CP-12 Centralizer',
      Material: '17-4 PH Stainless Steel',
      Length: '16"',
      OD: '9.8" (collapsed)',
      'Max OD': '11.75"',
      Weight: '45 lbs',
      'Operating Temp': 'Up to 400°F',
      'Pressure Rating': '30,000 psi',
      'Drag Coefficient (Dynamic)': '5%',
      'Drag Coefficient (Static)': '12%',
      'Max Load': '500 lbs',
      'Casing Compatibility': 'Open hole ≥ 10-5/8”',
    },
    media: {
      introVideo: '/videos/cp12-placeholder.mp4',
      successStories: ['https://example.com/success-cp12'],
    },
  },
  '/models/cp8.glb': {
    specs: {
      Name: 'CP-8 Centralizer',
      Material: '17-4 PH Stainless Steel (H1150)',
      Length: '19"',
      OD: '7.5" (collapsed)',
      'Max OD': '8.25"',
      Weight: '39 lbs',
      'Operating Temp': 'Up to 400°F',
      'Pressure Rating': '30,000 psi',
      'Drag Coefficient (Dynamic)': '5%',
      'Drag Coefficient (Static)': '12%',
      'Max Load': '350 lbs',
      Compatibility: 'Open hole ≥ 8"',
    },
    media: {
      introVideo: '/videos/cp8-placeholder.mp4',
      successStories: ['https://example.com/success-cp8'],
    },
  },
  '/models/ttbs75.glb': {
    specs: {
      Name: 'TTB-S75 Formation Tester Taxi',
      Material: '17-4 PH Stainless Steel',
      Length: '9.5"',
      OD: '7.5"',
      Weight: '22 lbs',
      'Operating Temp': 'Up to 350°F',
      'Pressure Rating': '30,000 psi',
      'Drag Coefficient (Dynamic)': '2%',
      'Drag Coefficient (Static)': '4%',
      'Max Load': 'Up to 12,700 lbs (tool-dependent)',
      Compatibility: '8.25” to 14.75”',
    },
    media: {
      introVideo: '/videos/ttbs75-placeholder.mp4',
      successStories: ['https://example.com/success-ttbs75'],
    },
  },
  '/models/thor.glb': {
  specs: {
    Name: 'Thor Hammer Tool',
    Material: 'Titanium Alloy',
    Length: '22"',
    OD: '6.5"',
    Weight: '33 lbs',
    'Operating Temp': 'Up to 450°F',
    'Pressure Rating': '35,000 psi',
    'Impact Force': 'High-intensity vibrational',
    'Use Case': 'Stuck pipe remediation',
    Compatibility: '6”–12” hole sizes',
  },
  media: {
    introVideo: '/videos/helix.mp4',
    successStories: ['https://example.com/success-thor'],
  },
},
  '/models/helix.glb': {
    specs: {
      Name: 'CX-9 Helix Centralizer',
      Material: '17-4 PH Stainless Steel',
      Length: '25"',
      'Max OD': '5.625"',
      Weight: '40 lbs',
      'Operating Temp': 'Up to 400°F',
      'Pressure Rating': '30,000 psi',
      'Drag Coefficient (Dynamic)': '3%',
      'Max Load': '190–225 lbs',
      'Casing Compatibility': '7” to 9-5/8” casing',
    },
    media: {
      introVideo: '/videos/helix.mp4',
      successStories: ['https://youtu.be/dQw4w9WgXcQ'],
    },
  },
};