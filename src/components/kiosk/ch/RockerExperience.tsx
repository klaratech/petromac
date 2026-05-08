'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import DrilldownMapCore from '@/components/geo/DrilldownMapCore';
import useOperationsData from '@/hooks/useOperationsData';
import type { JobRecord } from '@/types/JobRecord';
import MechanismScreen from './MechanismScreen';
import LogsScreen from './LogsScreen';

type View = 'main' | 'track-record' | 'mechanism' | 'logs';

interface Props {
  onBack: () => void;   // back to Helix / Focus Centralizers main
  onClose: () => void;  // close the entire CH experience
}

const HUD_AUTOHIDE_MS = 6000;

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
  const router = useRouter();
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
        // No Rocker records in the data pipeline yet — map will show empty
        // until ops data is tagged. Filter by 'Rocker' so when records land
        // they automatically appear here.
        initialSystem="Rocker"
        showCloseButton
        onClose={() => setView('main')}
        showSuccessStoriesLink
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-white/70">
        Loading track record…
      </div>
    );
  }

  if (view === 'mechanism') {
    return <MechanismScreen system="Rocker" onBack={() => setView('main')} />;
  }

  if (view === 'logs') {
    return <LogsScreen system="Rocker" onBack={() => setView('main')} />;
  }

  return (
    <div
      className="relative w-full h-full bg-black"
      onClick={handleTap}
      onTouchStart={handleTap}
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

      {/* Top-left product label */}
      <div className="absolute top-6 left-6 z-40 pointer-events-none">
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">
          Cased Hole · Small casing
        </p>
        <h2 className="text-4xl font-extrabold text-white drop-shadow">
          ROCKER
        </h2>
      </div>

      {/* Top-right close + back */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="px-4 py-2 rounded-full bg-black/40 hover:bg-black/60 text-white text-sm tracking-wide"
        >
          ← Helix
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white text-3xl font-bold"
        >
          ✕
        </button>
      </div>

      {/* HUD button strip */}
      <AnimatePresence>
        {hudVisible && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 flex gap-3 px-3 py-3 rounded-2xl bg-black/55 backdrop-blur border border-white/15 shadow-2xl"
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
      className="px-5 py-3 rounded-xl bg-white/90 hover:bg-white text-black font-semibold text-base tracking-wide shadow-md transition-colors"
    >
      {label}
    </button>
  );
}
