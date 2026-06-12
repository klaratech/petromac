import type { Lane } from '@/features/catalog/deviceSpecs';

export interface FeaturedSystem {
  /** Display name. Must match a key in `systemMedia` and the `system` field
   *  on at least one entry in `deviceSpecs`. */
  name: string;
  /** Which kiosk lane this system tile appears in. */
  lane: Lane;
}

/**
 * Systems shown on the legacy kiosk product-lines tile grid, grouped by
 * Open Hole / Cased Hole.
 *
 * The main kiosk flow is now: splash → lane chooser → `/lane?lane=oh|ch`
 * (looping attractor video + right-side overlay buttons) → tap an overlay
 * to open that product's experience. `/productlines?lane=oh|ch` still
 * renders this tile grid for direct links / fallback, but is no longer
 * part of the main flow. See `docs/KIOSK.md`.
 */
export const FEATURED_SYSTEMS: FeaturedSystem[] = [
  // Open hole
  { name: 'Wireline Express', lane: 'oh' },
  { name: 'PathFinder', lane: 'oh' },
  { name: 'Focus', lane: 'oh' },
  { name: 'Thor', lane: 'oh' },

  // Cased hole — single Focus Centralizers tile (Helix + Rocker live inside
  // its experience, with Rocker as a corner badge). "Other CH" is a slot for
  // future cased-hole product families.
  { name: 'Focus Centralizers', lane: 'ch' },
  { name: 'Other CH', lane: 'ch' },
];

/** Back-compat alias — string[] of system names, no lane. */
export const featuredSystems: string[] = FEATURED_SYSTEMS.map((s) => s.name);

/** Helper for callers that want only one lane's systems. */
export function featuredSystemsForLane(lane: Lane): string[] {
  return FEATURED_SYSTEMS.filter((s) => s.lane === lane).map((s) => s.name);
}
