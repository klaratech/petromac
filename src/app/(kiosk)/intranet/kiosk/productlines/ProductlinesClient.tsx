'use client';

import Image from 'next/image';
import Head from 'next/head';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SystemModal from '@/components/kiosk/SystemModal';
import FocusCentralizersExperience from '@/components/kiosk/FocusCentralizersExperience';
import {
  FEATURED_SYSTEMS,
  featuredSystems,
} from '@modules/catalog/config/featuredSystems';
import { systemMedia, type Lane } from '@modules/catalog/data/deviceSpecs';
import { KIOSK_HOME_PATH, KIOSK_LANE_PATH } from '@/constants/app';

function isLane(value: string | null): value is Lane {
  return value === 'oh' || value === 'ch';
}

const LANE_LABEL: Record<Lane, string> = {
  oh: 'Open Hole',
  ch: 'Cased Hole',
};

/**
 * Per-lane background video sequence. Plays muted on loop behind the system
 * tiles. `dice.mp4` acts as a short interlude between product clips.
 */
const LANE_VIDEOS: Record<Lane, string[]> = {
  oh: [
    '/videos/transcoded/pf.mp4',
    '/videos/transcoded/dice.mp4',
    '/videos/transcoded/WirelineExpress.mp4',
    '/videos/transcoded/dice.mp4',
  ],
  ch: ['/videos/transcoded/helix.mp4', '/videos/transcoded/dice.mp4'],
};

const IDLE_TIMEOUT_DEFAULT = 30000;        // 30 seconds
const IDLE_TIMEOUT_MODAL = 5 * 60 * 1000;  // 5 minutes

export default function ProductlinesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fading, setFading] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [bgVideoIdx, setBgVideoIdx] = useState(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Lane comes from ?lane=oh|ch (set by the chooser screen). When missing,
  // we show every system (back-compat for direct links to /productlines).
  const laneParam = searchParams.get('lane');
  const lane: Lane | null = isLane(laneParam) ? laneParam : null;

  const bgVideos = lane ? LANE_VIDEOS[lane] : [];

  const systemList = useMemo<[string, string][]>(() => {
    const names = lane
      ? FEATURED_SYSTEMS.filter((s) => s.lane === lane).map((s) => s.name)
      : featuredSystems;
    return names
      .filter((name) => systemMedia[name])
      .map((name) => [name, systemMedia[name].logo] as [string, string]);
  }, [lane]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    // Don't set timer if video is playing inside the modal
    if (selectedSystem && videoPlaying) return;

    const timeout = selectedSystem ? IDLE_TIMEOUT_MODAL : IDLE_TIMEOUT_DEFAULT;

    idleTimerRef.current = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        router.push(KIOSK_HOME_PATH);
      }, 1000);
    }, timeout);
  }, [router, selectedSystem, videoPlaying]);

  useEffect(() => {
    resetIdleTimer();
    const events = ['mousemove', 'mousedown', 'touchstart', 'keydown'];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
    };
  }, [resetIdleTimer]);

  return (
    <>
      <Head>
        {featuredSystems.map((system) => {
          const video = systemMedia[system]?.video;
          return video ? (
            <link key={system} rel="preload" as="video" href={video} />
          ) : null;
        })}
      </Head>

      <div
        className={`relative w-full h-screen bg-black flex flex-col items-center justify-center overflow-hidden transition-opacity duration-1000 ${
          fading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Background: lane-specific video loop (muted, plays through a
            sequence and cycles). Falls back to tv-bg.png when no lane is set. */}
        {bgVideos.length > 0 ? (
          <>
            <video
              key={bgVideos[bgVideoIdx]}
              src={bgVideos[bgVideoIdx]}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover z-0"
              onEnded={() =>
                setBgVideoIdx((i) => (i + 1) % bgVideos.length)
              }
            />
            {/* Dim overlay so tile labels stay readable over bright frames */}
            <div className="absolute inset-0 bg-black/45 z-0 pointer-events-none" />
          </>
        ) : (
          <Image
            src="/images/tv-bg.png"
            alt="Background"
            fill
            priority
            className="absolute inset-0 object-cover z-0"
          />
        )}

        {/* Lane breadcrumb (top-left) — only when a lane is active */}
        {lane && (
          <div className="absolute top-6 left-6 z-20 flex items-center gap-3 text-white/80">
            <button
              onClick={() =>
                router.push(lane ? `${KIOSK_LANE_PATH}?lane=${lane}` : KIOSK_LANE_PATH)
              }
              className="text-sm tracking-wide hover:text-white"
              aria-label="Back to application chooser"
            >
              ← Change application
            </button>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs uppercase tracking-[0.2em]">
              {LANE_LABEL[lane]}
            </span>
          </div>
        )}

        <div className="relative z-10 flex flex-wrap gap-16 items-center justify-center max-w-[1400px] px-8">
          {systemList.length === 0 ? (
            <p className="text-white/70 text-lg">
              No systems available for this lane yet.
            </p>
          ) : (
            systemList.map(([system, icon]) => (
              <div
                key={system}
                className="w-[220px] h-[260px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setSelectedSystem(system)}
              >
                <Image
                  src={icon}
                  alt={system}
                  width={180}
                  height={180}
                  className="shadow-xl object-contain"
                />
                <span className="text-white text-lg font-semibold tracking-wide drop-shadow">
                  {system}
                </span>
              </div>
            ))
          )}
        </div>

        {/* CH lane "Focus Centralizers" tile gets the dedicated Helix-centric
            experience (looping video + HUD overlay + Rocker corner badge). */}
        {selectedSystem === 'Focus Centralizers' && (
          <FocusCentralizersExperience
            onClose={() => setSelectedSystem(null)}
          />
        )}

        {/* "Other CH" — placeholder slot for future cased-hole product
            families. Shows a lightweight "Coming soon" panel. */}
        {selectedSystem === 'Other CH' && (
          <OtherComingSoon onClose={() => setSelectedSystem(null)} />
        )}

        {/* Everything else (the OH lane systems) keeps the existing modal. */}
        {selectedSystem &&
          selectedSystem !== 'Focus Centralizers' &&
          selectedSystem !== 'Other CH' && (
            <SystemModal
              system={selectedSystem}
              onClose={() => setSelectedSystem(null)}
              onVideoPlay={() => setVideoPlaying(true)}
              onVideoPause={() => setVideoPlaying(false)}
            />
          )}
      </div>
    </>
  );
}

function OtherComingSoon({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <div className="text-center text-white max-w-xl px-8">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50 mb-4">
          Cased Hole · Other
        </p>
        <h2 className="text-5xl font-extrabold mb-6">Coming soon</h2>
        <p className="text-lg text-white/70 mb-10">
          Additional cased-hole product families will live here.
        </p>
        <button
          onClick={onClose}
          className="px-8 py-3 rounded-full bg-white text-black font-semibold tracking-wide"
        >
          Back
        </button>
      </div>
    </div>
  );
}
