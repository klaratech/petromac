'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FocusCentralizersExperience from '@/components/kiosk/FocusCentralizersExperience';
import { KIOSK_HOME_PATH } from '@/constants/app';

/**
 * Cased Hole entry point — collapsed into a single page that mounts the
 * Helix (FocusCentralizersExperience) view directly.
 *
 * The old CH lane attractor (`/intranet/kiosk/lane?lane=ch`) was a near-
 * identical preview of this same Helix video with a different button
 * strip, so tapping "Helix" on the lane felt like a non-event. Collapsing
 * the lane removes one redundant hop and one duplicated video decode.
 *
 * - Tapping the in-experience ✕ closes back to the splash.
 * - 5 minutes of no activity bounces back to the splash too, so a kiosk
 *   left untouched after a customer walks away returns to the welcome
 *   screen rather than sitting on a sub-view forever. Mirrors the idle
 *   timer that the OH lane keeps.
 *
 * Rocker access stays where it already was: the corner badge inside the
 * Helix experience. "Other CH" is parked until content is ready (was a
 * coming-soon placeholder before — dropped entirely to keep the surface
 * focused).
 */
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 min — same as the OH lane

export default function CasedHolePage() {
  const router = useRouter();

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    const reset = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.push(KIOSK_HOME_PATH), IDLE_TIMEOUT_MS);
    };
    reset();
    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'touchstart',
      'keydown',
    ];
    events.forEach((e) => window.addEventListener(e, reset));
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [router]);

  return (
    <FocusCentralizersExperience
      onClose={() => router.push(KIOSK_HOME_PATH)}
    />
  );
}
