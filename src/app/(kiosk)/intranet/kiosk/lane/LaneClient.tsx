'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  KIOSK_HOME_PATH,
  KIOSK_PRODUCTLINES_PATH,
} from '@/constants/app';

const IDLE_TIMEOUT = 60_000; // 60 seconds — bounce back to splash if untouched

type Lane = 'oh' | 'ch';

interface LaneCard {
  lane: Lane;
  title: string;
  subtitle: string;
  bullets: string[];
  /** Background image shown behind the gradient on the card. */
  bg: string;
}

const LANES: LaneCard[] = [
  {
    lane: 'oh',
    title: 'Open Hole',
    subtitle: 'Conveyance, centralisation, formation testing',
    bullets: [
      'PathFinder universal hole finder',
      'Focus open-hole centralisers',
      'Wireline Express formation testing',
      'Thor controlled-impulse jar',
    ],
    bg: '/images/conveyance.jpg',
  },
  {
    lane: 'ch',
    title: 'Cased Hole',
    subtitle: 'Centralisation across the casing range',
    bullets: [
      'HELIX — large casing sizes',
      'ROCKER — small casing sizes',
    ],
    bg: '/images/sticking.jpg',
  },
];

export default function LaneClient() {
  const router = useRouter();
  const [fading, setFading] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const goToSplash = useCallback(() => {
    setFading(true);
    setTimeout(() => router.push(`${KIOSK_HOME_PATH}?mode=video`), 800);
  }, [router]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(goToSplash, IDLE_TIMEOUT);
  }, [goToSplash]);

  useEffect(() => {
    resetIdleTimer();
    const events = ['mousemove', 'mousedown', 'touchstart', 'keydown'];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer));
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
    };
  }, [resetIdleTimer]);

  const choose = (lane: Lane) => {
    setFading(true);
    setTimeout(() => {
      router.push(`${KIOSK_PRODUCTLINES_PATH}?lane=${lane}`);
    }, 400);
  };

  return (
    <div
      className={`relative w-full h-screen flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background */}
      <Image
        src="/images/tv-bg.png"
        alt=""
        fill
        priority
        className="absolute inset-0 object-cover z-0"
      />
      <div className="absolute inset-0 bg-black/55 z-0" />

      {/* Header */}
      <div className="relative z-10 w-full text-center mb-10 px-8">
        <p className="text-base uppercase tracking-[0.4em] text-white/60 mb-3">
          Petromac
        </p>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-3">
          Choose your application
        </h1>
        <p className="text-lg md:text-xl text-white/70">
          Tap a lane to see the relevant product line.
        </p>
      </div>

      {/* Lane cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 w-[90vw] max-w-[1400px]">
        {LANES.map((card) => (
          <button
            key={card.lane}
            onClick={() => choose(card.lane)}
            className="group relative h-[60vh] rounded-2xl overflow-hidden border border-white/15 bg-black/40 text-left shadow-2xl transition-transform hover:scale-[1.02] active:scale-100 focus:outline-none focus:ring-4 focus:ring-white/40"
            aria-label={`Choose ${card.title}`}
          >
            <Image
              src={card.bg}
              alt=""
              fill
              className="absolute inset-0 object-cover opacity-50 group-hover:opacity-70 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            <div className="relative h-full flex flex-col justify-end p-10">
              <h2 className="text-5xl md:text-6xl font-extrabold mb-3 drop-shadow-lg">
                {card.title}
              </h2>
              <p className="text-lg md:text-xl text-white/80 mb-6">
                {card.subtitle}
              </p>
              <ul className="space-y-1.5 text-base md:text-lg text-white/90">
                {card.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="text-white/50 mt-1.5">▸</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-8 inline-flex items-center self-start px-6 py-3 rounded-full bg-white text-black font-semibold tracking-wide shadow-lg group-hover:bg-white/90">
                Explore →
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Back to splash */}
      <button
        onClick={goToSplash}
        className="absolute bottom-6 left-6 z-20 text-white/70 hover:text-white text-sm tracking-wide"
      >
        ← Back
      </button>
    </div>
  );
}
