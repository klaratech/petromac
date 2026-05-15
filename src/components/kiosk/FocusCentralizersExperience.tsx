'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import DrilldownMapCore from '@/components/geo/DrilldownMapCore';
import useOperationsData from '@/hooks/useOperationsData';
import type { JobRecord } from '@/types/JobRecord';
import { systemMedia } from '@modules/catalog/data/deviceSpecs';
import MechanismScreen, { HELIX_MECHANISM } from './ch/MechanismScreen';
import LogsScreen, { HELIX_LOGS } from './ch/LogsScreen';
import RockerExperience from './ch/RockerExperience';

type View =
  | 'main'
  | 'track-record'
  | 'mechanism'
  | 'logs'
  | 'rocker';

interface Props {
  onClose: () => void;
}

const HUD_AUTOHIDE_MS = 6000;

/**
 * Cased-hole "Focus Centralizers" experience.
 *
 * - Helix intro video loops fullscreen in the background.
 * - HUD strip of 4 buttons (Track Record, Success Stories, Mechanism, Logs)
 *   appears on entry, fades out after 6s of no interaction. Tap anywhere
 *   to bring it back.
 * - Bottom-right corner badge for ROCKER → opens the sister Rocker view
 *   with the same 4-button structure but a still image background.
 */
export default function FocusCentralizersExperience({ onClose }: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>('main');
  const [hudVisible, setHudVisible] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: jobData } = useOperationsData<JobRecord>({
    enabled: view === 'track-record',
  });

  const media = systemMedia['Focus Centralizers'];

  const scheduleHide = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(
      () => setHudVisible(false),
      HUD_AUTOHIDE_MS,
    );
  };

  useEffect(() => {
    if (view !== 'main') return;
    setHudVisible(true);
    scheduleHide();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [view]);

  const handleTap = () => {
    if (view !== 'main') return;
    setHudVisible(true);
    scheduleHide();
  };

  // Sub-views
  if (view === 'track-record') {
    return jobData ? (
      <FullScreenLayer>
        <DrilldownMapCore
          data={jobData}
          // The map filters by `System`. Helix + Rocker both roll up to
          // "Focus - CH" in the data pipeline; the finer Helix/Rocker split
          // lives on each record's `Subsystem` field for future filtering.
          initialSystem="Focus - CH"
          showCloseButton
          onClose={() => setView('main')}
          showSuccessStoriesLink
        />
      </FullScreenLayer>
    ) : (
      <FullScreenLayer>
        <div className="w-full h-full flex items-center justify-center text-white/70">
          Loading track record…
        </div>
      </FullScreenLayer>
    );
  }

  if (view === 'mechanism') {
    return (
      <FullScreenLayer>
        <MechanismScreen config={HELIX_MECHANISM} onBack={() => setView('main')} />
      </FullScreenLayer>
    );
  }

  if (view === 'logs') {
    return (
      <FullScreenLayer>
        <LogsScreen config={HELIX_LOGS} onBack={() => setView('main')} />
      </FullScreenLayer>
    );
  }

  if (view === 'rocker') {
    return (
      <FullScreenLayer>
        <RockerExperience
          onBack={() => setView('main')}
          onClose={onClose}
        />
      </FullScreenLayer>
    );
  }

  // Main: Helix video on loop + HUD overlay + Rocker corner
  return (
    <FullScreenLayer>
      <div
        className="relative w-full h-full bg-black"
        onClick={handleTap}
        onTouchStart={handleTap}
      >
        {media?.video ? (
          <video
            src={media.video}
            autoPlay
            muted
            loop
            playsInline
            controls
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/60">
            No Helix video available.
          </div>
        )}

        {/* Subtle dark overlay so HUD copy stays readable over bright frames */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        {/* Top-right close */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
          className="absolute top-4 right-4 z-50 text-white text-3xl font-bold w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60"
        >
          ✕
        </button>

        {/* Top-left product label */}
        <div className="absolute top-6 left-6 z-40 pointer-events-none">
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">
            Cased Hole
          </p>
          <h2 className="text-3xl font-extrabold text-white drop-shadow">
            Focus Centralizers
          </h2>
          <p className="text-base text-white/70 mt-1">HELIX CX-9</p>
        </div>

        {/* HUD button strip — small, top centre, kept clear of the native
            video controls along the bottom. */}
        <AnimatePresence>
          {hudVisible && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex gap-2 px-2 py-2 rounded-xl bg-black/35 backdrop-blur border border-white/10 shadow-xl"
            >
              <HudButton
                label="Track Record"
                onClick={(e) => {
                  e.stopPropagation();
                  setView('track-record');
                }}
              />
              <HudButton
                label="Success Stories"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/intranet/kiosk/successstories');
                }}
              />
              <HudButton
                label="Mechanism"
                onClick={(e) => {
                  e.stopPropagation();
                  setView('mechanism');
                }}
              />
              <HudButton
                label="Logs"
                onClick={(e) => {
                  e.stopPropagation();
                  setView('logs');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rocker corner badge — bottom-right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setView('rocker');
          }}
          aria-label="Open Rocker"
          className="absolute bottom-10 right-10 z-40 group flex items-center gap-3 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur text-white text-sm font-semibold tracking-[0.2em] uppercase shadow-lg transition-colors"
        >
          {/* TODO(graphics): swap for a small Rocker silhouette / icon */}
          <span className="w-8 h-8 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white/80">
            <Image
              src="/images/focus.png"
              alt=""
              width={20}
              height={20}
              className="opacity-80"
            />
          </span>
          <span>Rocker →</span>
        </button>
      </div>
    </FullScreenLayer>
  );
}

/** Shared full-screen wrapper so all views render at the same z-layer. */
function FullScreenLayer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black"
    >
      {children}
    </motion.div>
  );
}

function HudButton({
  label,
  onClick,
}: {
  label: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white/85 hover:text-white text-xs font-medium tracking-wide transition-colors"
    >
      {label}
    </button>
  );
}
