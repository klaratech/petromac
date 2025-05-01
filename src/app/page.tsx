'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import CarouselView from '@/components/CarouselView';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

export default function Home() {
  const [mode, setMode] = useState<'video' | 'carousel'>('video');
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const param = searchParams.get('mode');
    if (param === 'carousel' && mode !== 'carousel') {
      setMode('carousel');
    }
  }, [searchParams, mode]);

  useEffect(() => {
    const param = searchParams.get('mode');
    if (mode === 'carousel' && param === 'carousel') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [mode, searchParams]);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {mode === 'video' && (
        <div
          ref={playerContainerRef}
          className="absolute inset-0"
          onClick={() => setMode('carousel')}
          onTouchStart={() => setMode('carousel')}
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
      )}

      {mode === 'carousel' && (
        <div className="absolute inset-0">
          <CarouselView onResetToSplash={() => setMode('video')} />
        </div>
      )}
    </div>
  );
}