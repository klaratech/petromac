'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import CarouselView from '@/components/CarouselView';

// Dynamically import react-player only on the client side
const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

export default function Home() {
  const [active, setActive] = useState(false);

  const handleInteraction = () => {
    setActive(true);
  };

  return (
    <div
      className="w-screen h-screen bg-black overflow-hidden"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {!active ? (
        <ReactPlayer
          url="/videos/attract-loop.mp4"
          playing
          loop
          muted
          width="100%"
          height="100%"
          className="absolute top-0 left-0"
        />
      ) : (
        <CarouselView />
      )}
    </div>
  );
}