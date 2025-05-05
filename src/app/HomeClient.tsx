'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import CarouselView from '@/components/CarouselView';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

export default function HomeClient() {
  const [mode, setMode] = useState<'video' | 'carousel'>('video');
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const param = searchParams.get('mode');
    if (param === 'carousel' && mode !== 'carousel') {
      setMode('carousel');
    }
  }, [searchParams, mode]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('/?mode=carousel');
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [router]);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {mode === 'video' && (
        <div ref={playerContainerRef} className="absolute inset-0">
          <ReactPlayer
            url="/videos/intro-loop.mp4"
            playing
            loop
            muted
            width="100%"
            height="100%"
            className="absolute top-0 left-0"
          />

          {/* Floating Touch to Begin Button */}
          <div className="absolute inset-0 flex items-end justify-center pb-16 pointer-events-none">
            <button
              onClick={() => setMode('carousel')}
              onTouchStart={() => setMode('carousel')}
              className="pointer-events-auto px-8 py-3 text-xl font-semibold text-white bg-white/10 border border-white/30 rounded-full shadow-lg backdrop-blur hover:bg-white/20 transition"
            >
              Touch to Begin
            </button>
          </div>
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