import type { Lane } from '@modules/catalog/data/deviceSpecs';

export interface FeaturedSystem {
  /** Display name. Must match a key in `systemMedia` and the `system` field
   *  on at least one entry in `deviceSpecs`. */
  name: string;
  /** Which kiosk lane this system tile appears in. */
  lane: Lane;
}

/**
 * Systems shown on the kiosk product-lines screen, grouped by Open Hole / Cased Hole.
 *
 * The kiosk flow is: splash → lane chooser → productlines?lane=oh|ch → modal.
 * The productlines page filters this list by the active lane.
 */
export const FEATURED_SYSTEMS: FeaturedSystem[] = [
  // Open hole
  { name: 'Wireline Express', lane: 'oh' },
  { name: 'PathFinder', lane: 'oh' },
  { name: 'Focus', lane: 'oh' },
  { name: 'Thor', lane: 'oh' },

  // Cased hole
  { name: 'Helix', lane: 'ch' },
  { name: 'Rocker', lane: 'ch' },
];

/** Back-compat alias — string[] of system names, no lane. */
export const featuredSystems: string[] = FEATURED_SYSTEMS.map((s) => s.name);

/** Helper for callers that want only one lane's systems. */
export function featuredSystemsForLane(lane: Lane): string[] {
  return FEATURED_SYSTEMS.filter((s) => s.lane === lane).map((s) => s.name);
}
