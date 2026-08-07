'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getKioskPrimeMode } from '@/hooks/useKioskDisplay';
import { KIOSK_CH_PATH, KIOSK_DASHBOARD_PATH } from '@/constants/app';

const OVERLAY_AUTOHIDE = 4_000; // hide the controls after this idle gap

/**
 * The lane attractor is now OH-only — CH collapsed into its own route
 * (`/intranet/kiosk/ch`) that mounts the Helix experience directly. The
 * type stays string-narrow in case OH ever sprouts a sibling, but `'ch'`
 * is no longer a valid runtime value here; if it shows up in the query
 * param we redirect to KIOSK_CH_PATH below.
 */
type Lane = 'oh';

function isLane(value: string | null): value is Lane {
  return value === 'oh';
}

/**
 * Per-lane attractor playlist. Plays fullscreen with audio, on loop.
 * `dice.mp4` is a short silent intro sting that auto-rolls between the
 * three narrated clips but is NOT a user-navigable target — the
 * prev/next chevrons + dots only step among the narrated clips below.
 */
const DICE_CLIP = '/videos/transcoded/dice.mp4';

const LANE_PLAYLIST: Record<Lane, string[]> = {
  oh: [
    DICE_CLIP,
    '/videos/transcoded/WirelineExpress-subtitled.mp4',
    '/videos/transcoded/pf-subtitled.mp4',
    '/videos/transcoded/differential-sticking-subtitled.mp4',
  ],
};

/** Treat the dice intro as a non-navigable interstitial. Basename match
 *  rather than full path so a cache-busting query or a future folder move
 *  cannot silently turn the sting into a navigable slide. */
function isDice(src: string): boolean {
  return src.endsWith('/dice.mp4');
}

function LaneLoopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const laneParam = searchParams.get('lane');

  // Backward-compat redirect: anyone still hitting `/lane?lane=ch` from a
  // bookmark or shortcut bounces over to the new CH route. Falls back to
  // OH for any other unknown value so the screen never sits blank.
  useEffect(() => {
    if (laneParam === 'ch') router.replace(KIOSK_CH_PATH);
  }, [laneParam, router]);

  const lane: Lane = isLane(laneParam) ? laneParam : 'oh';

  const playlist = LANE_PLAYLIST[lane];

  const [videoIdx, setVideoIdx] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const primeMode = getKioskPrimeMode();

  // Indexes of narrated (non-dice) clips. The prev/next chevrons and the
  // position dots both operate on this subset; dice still rolls inline
  // as the natural intro between cycles but isn't a user-pickable target.
  const navIndexes = playlist.reduce<number[]>((acc, src, i) => {
    if (!isDice(src)) acc.push(i);
    return acc;
  }, []);
  const currentNavIdx = navIndexes.indexOf(videoIdx); // -1 while dice plays

  const goPrev = useCallback(() => {
    if (navIndexes.length === 0) return;
    const target =
      currentNavIdx < 0
        ? navIndexes[navIndexes.length - 1]
        : navIndexes[(currentNavIdx - 1 + navIndexes.length) % navIndexes.length];
    if (target !== undefined) setVideoIdx(target);
  }, [currentNavIdx, navIndexes]);

  const goNext = useCallback(() => {
    if (navIndexes.length === 0) return;
    const target =
      currentNavIdx < 0
        ? navIndexes[0]
        : navIndexes[(currentNavIdx + 1) % navIndexes.length];
    if (target !== undefined) setVideoIdx(target);
  }, [currentNavIdx, navIndexes]);

  // Auto-hide the prev/next strip after OVERLAY_AUTOHIDE of no interaction.
  //
  // The old implementation pinned the strip while the cursor was "inside"
  // the lane element. That was meant as a desktop convenience but actively
  // broke on the kiosk: Android Chrome fires `mouseenter` once on the first
  // touch, and the matching `mouseleave` never fires (the lane is fullscreen
  // so there's no edge to leave). Result was a stuck `pointerInside === true`
  // that disabled the timer permanently after the first tap. Now the timer
  // is unconditional — devs on desktop refresh it by tapping/moving the
  // same way a kiosk user would.
  const scheduleAutoHide = useCallback(() => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = setTimeout(
      () => setOverlayVisible(false),
      OVERLAY_AUTOHIDE,
    );
  }, []);

  // Controls stay hidden over the video and surface on hover / tap.
  const revealOverlay = useCallback(() => {
    setOverlayVisible(true);
    scheduleAutoHide();
  }, [scheduleAutoHide]);

  // Reveal on mount, then auto-hide.
  useEffect(() => {
    revealOverlay();
    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, [revealOverlay]);

  return (
    <div
      className="relative w-full h-screen bg-black overflow-hidden"
      onMouseMove={revealOverlay}
      onClick={revealOverlay}
      onTouchStart={revealOverlay}
    >
      {/* Looping attractor playlist — plays the lane's clips end to end and
          repeats indefinitely; the kiosk stays in this lane.
          Audio is enabled (narration / subtitled clips). The kiosk runs
          Chrome with `--autoplay-policy=no-user-gesture-required` so the
          first load can play with sound; subsequent loads inherit user
          activation from the splash → lane navigation. */}
      {/* Native browser controls (play/pause, scrub, volume, fullscreen) on
          the narrated clips so attendees can pause / replay during a demo.
          The dice intro is a silent interstitial so we keep its chrome off
          — it's not user-navigable per the prev/next strip below either. */}
      <video
        key={playlist[videoIdx]}
        src={playlist[videoIdx]}
        autoPlay={!primeMode}
        muted={primeMode}
        controls={!isDice(playlist[videoIdx] ?? '')}
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        preload="metadata"
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        onEnded={() => setVideoIdx((i) => (i + 1) % playlist.length)}
      />
      {/* Dim so controls stay readable over bright frames */}
      <div className="absolute inset-0 bg-black/35 z-0 pointer-events-none" />

      {/* Track Record shortcut — small pill at top-center that fades with
          the same 4 s auto-hide as the bottom prev/next strip. Visible on
          every clip in the OH playlist (including dice) so a presenter can
          jump straight to the operations map without backing out to the
          splash. */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          router.push(KIOSK_DASHBOARD_PATH);
        }}
        aria-label="Open Track Record map"
        className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 border border-white/10 text-white/85 hover:text-white hover:bg-black/75 text-xs font-medium tracking-wide shadow-lg transition-opacity duration-300 ${
          overlayVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Inline pin icon — same style as the splash's prime SVG so the
            lane chrome stays lucide-react-free. */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-3.5 w-3.5"
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>Track Record</span>
      </button>

      {/* Playlist controls — small prev/next chevrons + one dot per
          narrated clip (dice excluded). When dice is playing, no dot is
          highlighted; tapping next/prev jumps to the first/last
          narrated clip. The underlying <video> is keyed on
          `playlist[videoIdx]` so changing the index remounts the
          element and autoplay fires the fresh clip from the start. */}
      {navIndexes.length > 1 && (
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2 py-1.5 rounded-full bg-black/55 border border-white/10 shadow-lg transition-opacity duration-300 ${
            overlayVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Previous video"
            className="w-8 h-8 flex items-center justify-center rounded-full text-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            ‹
          </button>
          <div className="flex items-center gap-1.5 px-2">
            {navIndexes.map((idx, navI) => (
              <button
                key={playlist[idx]}
                onClick={(e) => {
                  e.stopPropagation();
                  setVideoIdx(idx);
                }}
                aria-label={`Jump to clip ${navI + 1}`}
                className={`block w-1.5 h-1.5 rounded-full transition-colors ${
                  idx === videoIdx
                    ? 'bg-white'
                    : 'bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next video"
            className="w-8 h-8 flex items-center justify-center rounded-full text-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

export default function LaneClient() {
  return (
    <Suspense fallback={null}>
      <LaneLoopContent />
    </Suspense>
  );
}
