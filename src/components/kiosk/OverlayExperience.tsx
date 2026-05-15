'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DrilldownMapCore from '@/components/geo/DrilldownMapCore';
import useOperationsData from '@/hooks/useOperationsData';
import { useKioskVideo } from '@/hooks/useKioskVideo';
import MechanismScreen, {
  type MechanismConfig,
} from '@/components/kiosk/ch/MechanismScreen';
import LogsScreen, { type LogsConfig } from '@/components/kiosk/ch/LogsScreen';
import type { JobRecord } from '@/types/JobRecord';

/**
 * Config for a generic kiosk product experience.
 *
 * This is the open-hole sibling of `FocusCentralizersExperience` — same shape
 * (looping video background + 4-button HUD + close), but driven by a config
 * object so new overlay buttons can be added without copy-pasting a component.
 *
 * To "build out" an experience (per the Helix pattern), fill in the optional
 * fields below. Anything left undefined renders a clearly-marked placeholder
 * panel so the kiosk stays usable while content is in progress.
 */
export interface OverlayExperienceConfig {
  /** Eyebrow label, e.g. "Open Hole". */
  laneLabel: string;
  /** Big title shown top-left, e.g. "Formation Testing". */
  title: string;
  /** Optional sub-label under the title, e.g. a model name. */
  subtitle?: string;
  /** Featured video that loops fullscreen behind the HUD. */
  video: string;
  /**
   * When set, the "Track Record" button opens the real drilldown map filtered
   * to this system name (must match the `system` field in the operations data).
   * Leave undefined to show the placeholder.
   */
  trackRecordSystem?: string;
  /**
   * When true, the "Success Stories" button routes to the shared kiosk
   * success-stories screen. Leave false/undefined for the placeholder.
   */
  enableSuccessStories?: boolean;
  /**
   * When set, the "Mechanism" button opens the real comparison screen.
   * Leave undefined to show the placeholder.
   */
  mechanism?: MechanismConfig;
  /**
   * When set, the "Logs" button opens the real slide screen.
   * Leave undefined to show the placeholder.
   */
  logs?: LogsConfig;
}

type View = 'main' | 'track-record' | 'success-stories' | 'mechanism' | 'logs';

interface Props {
  config: OverlayExperienceConfig;
  onClose: () => void;
}

const HUD_AUTOHIDE_MS = 6000;

export default function OverlayExperience({ config, onClose }: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>('main');
  const [hudVisible, setHudVisible] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Prefers the /videos/kiosk-hd/ master when present, else transcoded.
  const videoSrc = useKioskVideo(config.video);

  const { data: jobData } = useOperationsData<JobRecord>({
    enabled: view === 'track-record' && Boolean(config.trackRecordSystem),
  });

  const scheduleHide = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setHudVisible(false), HUD_AUTOHIDE_MS);
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

  // ── Sub-views ────────────────────────────────────────────────────────────
  if (view === 'track-record') {
    // TODO(rajesh): tag operations data with this product so the map fills in.
    if (!config.trackRecordSystem) {
      return (
        <FullScreenLayer>
          <ComingSoon
            eyebrow={`${config.laneLabel} · ${config.title}`}
            heading="Track Record"
            onBack={() => setView('main')}
          />
        </FullScreenLayer>
      );
    }
    return jobData ? (
      <FullScreenLayer>
        <DrilldownMapCore
          data={jobData}
          initialSystem={config.trackRecordSystem}
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

  if (view === 'success-stories') {
    // TODO(rajesh): wire to a product-filtered success stories view.
    return (
      <FullScreenLayer>
        <ComingSoon
          eyebrow={`${config.laneLabel} · ${config.title}`}
          heading="Success Stories"
          onBack={() => setView('main')}
        />
      </FullScreenLayer>
    );
  }

  if (view === 'mechanism') {
    return (
      <FullScreenLayer>
        {config.mechanism ? (
          <MechanismScreen
            config={config.mechanism}
            onBack={() => setView('main')}
          />
        ) : (
          <ComingSoon
            eyebrow={`${config.laneLabel} · ${config.title}`}
            heading="Mechanism"
            onBack={() => setView('main')}
          />
        )}
      </FullScreenLayer>
    );
  }

  if (view === 'logs') {
    return (
      <FullScreenLayer>
        {config.logs ? (
          <LogsScreen config={config.logs} onBack={() => setView('main')} />
        ) : (
          <ComingSoon
            eyebrow={`${config.laneLabel} · ${config.title}`}
            heading="Logs"
            onBack={() => setView('main')}
          />
        )}
      </FullScreenLayer>
    );
  }

  // ── Main: featured video on loop + HUD overlay ───────────────────────────
  return (
    <FullScreenLayer>
      <div
        className="relative w-full h-full bg-black"
        onClick={handleTap}
        onTouchStart={handleTap}
      >
        <video
          key={videoSrc}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          controls
          className="absolute inset-0 w-full h-full object-cover"
        />

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
            {config.laneLabel}
          </p>
          <h2 className="text-3xl font-extrabold text-white drop-shadow">
            {config.title}
          </h2>
          {config.subtitle && (
            <p className="text-base text-white/70 mt-1">{config.subtitle}</p>
          )}
        </div>

        {/* HUD button strip — small, top centre, kept clear of the native
            video controls along the bottom. Matches the Helix experience. */}
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
                  if (config.enableSuccessStories) {
                    router.push('/intranet/kiosk/successstories');
                  } else {
                    setView('success-stories');
                  }
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

/** Placeholder panel for sub-views that haven't been built out yet. */
function ComingSoon({
  eyebrow,
  heading,
  onBack,
}: {
  eyebrow: string;
  heading: string;
  onBack: () => void;
}) {
  return (
    <div className="w-full h-full bg-black/95 flex items-center justify-center">
      <div className="text-center text-white max-w-xl px-8">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50 mb-4">
          {eyebrow}
        </p>
        <h2 className="text-5xl font-extrabold mb-6">{heading}</h2>
        <p className="text-lg text-white/70 mb-10">
          Coming soon — this screen is a placeholder.
        </p>
        <button
          onClick={onBack}
          className="px-8 py-3 rounded-full bg-white text-black font-semibold tracking-wide"
        >
          Back
        </button>
      </div>
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
