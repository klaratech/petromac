'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * useAutoHideHud — manage a kiosk HUD's "reveal then fade after N ms"
 * pattern.
 *
 * Each kiosk product experience (Helix, Rocker, lane attractors) has the
 * same shape: when the inner view returns
 * to `'main'`, the HUD pops in and an idle timer fades it back out
 * after a few seconds unless interaction resets it. The hook bundles:
 *
 *   - `hudVisible` — drive opacity classes on the HUD elements
 *   - `handleTap`  — wire to onClick / onTouchStart / onMouseMove on
 *                    the main view to re-reveal and re-arm the timer
 *
 * Pass `active=false` whenever the HUD should NOT auto-arm (e.g. when
 * the experience is showing a sub-view such as Track Record). The hook
 * becomes a no-op until `active` flips back to true; both the timer
 * and `handleTap` ignore taps while inactive.
 *
 * Typical usage:
 *
 *   const { hudVisible, handleTap } = useAutoHideHud(view === 'main', 3200);
 *
 *   return (
 *     <div onClick={handleTap} onTouchStart={handleTap} onMouseMove={handleTap}>
 *       <button className={`... ${hudVisible ? 'opacity-100' : 'opacity-0'}`}>
 *         ...
 *       </button>
 *     </div>
 *   );
 */
export function useAutoHideHud(
  active: boolean,
  autoHideMs: number,
): { hudVisible: boolean; handleTap: () => void } {
  const [hudVisible, setHudVisible] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hold autoHideMs in a ref so callbacks always read the latest value
  // even if the prop changes mid-mount. (None of the current callers
  // change it after mount, but this future-proofs the hook.)
  const autoHideMsRef = useRef(autoHideMs);
  useEffect(() => {
    autoHideMsRef.current = autoHideMs;
  }, [autoHideMs]);

  // Arm the fade-out timer. Idempotent — re-calling clears the previous
  // timer first so taps in quick succession don't queue multiple hides.
  const scheduleHide = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(
      () => setHudVisible(false),
      autoHideMsRef.current,
    );
  };

  useEffect(() => {
    if (!active) return;
    setHudVisible(true);
    scheduleHide();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [active]);

  const handleTap = () => {
    if (!active) return;
    setHudVisible(true);
    scheduleHide();
  };

  return { hudVisible, handleTap };
}
