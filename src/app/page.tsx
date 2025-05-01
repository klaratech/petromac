'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamicImport from 'next/dynamic';
import CarouselView from '@/components/CarouselView';

const ReactPlayer = dynamicImport(() => import('react-player/lazy'), { ssr: false });

export default function Home() {
  const [mode, setMode] = useState<'video' | 'carousel'>('video');
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle ?mode=carousel query param
  useEffect(() => {
    const param = searchParams.get('mode');
    if (param === 'carousel' && mode !== 'carousel') {
      setMode('carousel');
    }
  }, [searchParams, mode]);

  // Handle ESC key to return to carousel
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
    <Suspense fallback={null}>
      <div className="w-screen h-screen bg-black overflow-hidden relative">
        {/* Intro video */}
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

        {/* Carousel mode */}
        {mode === 'carousel' && (
          <div className="absolute inset-0">
            <CarouselView onResetToSplash={() => setMode('video')} />
          </div>
        )}
      </div>
    </Suspense>
  );
}