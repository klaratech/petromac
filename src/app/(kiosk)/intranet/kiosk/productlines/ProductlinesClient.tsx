'use client';

import Image from 'next/image';
import Head from 'next/head';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SystemModal from '@/components/kiosk/SystemModal';
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

const IDLE_TIMEOUT_DEFAULT = 30000;        // 30 seconds
const IDLE_TIMEOUT_MODAL = 5 * 60 * 1000;  // 5 minutes

export default function ProductlinesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fading, setFading] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Lane comes from ?lane=oh|ch (set by the chooser screen). When missing,
  // we show every system (back-compat for direct links to /productlines).
  const laneParam = searchParams.get('lane');
  const lane: Lane | null = isLane(laneParam) ? laneParam : null;

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
        router.push(`${KIOSK_HOME_PATH}?mode=video`);
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
        className={`relative w-full h-screen bg-blue-800 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-1000 ${
          fading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <Image
          src="/images/tv-bg.png"
          alt="Background"
          fill
          priority
          className="absolute inset-0 object-cover z-0"
        />

        {/* Lane breadcrumb (top-left) — only when a lane is active */}
        {lane && (
          <div className="absolute top-6 left-6 z-20 flex items-center gap-3 text-white/80">
            <button
              onClick={() => router.push(KIOSK_LANE_PATH)}
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

        {selectedSystem && (
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
