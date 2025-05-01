'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import CarouselView from '@/components/CarouselView';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

export default function Home() {
  const [mode, setMode] = useState<'video' | 'carousel'>('video');
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {/* Video screen */}
      {mode === 'video' && (
        <div
          ref={playerContainerRef}
          className="absolute inset-0"
          onClick={() => setMode('carousel')}
          onTouchStart={() => setMode('carousel')}
        >
          <ReactPlayer
            url="/videos/intro-loop.mp4"
            playing={true}
            loop
            muted
            width="100%"
            height="100%"
            className="absolute top-0 left-0"
          />
        </div>
      )}

      {/* Carousel screen */}
      {mode === 'carousel' && (
        <div className="absolute inset-0">
          <CarouselView onResetToSplash={() => setMode('video')} />
        </div>
      )}
    </div>
  );
}