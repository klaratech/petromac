'use client';

import Image from 'next/image';
import Head from 'next/head';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SystemModal from '@/components/SystemModal';
import { featuredSystems } from '@/config/featuredSystems';
import { systemMedia } from '@/data/deviceSpecs';

const systemList = featuredSystems
  .filter((system) => systemMedia[system])
  .map((system) => [system, systemMedia[system].logo] as [string, string]);

const IDLE_TIMEOUT = 120000; // 2 minutes

export default function ProductlinesClient() {
  const router = useRouter();
  const [fading, setFading] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        router.push('/?mode=video');
      }, 1000);
    }, IDLE_TIMEOUT);
  }, [router]);

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

        <div className="relative z-10 flex gap-16 items-center justify-center">
          {systemList.map(([system, icon]) => (
            <div
              key={system}
              className="w-[220px] h-[220px] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setSelectedSystem(system)}
            >
              <Image
                src={icon}
                alt={system}
                width={180}
                height={180}
                className="shadow-xl object-contain" // ✅ Removed rounded-xl
              />
            </div>
          ))}
        </div>

        {selectedSystem && (
          <SystemModal
            system={selectedSystem}
            onClose={() => setSelectedSystem(null)}
          />
        )}
      </div>
    </>
  );
}