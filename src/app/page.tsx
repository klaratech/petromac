'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import CarouselView from '@/components/CarouselView';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

export default function Home() {
  const searchParams = useSearchParams();
  const paramMode = searchParams.get('mode');
  const [mode, setMode] = useState<'home' | 'video' | 'carousel'>(
    paramMode === 'carousel' ? 'carousel' : 'home'
  );

  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Request fullscreen mode
  const enterFullscreen = () => {
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => void;
      msRequestFullscreen?: () => void;
    };

    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
  };

  // Reset to home if fullscreen is exited
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
      };

      const isFullscreen = document.fullscreenElement || doc.webkitFullscreenElement;
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

  // Set focus on video container for keyboard input
  useEffect(() => {
    if (mode === 'video' && videoContainerRef.current) {
      videoContainerRef.current.focus();
    }
  }, [mode]);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {/* Home screen with kiosk button */}
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

      {/* Fullscreen video screen */}
      {mode === 'video' && (
        <div
          ref={videoContainerRef}
          tabIndex={0}
          className="absolute inset-0"
          onClick={() => setMode('carousel')}
          onTouchStart={() => setMode('carousel')}
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

      {/* Carousel mode */}
      {mode === 'carousel' && (
        <div className="absolute inset-0">
          <CarouselView onResetToSplash={() => setMode('video')} />
        </div>
      )}
    </div>
  );
}