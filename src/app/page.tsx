'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import CarouselView from '@/components/CarouselView';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

export default function Home() {
  const [mode, setMode] = useState<'home' | 'video' | 'carousel'>('home');

  // Request fullscreen mode
  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
    } else if ((el as any).msRequestFullscreen) {
      (el as any).msRequestFullscreen();
    }
  };

  // Reset to home if fullscreen is exited
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen =
        document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (!isFullscreen) {
        setMode('home');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {/* Home screen with button */}
      {mode === 'home' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => {
              enterFullscreen();
              setMode('video');
            }}
            className="px-6 py-4 text-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transition-all"
          >
            Enter Kiosk Mode
          </button>
        </div>
      )}

      {/* Fullscreen intro video */}
      {mode === 'video' && (
        <div
          className="absolute inset-0"
          onClick={() => setMode('carousel')}
          onTouchStart={() => setMode('carousel')}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setMode('carousel');
            }
          }}
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

      {/* Carousel view */}
      {mode === 'carousel' && (
        <div className="absolute inset-0">
          <CarouselView onResetToSplash={() => setMode('video')} />
        </div>
      )}
    </div>
  );
}