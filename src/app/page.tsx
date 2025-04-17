'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import CarouselView from '@/components/CarouselView';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

export default function Home() {
  const [active, setActive] = useState(false);

  const handleInteraction = () => setActive(true);

  useEffect(() => {
    if (active) return;
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(e => window.addEventListener(e, handleInteraction));
    return () => events.forEach(e => window.removeEventListener(e, handleInteraction));
  }, [active]);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          active ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <ReactPlayer
          url="/videos/intro-loop.mp4"
          playing
          loop
          muted
          width="100%"
          height="100%"
          className="absolute top-0 left-0"
        />
      </div>

      {active && (
        <div className="absolute inset-0">
          <CarouselView onResetToSplash={() => setActive(false)} />
        </div>
      )}
    </div>
  );
}