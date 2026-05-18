'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import OverlayExperience, {
  type OverlayExperienceConfig,
} from '@/components/kiosk/OverlayExperience';
import { getKioskPrimeMode } from '@/hooks/useKioskDisplay';
import { useKioskVideos } from '@/hooks/useKioskVideo';
import { KIOSK_CH_PATH } from '@/constants/app';

const OVERLAY_AUTOHIDE = 4_000; // hide the overlay buttons after this idle gap (was 5_000; -20% May 2026)
const ACTIVE_IDLE_TIMEOUT = 5 * 60 * 1000; // close an open experience after 5 min idle

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
 * Per-lane attractor playlist. Plays fullscreen with audio, on loop behind
 * the overlay button strip. All clips carry their narration / subtitled
 * audio track. `dice.mp4` is an intro sting with a silent audio track.
 */
const LANE_PLAYLIST: Record<Lane, string[]> = {
  oh: [
    '/videos/transcoded/dice.mp4',
    '/videos/transcoded/WirelineExpress-subtitled.mp4',
    '/videos/transcoded/pf-subtitled.mp4',
    '/videos/transcoded/differential-sticking-subtitled.mp4',
  ],
};

/**
 * What an overlay button opens. OH uses the generic `OverlayExperience`
 * scaffold (Helix pattern) for every product tile.
 */
type ActiveExperience = { type: 'overlay'; config: OverlayExperienceConfig };

interface OverlayItem {
  key: string;
  label: string;
  open: ActiveExperience;
}

/**
 * Overlay buttons are the SAME for every clip in a lane — they don't change
 * with whichever video happens to be playing.
 */
const LANE_OVERLAY: Record<Lane, OverlayItem[]> = {
  oh: [
    {
      key: 'formation-testing',
      label: 'Formation Testing',
      // Track Record + Success Stories are wired to live data. Mechanism /
      // Logs are real screens with asset-slot placeholders — drop files at
      // the paths below and they fill in.
      open: {
        type: 'overlay',
        config: {
          laneLabel: 'Open Hole',
          title: 'Formation Testing',
          subtitle: 'Differential Sticking',
          video: '/videos/transcoded/differential-sticking-subtitled.mp4',
          // Operations data tags these jobs "Wireline Express - FT".
          trackRecordSystem: 'Wireline Express - FT',
          enableSuccessStories: true,
          mechanism: {
            title: 'Formation Testing',
            slides: [
              {
                type: 'video',
                label: 'Conventional mechanism',
                src: '/videos/transcoded/conventional-formation-testing.mp4',
              },
              {
                type: 'video',
                label: 'Petromac mechanism',
                src: '/videos/transcoded/formation-testing-mechanism.mp4',
                highlight: true,
              },
            ],
          },
          logs: {
            title: 'Formation Testing',
            slides: [
              {
                type: 'single',
                src: '/images/formation-testing-logs-1.png',
                caption: 'Formation testing log comparison',
              },
            ],
          },
        },
      },
    },
    {
      key: 'high-deviation',
      label: 'High Deviation',
      open: {
        type: 'overlay',
        config: {
          laneLabel: 'Open Hole',
          title: 'High Deviation',
          video: '/videos/transcoded/WirelineExpress-subtitled.mp4',
          // Prefix-matches "Wireline Express" (also includes the "- FT" jobs).
          trackRecordSystem: 'Wireline Express',
          enableSuccessStories: true,
          mechanism: {
            title: 'High Deviation',
            slides: [
              {
                type: 'video',
                label: 'Conventional mechanism',
                src: '/videos/transcoded/conventional-high-deviation.mp4',
              },
              {
                type: 'video',
                label: 'Wireline Express mechanism',
                src: '/videos/transcoded/high-deviation-mechanism.mp4',
                highlight: true,
              },
            ],
          },
          logs: {
            title: 'High Deviation',
            slides: [
              {
                type: 'single',
                src: '/images/high-deviation-logs-1.png',
                caption: 'High deviation log comparison',
              },
            ],
          },
        },
      },
    },
    // Data Quality dropped May 2026 — overlapped with High Deviation
    // (same trackRecordSystem: 'Wireline Express'), leaving OH at three
    // buttons to match the CH lane strip.
    {
      key: 'pathfinder',
      label: 'Pathfinder',
      open: {
        type: 'overlay',
        config: {
          laneLabel: 'Open Hole',
          title: 'Pathfinder',
          subtitle: 'Pathfinder HT',
          video: '/videos/transcoded/pf-subtitled.mp4',
          trackRecordSystem: 'PathFinder',
          enableSuccessStories: true,
          mechanism: {
            title: 'Pathfinder',
            slides: [
              {
                type: 'video',
                label: 'Conventional mechanism',
                src: '/videos/transcoded/conventional-holefinding.mp4',
              },
              {
                type: 'video',
                label: 'Pathfinder HT mechanism',
                src: '/videos/transcoded/pathfinder-mechanism.mp4',
                highlight: true,
              },
            ],
          },
          logs: {
            title: 'Pathfinder',
            slides: [
              {
                type: 'single',
                src: '/images/pathfinder-logs-1.png',
                caption: 'Pathfinder log comparison',
              },
            ],
          },
        },
      },
    },
  ],
};

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

  // Prefers /videos/kiosk-hd/ clips when present, falls back to transcoded.
  const playlist = useKioskVideos(LANE_PLAYLIST[lane]);
  const overlayItems = LANE_OVERLAY[lane];

  const [videoIdx, setVideoIdx] = useState(0);
  const [active, setActive] = useState<ActiveExperience | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const primeMode = getKioskPrimeMode();
  // Pointer-inside is a ref (not state) so we can read the latest value
  // inside revealOverlay without re-creating the callback on every change.
  const pointerInsideRef = useRef(false);
  // Ref to the lane attractor <video> so we can pause it when an experience
  // is open — running two video decoders in parallel on the Android tablet
  // is wasted CPU, and the attractor's audio would bleed under the
  // experience's own clip.
  const attractorRef = useRef<HTMLVideoElement | null>(null);

  // Skip the auto-hide timer while the cursor is over the lane. On
  // desktop this keeps the strip visible the whole time you're hovering;
  // on touch (where mouseenter / mouseleave don't fire reliably for taps)
  // the timer still runs as before.
  const scheduleAutoHide = useCallback(() => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    if (pointerInsideRef.current) return;
    overlayTimerRef.current = setTimeout(
      () => setOverlayVisible(false),
      OVERLAY_AUTOHIDE,
    );
  }, []);

  // Overlay buttons stay hidden over the video and surface on hover / tap.
  const revealOverlay = useCallback(() => {
    setOverlayVisible(true);
    scheduleAutoHide();
  }, [scheduleAutoHide]);

  const handleMouseEnter = useCallback(() => {
    pointerInsideRef.current = true;
    setOverlayVisible(true);
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
  }, []);

  const handleMouseLeave = useCallback(() => {
    pointerInsideRef.current = false;
    scheduleAutoHide();
  }, [scheduleAutoHide]);

  // Show briefly on arrival (and whenever an experience closes) so staff
  // know the buttons are there, then auto-hide (unless mouse is hovering).
  useEffect(() => {
    if (!active) revealOverlay();
    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, [active, revealOverlay]);

  const closeExperience = useCallback(() => setActive(null), []);

  // Pause / resume the lane attractor video as the experience layer opens
  // and closes. Frees the second video decoder on the Android tablet and
  // silences the attractor's audio while the experience plays.
  //
  // videoIdx is in the deps so the pause re-applies if the playlist
  // advances mid-experience (the <video> remounts via `key={playlist[idx]}`
  // and would otherwise autoplay the fresh element).
  useEffect(() => {
    const v = attractorRef.current;
    if (!v) return;
    if (active) {
      v.pause();
    } else {
      // play() can reject if user activation has lapsed — swallow it; the
      // browser will keep showing the last frame and a tap will resume.
      v.play().catch(() => {});
    }
  }, [active, videoIdx]);

  // While an experience is open, bounce back to the lane loop after a few
  // minutes of no interaction. Any mouse / touch / key activity resets the
  // timer. When `active` returns to null the cleanup clears it.
  useEffect(() => {
    if (!active) return;

    let timer: NodeJS.Timeout | undefined;
    const reset = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setActive(null), ACTIVE_IDLE_TIMEOUT);
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
  }, [active]);

  return (
    <div
      className="relative w-full h-screen bg-black overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={revealOverlay}
      onClick={revealOverlay}
      onTouchStart={revealOverlay}
    >
      {/* Looping attractor playlist — plays the lane's clips end to end and
          repeats indefinitely; the kiosk stays in this lane.
          Audio is enabled (narration / subtitled clips). The kiosk runs Chrome
          with `--autoplay-policy=no-user-gesture-required` so the first load
          can play with sound; subsequent loads inherit user activation from
          the splash → lane navigation. */}
      <video
        ref={attractorRef}
        key={playlist[videoIdx]}
        src={playlist[videoIdx]}
        autoPlay={!primeMode}
        muted={primeMode}
        preload="metadata"
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        onEnded={() => setVideoIdx((i) => (i + 1) % playlist.length)}
      />
      {/* Dim so overlay buttons stay readable over bright frames */}
      <div className="absolute inset-0 bg-black/35 z-0 pointer-events-none" />

      {/* Overlay button strip — right edge, vertical and deliberately
          subtle. Always mounted, fades in/out via CSS opacity. When
          collapsed it also disables pointer events so the user can
          click through to the lane attractor. No backdrop-blur — the
          mirror encoder paid for that per-frame composite. The
          slightly bumped bg-black/40 keeps the buttons readable over
          bright frames without it. */}
      <div
        className={`absolute top-1/2 right-3 -translate-y-1/2 z-20 flex flex-col gap-2 transition-opacity duration-300 ${
          overlayVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {overlayItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActive(item.open)}
            className="px-3 py-2 rounded-lg bg-black/40 hover:bg-black/70 border border-white/10 text-white/70 hover:text-white text-xs font-medium tracking-wide transition-colors"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Playlist controls — small prev/next pair + position dots. Lets
          the user skip ahead or back to a particular clip in the OH
          loop without waiting for the current one to finish. Fades with
          the right-edge product button strip; the underlying <video> is
          keyed on `playlist[videoIdx]` so changing the index remounts
          the element and autoplay fires the fresh clip from the start. */}
      {playlist.length > 1 && (
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2 py-1.5 rounded-full bg-black/55 border border-white/10 shadow-lg transition-opacity duration-300 ${
            overlayVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setVideoIdx((i) => (i - 1 + playlist.length) % playlist.length);
            }}
            aria-label="Previous video"
            className="w-8 h-8 flex items-center justify-center rounded-full text-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            ‹
          </button>
          <div className="flex items-center gap-1.5 px-2" aria-hidden="true">
            {playlist.map((src, i) => (
              <button
                key={src}
                onClick={(e) => {
                  e.stopPropagation();
                  setVideoIdx(i);
                }}
                aria-label={`Jump to clip ${i + 1}`}
                className={`block w-1.5 h-1.5 rounded-full transition-colors ${
                  i === videoIdx
                    ? 'bg-white'
                    : 'bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setVideoIdx((i) => (i + 1) % playlist.length);
            }}
            aria-label="Next video"
            className="w-8 h-8 flex items-center justify-center rounded-full text-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            ›
          </button>
        </div>
      )}

      {/* Active experience layer — conditional render, no transition
          wrapper. The FullScreenLayer inside OverlayExperience handles
          its own mount (snap to fixed inset-0 z-50 bg-black). */}
      {active?.type === 'overlay' && (
        <OverlayExperience
          key={active.config.title}
          config={active.config}
          onClose={closeExperience}
        />
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
