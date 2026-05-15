'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import FocusCentralizersExperience from '@/components/kiosk/FocusCentralizersExperience';
import RockerExperience from '@/components/kiosk/ch/RockerExperience';
import OverlayExperience, {
  type OverlayExperienceConfig,
} from '@/components/kiosk/OverlayExperience';
import { useKioskVideos } from '@/hooks/useKioskVideo';

const OVERLAY_AUTOHIDE = 5_000; // hide the overlay buttons after this idle gap

type Lane = 'oh' | 'ch';

function isLane(value: string | null): value is Lane {
  return value === 'oh' || value === 'ch';
}

/**
 * Per-lane attractor playlist. Plays fullscreen, muted, on loop behind the
 * overlay button strip. Subtitled clips are used where they exist; `dice.mp4`
 * and `WirelineExpress.mp4` have no subtitled master so they play as-is.
 */
const LANE_PLAYLIST: Record<Lane, string[]> = {
  oh: [
    '/videos/transcoded/dice.mp4',
    '/videos/transcoded/WirelineExpress.mp4',
    '/videos/transcoded/pf-subtitled.mp4',
    '/videos/transcoded/differential-sticking-subtitled.mp4',
  ],
  ch: [
    '/videos/transcoded/dice.mp4',
    '/videos/transcoded/helix-subtitled.mp4',
  ],
};

/**
 * What an overlay button opens. The CH lane reuses the existing experiences;
 * the OH lane uses the generic `OverlayExperience` scaffold (Helix pattern).
 */
type ActiveExperience =
  | { type: 'focus-centralizers' }
  | { type: 'rocker' }
  | { type: 'ch-other' }
  | { type: 'overlay'; config: OverlayExperienceConfig };

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
            panes: [
              {
                label: 'Conventional',
                src: '/videos/transcoded/conventional-formation-testing.mp4',
              },
              {
                label: 'Petromac',
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
          video: '/videos/transcoded/WirelineExpress.mp4',
          // Prefix-matches "Wireline Express" (also includes the "- FT" jobs).
          trackRecordSystem: 'Wireline Express',
          enableSuccessStories: true,
          mechanism: {
            title: 'High Deviation',
            panes: [
              {
                label: 'Conventional',
                src: '/videos/transcoded/conventional-high-deviation.mp4',
              },
              {
                label: 'Wireline Express',
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
    {
      key: 'data-quality',
      label: 'Data Quality',
      open: {
        type: 'overlay',
        config: {
          laneLabel: 'Open Hole',
          title: 'Data Quality',
          video: '/videos/transcoded/WirelineExpress.mp4',
          trackRecordSystem: 'Focus - OH',
          enableSuccessStories: true,
          mechanism: {
            title: 'Data Quality',
            panes: [
              {
                label: 'Conventional',
                src: '/videos/transcoded/conventional-data-quality.mp4',
              },
              {
                label: 'Petromac',
                src: '/videos/transcoded/data-quality-mechanism.mp4',
                highlight: true,
              },
            ],
          },
          logs: {
            title: 'Data Quality',
            slides: [
              {
                type: 'single',
                src: '/images/data-quality-logs-1.png',
                caption: 'Data quality log comparison',
              },
            ],
          },
        },
      },
    },
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
            panes: [
              {
                label: 'Conventional',
                src: '/videos/transcoded/conventional-holefinding.mp4',
              },
              {
                label: 'Pathfinder HT',
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
  ch: [
    { key: 'helix', label: 'Helix', open: { type: 'focus-centralizers' } },
    { key: 'rocker', label: 'Rocker', open: { type: 'rocker' } },
    { key: 'other', label: 'Other', open: { type: 'ch-other' } },
  ],
};

function LaneLoopContent() {
  const searchParams = useSearchParams();
  const laneParam = searchParams.get('lane');
  const lane: Lane = isLane(laneParam) ? laneParam : 'oh';

  // Prefers /videos/kiosk-hd/ clips when present, falls back to transcoded.
  const playlist = useKioskVideos(LANE_PLAYLIST[lane]);
  const overlayItems = LANE_OVERLAY[lane];

  const [videoIdx, setVideoIdx] = useState(0);
  const [active, setActive] = useState<ActiveExperience | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Overlay buttons stay hidden over the video and surface on hover / tap,
  // then fade out again after a few idle seconds.
  const revealOverlay = useCallback(() => {
    setOverlayVisible(true);
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = setTimeout(
      () => setOverlayVisible(false),
      OVERLAY_AUTOHIDE,
    );
  }, []);

  // Show briefly on arrival (and whenever an experience closes) so staff
  // know the buttons are there, then auto-hide.
  useEffect(() => {
    if (!active) revealOverlay();
    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, [active, revealOverlay]);

  const closeExperience = useCallback(() => setActive(null), []);

  return (
    <div
      className="relative w-full h-screen bg-black overflow-hidden"
      onMouseMove={revealOverlay}
      onClick={revealOverlay}
      onTouchStart={revealOverlay}
    >
      {/* Looping attractor playlist — plays the lane's clips end to end and
          repeats indefinitely; the kiosk stays in this lane. */}
      <video
        key={playlist[videoIdx]}
        src={playlist[videoIdx]}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        onEnded={() => setVideoIdx((i) => (i + 1) % playlist.length)}
      />
      {/* Dim so overlay buttons stay readable over bright frames */}
      <div className="absolute inset-0 bg-black/35 z-0 pointer-events-none" />

      {/* Overlay button strip — right edge, vertical and deliberately
          subtle. Hidden over the video; surfaces on hover / tap and
          auto-hides again. Same buttons for every clip in the lane. */}
      <AnimatePresence>
        {overlayVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-1/2 right-3 -translate-y-1/2 z-20 flex flex-col gap-2"
          >
            {overlayItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActive(item.open)}
                className="px-3 py-2 rounded-lg bg-black/25 hover:bg-black/70 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white text-xs font-medium tracking-wide transition-colors"
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active experience layer */}
      <AnimatePresence>
        {active?.type === 'focus-centralizers' && (
          <FocusCentralizersExperience key="fc" onClose={closeExperience} />
        )}
        {active?.type === 'rocker' && (
          <RockerExperience
            key="rocker"
            onBack={closeExperience}
            onClose={closeExperience}
          />
        )}
        {active?.type === 'ch-other' && (
          <ChOtherComingSoon key="ch-other" onClose={closeExperience} />
        )}
        {active?.type === 'overlay' && (
          <OverlayExperience
            key={active.config.title}
            config={active.config}
            onClose={closeExperience}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** Placeholder for the cased-hole "Other" overlay button. */
function ChOtherComingSoon({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
    >
      <div className="text-center text-white max-w-xl px-8">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50 mb-4">
          Cased Hole · Other
        </p>
        <h2 className="text-5xl font-extrabold mb-6">Coming soon</h2>
        <p className="text-lg text-white/70 mb-10">
          {/* TODO(rajesh): build the "Other" cased-hole experience. */}
          Additional cased-hole product families will live here.
        </p>
        <button
          onClick={onClose}
          className="px-8 py-3 rounded-full bg-white text-black font-semibold tracking-wide"
        >
          Back
        </button>
      </div>
    </motion.div>
  );
}

export default function LaneClient() {
  return (
    <Suspense fallback={null}>
      <LaneLoopContent />
    </Suspense>
  );
}
