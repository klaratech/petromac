'use client';

import { useRouter } from 'next/navigation';
import HelixExperience from '@/components/kiosk/HelixExperience';
import { KIOSK_HOME_PATH } from '@/constants/app';

/**
 * Cased Hole entry point — collapsed into a single page that mounts the
 * Helix experience view directly.
 *
 * The old CH lane attractor (`/intranet/kiosk/lane?lane=ch`) was a near-
 * identical preview of this same Helix video with a different button
 * strip, so tapping "Helix" on the lane felt like a non-event. Collapsing
 * the lane removes one redundant hop and one duplicated video decode.
 *
 * - Tapping the in-experience ✕ closes back to the splash.
 * - No idle bounce. The kiosk stays on the looping Helix video
 *   indefinitely until staff explicitly close back to the splash —
 *   matches the OH lane attractor, which also runs forever without
 *   timing out to the splash on idle.
 *
 * Rocker access stays where it already was: the corner badge inside the
 * Helix experience. "Other CH" is parked until content is ready.
 */

export default function CasedHolePage() {
  const router = useRouter();

  return (
    <HelixExperience
      onClose={() => router.push(KIOSK_HOME_PATH)}
    />
  );
}
