'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import DrilldownMapCore from '@/components/geo/DrilldownMapCore';
import useOperationsData from '@/hooks/useOperationsData';
import type { JobRecord } from '@/types/JobRecord';
import MechanismScreen, { ROCKER_MECHANISM } from './MechanismScreen';
import LogsScreen, { ROCKER_LOGS } from './LogsScreen';
import SuccessStoriesFlipbook from '@/features/success-stories/components/SuccessStoriesFlipbook';

type View = 'main' | 'track-record' | 'success-stories' | 'mechanism' | 'logs';

interface Props {
  onBack: () => void;   // back to Helix / Focus Centralizers main
  onClose: () => void;  // close the entire CH experience
}

const HUD_AUTOHIDE_MS = 4000;

/**
 * RockerExperience — sister view to FocusCentralizersExperience for the
 * smaller-casing Rocker tool. Same 4-button HUD; instead of a looping
 * video the background is a still product image until graphics delivers
 * a Rocker animation.
 *
 * Asset slot:
 *   /public/images/rocker-hero.webp   (full-bleed Rocker render)
 */
export default function RockerExperience({ onBack, onClose }: Props) {
  const [view, setView] = useState<View>('main');
  const [hudVisible, setHudVisible] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: jobData } = useOperationsData<JobRecord>({
    enabled: view === 'track-record',
  });

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

  if (view === 'track-record') {
    return jobData ? (
      <DrilldownMapCore
        data={jobData}
        // Helix + Rocker both roll up to "Focus - CH" as the `System`; the
        // Rocker-specific split lives on each record's `Subsystem` field
        // (filtering by Subsystem can be added to the map later).
        initialSystem="Focus - CH"
        showCloseButton
        onClose={() => setView('main')}
        showSuccessStoriesLink
        onSuccessStoriesClick={() => setView('success-stories')}
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-white/70">
        Loading track record…
      </div>
    );
  }

  if (view === 'success-stories') {
    return (
      <SuccessStoriesFlipbook onBack={() => setView('main')} backLabel="Back" />
    );
  }

  if (view === 'mechanism') {
    return <MechanismScreen config={ROCKER_MECHANISM} onBack={() => setView('main')} />;
  }

  if (view === 'logs') {
    return <LogsScreen config={ROCKER_LOGS} onBack={() => setView('main')} />;
  }

  return (
    <div
      className="relative w-full h-full bg-black"
      onClick={handleTap}
      onTouchStart={handleTap}
      onMouseMove={handleTap}
    >
      {/* Background — Rocker hero image (placeholder gradient until graphics) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black" />
      <Image
        src="/images/rocker-hero.webp"
        alt=""
        fill
        priority
        className="absolute inset-0 object-contain object-center opacity-90"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      {/* Top-right close — appears with the HUD on hover / tap */}
      <AnimatePresence>
        {hudVisible && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close"
            className="absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white text-3xl font-bold"
          >
            ✕
          </motion.button>
        )}
      </AnimatePresence>

      {/* HUD button strip — small, top centre (matches the Helix experience) */}
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

      {/* Helix corner badge — bottom-right, appears with the HUD. Mirrors
          the Rocker badge on the Focus Centralizers (Helix) experience. */}
      <AnimatePresence>
        {hudVisible && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            aria-label="Back to Helix"
            className="absolute bottom-8 right-8 z-40 group flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur text-white text-[10px] font-semibold tracking-[0.18em] uppercase shadow-md transition-colors"
          >
            {/* TODO(graphics): swap for a small Helix silhouette / icon */}
            <span className="w-5 h-5 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white/80">
              <Image
                src="/images/focus.png"
                alt=""
                width={12}
                height={12}
                className="opacity-80"
              />
            </span>
            <span>Helix</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
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
