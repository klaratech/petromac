/**
 * Cased-hole experience configs.
 *
 * Lives separately from the screen components (MechanismScreen,
 * LogsScreen) so the heavy view code can be `dynamic()` loaded by
 * HelixExperience / RockerExperience while these (much smaller) config
 * objects stay in the initial bundle. The wrapping experience uses them
 * to compose the configWithSpecs payload it passes into the lazy screen
 * once the user actually opens that view.
 *
 * Types are imported via `import type` so referencing them doesn't pull
 * the screens' runtime code into this module.
 */

import type { MechanismConfig } from './MechanismScreen';
import type { LogsConfig } from './LogsScreen';

// ── Mechanism configs ───────────────────────────────────────────────────────

export const HELIX_MECHANISM: MechanismConfig = {
  title: 'Helix',
  slides: [
    // 1. Annotated conventional centraliser — limitations. The
    //    conventional-largecasings video plays inside the slide.
    {
      type: 'annotated',
      label: 'Conventional centraliser',
      image: '/images/helix-mechanism-conventional.png',
      video: '/videos/transcoded/conventional-largecasings.mp4',
      bullets: [
        { text: 'Pivot point on SAME side' },
        { text: 'Minimal slider movement' },
        { text: 'Arm angle not optimised' },
        { text: 'Limited range of casing sizes', highlight: 'red' },
      ],
    },
    // 2. Annotated HELIX — benefits. helix-mechanism video plays inside the
    //    slide as the counterpoint to slide 1.
    {
      type: 'annotated',
      label: 'HELIX',
      image: '/images/helix-mechanism-helix.png',
      video: '/videos/transcoded/helix-mechanism.mp4',
      bullets: [
        { text: 'Pivot point on OPPOSITE side' },
        { text: 'Ensures arm angle is optimised' },
        { text: 'Large slider movement' },
        { text: 'Effective mechanism in large range of casing sizes', highlight: 'blue' },
      ],
    },
    // 3. Lever-arm comparison — the takeaway: 80% less force.
    {
      type: 'comparison',
      label: 'Lever arm comparison',
      rows: [
        { image: '/images/kiosk-images/leverage-conventional.png', rowLabel: 'Conventional' },
        { image: '/images/kiosk-images/leverage-helix.png', rowLabel: 'HELIX' },
      ],
      bullets: [
        { text: 'Helix enters restrictions with 80% less force', highlight: 'blue' },
      ],
    },
  ],
};

export const ROCKER_MECHANISM: MechanismConfig = {
  title: 'Rocker',
  slides: [
    // 1. Annotated conventional small-casing centraliser — limitations.
    {
      type: 'annotated',
      label: 'Conventional centraliser',
      image: '/images/rocker-mechanism-conventional.png',
      video: '/videos/transcoded/conventional-smallcasings.mp4',
      detailImage: '/images/rocker-mechanism-conventional-detail.png',
      bullets: [
        { text: 'Arms independent of each other' },
        { text: 'In smaller holes, arm angle is very shallow' },
        { text: 'Minimal slider movement' },
        { text: 'Inefficient centralization' },
        { text: 'Mechanism fails in smaller holes', highlight: 'red' },
      ],
    },
    // 2. Annotated ROCKER — benefits.
    {
      type: 'annotated',
      label: 'ROCKER',
      image: '/images/rocker-mechanism-rocker.png',
      video: '/videos/transcoded/rocker-mechanism.mp4',
      bullets: [
        { text: 'Rocker arm pivots around centreline' },
        { text: 'Large slider movement' },
        { text: 'Synchronised arm assemblies' },
        { text: 'Effective mechanism in small casing sizes', highlight: 'blue' },
      ],
    },
  ],
};

// ── Case studies (logs) configs ─────────────────────────────────────────────

export const HELIX_LOGS: LogsConfig = {
  title: 'Helix',
  trackRecord: {
    system: 'Focus - CH',
    enableSuccessStories: true,
  },
  slides: [
    // Slide 0 — Track Record map.
    { type: 'map' },
    // Slide 1 — 4 drops in HTEN, ~60 lbs each, on IBC + Sonic ledges.
    {
      type: 'annotated',
      src: '/images/kiosk-images/Helix_Log1.png',
      annotations: [
        {
          title: '4 drops in HTEN of ONLY 60 lbs from CX9 on IBC & Sonic',
          tone: 'blue',
          circles: [],
        },
      ],
    },
    // Slide 2 — Poor 13-3/8" conventional vs excellent 9-5/8"/7" CX9.
    {
      type: 'annotated',
      src: '/images/kiosk-images/Helix_Log2.png',
      annotations: [
        {
          tone: 'red',
          title: 'Poor centralization in 13-3/8" casing with conventional centralizers',
          bullets: [
            'Large difference between Min and Max TT’s',
            'Erratic & poor sonic data',
          ],
          circles: [],
        },
        {
          tone: 'blue',
          title: 'Excellent centralization in 9-5/8" and 7" casings with CX9',
          bullets: [
            'Difference between Min and Max TT’s < 10 µs',
          ],
          circles: [],
        },
      ],
    },
    // Slide 3 — Excellent ECCE all the way out to 85° deviation in 9-5/8".
    {
      type: 'annotated',
      src: '/images/kiosk-images/Helix_Log3-1.png',
      annotations: [
        {
          tone: 'blue',
          title: 'CX9: Ultrasonic to 85° deviation in 9-5/8"',
          bullets: [
            'Excellent ECCE even where DLS is high',
            'Excellent ECCE from vertical to 85° deviation',
            'Average ECCE of 0.07" (limit is 0.38")',
          ],
          circles: [],
          detail: {
            src: '/images/kiosk-images/Helix_Log3-2.png',
            alt: 'ECCE distribution histogram with mean call-out',
          },
        },
      ],
    },
    // Slide 4 — Ultrasonic / Sonic CX9 run pushed to 90° deviation.
    {
      type: 'annotated',
      src: '/images/kiosk-images/Helix_Log4.png',
      annotations: [
        {
          tone: 'blue',
          title: 'CX9: Ultrasonic / Sonic to 90° deviation in 9-5/8" / 7"',
          bullets: [
            'Excellent ECCE with high DLS where the well is building',
            'Excellent ECCE at high deviations',
            'ECCE well within limit of 7" and 9-5/8" tolerance levels',
            'TT overlaying TTSL in both 7" and 9-5/8" over the whole deviation from 0 to 90°',
          ],
          circles: [],
        },
      ],
    },
    // Slide 5 — CX13 Ultrasonic to 77° in 13-3/8" with drag + ECCE
    // histograms. Two annotation cards stack vertically in the right
    // column; the detail histograms are tap-to-zoom so the cards stay
    // short enough to fit without scrolling.
    {
      type: 'annotated',
      src: '/images/kiosk-images/Helix_Log5-1.png',
      annotations: [
        {
          tone: 'blue',
          title: 'Very low ECCE, mainly unaffected by DLS',
          bullets: ['Average of 0.06'],
          circles: [],
          detail: {
            src: '/images/kiosk-images/Helix_Log5-3.png',
            alt: 'LUP1:ECCE distribution histogram with mean call-out',
          },
        },
        {
          tone: 'blue',
          title: 'Very stable drag of 0.15',
          bullets: ['Getting to 80° deviation is easily achievable'],
          circles: [],
          detail: {
            src: '/images/kiosk-images/Helix_Log5-2.png',
            alt: 'AvDrag distribution histogram with mean call-out',
          },
        },
      ],
    },
    // The standalone Ultrasonic-CBL setup image used to live here as a
    // trailing single-image slide. Dropped in May 2026 — it wasn't
    // adding new info beyond what the annotated case studies already
    // cover.
  ],
};

export const ROCKER_LOGS: LogsConfig = {
  title: 'Rocker',
  trackRecord: {
    system: 'Focus - CH',
    enableSuccessStories: true,
  },
  slides: [
    { type: 'map' },
    // Slide 1 — Rocker run with USIT in a 4-1/2" liner. Excellent
    // centralisation taken all the way out to 70° deviation; the
    // headline is the centralisation result (blue), with a red sub-
    // bullet flagging the 0.15" tolerance ceiling.
    {
      type: 'annotated',
      src: '/images/kiosk-images/Rocker_Log1.png',
      annotations: [
        {
          eyebrow: 'Rocker: USIT in 4-1/2" Liner',
          tone: 'blue',
          title: 'Excellent Centralization to 70° deviation',
          bullets: [
            'Rockers not overloaded',
            'Average Centralization < 0.1"',
            { text: 'Limit of 0.15"', indent: true, tone: 'red' },
          ],
          circles: [],
        },
      ],
    },
  ],
};
