import type { CaseStudy } from './index';

/**
 * SEO titles for the 46 success-story pages — the `<title>`/OG title ONLY.
 * The visible H1 stays the story's real headline; this map exists because
 * 44 of 46 headlines blow the 60-char SERP budget once the root template
 * appends " | Petromac" (worst was 125 chars — Aug 2026 GSC audit).
 *
 * Same pattern as the catalog's PRODUCT_TITLES: editing a row changes the
 * tab/SERP title and nothing on the page.
 *
 * Rules (docs/VOCABULARY_MAP.md):
 *   - base ≤ 49 chars (the template's " | Petromac" brings it to ≤60)
 *   - un-branded (no "Petromac", no ™ — the suffix brands it once)
 *   - keep the story's hook: the number, the tool, the place
 *
 * A unit test enforces both rules and requires an entry for every story —
 * a new edition's stories fail the build until someone writes their titles,
 * exactly like NEW_SLUG in the build script.
 */
export const STORY_TITLES: Record<string, string> = {
  'high-side-sampling': 'High-side pretesting: 20x permeability, Vietnam',
  'formation-testing-5000psi-overbalance': '5,000 psi overbalance sampling, Gulf of Mexico',
  'expanding-logging-program': 'Wireline logging in difficult Kuwait boreholes',
  'holefinder-success-in-azerbaijan-2': 'Holefinder saves millions for Azerbaijan operator',
  'tlc-unable-to-pass-ledge': 'Ledge that stopped drill-pipe logging in Iraq',
  'successful-open-hole-wireline-logging-to-79-deviation-in-uae':
    'Open-hole wireline logging to 79° in UAE',
  'sonic-centralization': 'Array Sonic centralized on Tool Taxi wheels, UAE',
  'stick-slip': 'Eliminating CMR stick-slip in UAE',
  'image-tool-rotation': 'Preventing OBMI image rotation in Trinidad',
  'oriented-coring-avoids-wellbore-damage-in-the-gulf-of-mexico':
    'Wellbore-safe oriented coring, Gulf of Mexico',
  'elimination-of-pcl-saves-8-days-of-rig-time-in-mexico':
    'Eliminating PCL saves 8 rig days in Mexico',
  'positive-orientation-provides-100-fmi-image-coverage-in-iraq':
    '100% FMI image coverage via orientation, Iraq',
  'ngi-logged-over-2400m-section-at-67-deviation-in-new-zealand':
    'NGI logs 2,400 m at 67° deviation, New Zealand',
  'smooth-mril-xl-logging-at-extreme-deviations-in-mexico':
    'Smooth MRIL-XL at extreme deviation in Mexico',
  'cast-cbl-successfully-deployed-to-82-deviation-in-norway':
    'CAST-CBL deployed to 82° deviation in Norway',
  'hermes-drag-planner-convinces-client-to-run-mdt-in-nigeria':
    'Hermes drag planner wins MDT run in Nigeria',
  'high-quality-x-y-density-data-in-deviated-wellbores-in-new-zealand':
    'X-Y density data in deviated wells, New Zealand',
  'slim-tool-taxis-facilitate-logging-a-highly-deviated-6-hole-section-on-wireline':
    'World record: 6” wireline logging to 72°, Kuwait',
  'cement-evaluation-without-gemco-centralizers-to-85-deviation-in-ksa':
    'Centralizer-free cement evaluation to 85°, KSA',
  'oriented-hrsct-optimum-sidewall-core-recovery-in-mexico':
    'Oriented HRSCT sidewall core recovery in Mexico',
  'mril-d-conveyance-in-highly-deviated-casings-in-malaysia':
    'MRIL-D in highly deviated casings, Malaysia',
  'world-record-20kft-tractoring-with-cement-evaluation-tool-in-ksa':
    'World record 20kft+ tractor cement logging, KSA',
  'world-record-longest-open-hole-tractor-logging-operation-in-ksa':
    'World record open-hole tractor logging in KSA',
  'supercombo-on-wireline-saves-over-20-hours-of-rig-time-in-ksa':
    'SuperCombo saves 20+ hours of rig time in KSA',
  'tractor-assist-of-super-combos-replaces-drill-pipe-conveyance-in-ksa':
    'Tractor SuperCombo replaces drill pipe, KSA',
  'cbl-descends-2500m-tangent-at-67-degrees-in-mexico':
    'CBL descends 2,500 m tangent at 67° in Mexico',
  'pathfinder-success-story-new-zealand': 'PathFinder – A success story from New Zealand',
  'high-performance-equipment-ultra-low-drag-in-angola':
    'Ultra-low drag logging equipment in Angola',
  'oriented-sidewall-coring-avoids-wellbore-damage-in-oman':
    'Oriented sidewall coring recovery gains in Oman',
  '18-inch-washout-navigated-in-vertical-well-in-peru':
    '18” washout navigated in vertical Peru well',
  '27-hours-rig-time-saved-differential-sticking-prevented-in-kuwait':
    '27 rig hours saved on 3,700 psi well, Kuwait',
  'rocker-deploys-ultrasonic-cement-imaging-through-inaccessible-completions-in-ksa':
    'Rocker deploys ultrasonic cement imaging, KSA',
  'efficient-logging-saves-38-hours-of-rig-time-in-ksa':
    'Advanced conveyance saves ~38 rig hours in KSA',
  'reliable-wireline-packer-deployment-in-complex-completions':
    'Wireline packers in complex completions',
  'pathfinder-cost-effective-data-acquisition-in-ccs':
    'Pathfinder: cost-effective CCS data acquisition',
  'petromac-proven-in-carbon-capture': 'Wireline conveyance proven in carbon capture',
  'high-quality-imaging-in-demanding-offshore-wells':
    'High-quality imaging in demanding offshore wells',
  'reliable-data-acquisition-in-200c-geothermal-wells':
    'Reliable logging in >200°C geothermal wells',
  'data-and-sample-acquisition-in-fractured-washed-out-wells':
    'Data and sampling in fractured, washed-out wells',
  'compact-reliable-centralization-for-high-resolution-imaging':
    'Compact centralization for high-res imaging',
  'helix-centraliser-cement-evaluation-through-tight-restrictions':
    'Helix CX9 cement logs through tight restrictions',
  'critical-data-acquisition-in-a-research-well': 'Critical data acquisition in a research well',
  'tool-taxis-and-pathfinder-gravity-descent-in-guyana': 'Gravity descent in deviated Guyana wells',
  'eliminate-toolstring-hold-up-on-severe-rathole-ledges':
    'Ending toolstring hold-up on rathole ledges',
  'ora-cmr-orientation-reduces-cable-damage-risk-on-tlc-in-guyana':
    'ORA-CMR orientation cuts cable risk, Guyana',
  'ultra-low-drag-centralization-720k-cost-savings-cement-evaluation':
    '$720k saved on cement evaluation campaign',
};

/** The page's SEO title: the curated short title, or the headline for any
 *  story the map has not covered yet (the unit test makes that a build
 *  failure, so the fallback only ever runs mid-edit). */
export function storyTitle(cs: Pick<CaseStudy, 'slug' | 'title'>): string {
  return STORY_TITLES[cs.slug] ?? cs.title;
}
