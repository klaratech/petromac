'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import CarouselView from '@/components/CarouselView';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

export default function Home() {
  const [mode, setMode] = useState<'video' | 'carousel'>('video');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playVideo, setPlayVideo] = useState(false);
  const playerRef = useRef<any>(null);

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

    setPlayVideo(true);
  };

  const exitFullscreen = () => {
    const doc = document as Document & {
      webkitExitFullscreen?: () => void;
      msExitFullscreen?: () => void;
    };

    const handleExit = () => {
      setIsFullscreen(false);
      setPlayVideo(false);
      document.removeEventListener('fullscreenchange', handleExit);
      document.removeEventListener('webkitfullscreenchange', handleExit);
    };

    document.addEventListener('fullscreenchange', handleExit);
    document.addEventListener('webkitfullscreenchange', handleExit);

    if (document.exitFullscreen) {
      document.exitFullscreen().catch(handleExit);
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen();
    } else {
      handleExit();
    }
  };

  // Track fullscreen state
  useEffect(() => {
    const handleChange = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
      };

      const isFs = !!(document.fullscreenElement || doc.webkitFullscreenElement);
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
    };
  }, []);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {/* Fullscreen Toggle Button */}
      <button
        onClick={isFullscreen ? exitFullscreen : enterFullscreen}
        className="absolute top-4 right-4 z-50 px-4 py-2 bg-white text-black rounded shadow hover:bg-gray-100"
      >
        {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      </button>

      {/* Video View */}
      {mode === 'video' && (
        <div
          className="absolute inset-0"
          onClick={() => setMode('carousel')}
          onTouchStart={() => setMode('carousel')}
        >
          <ReactPlayer
            ref={playerRef}
            url="/videos/intro-loop.mp4"
            playing={playVideo}
            loop
            muted
            width="100%"
            height="100%"
            className="absolute top-0 left-0"
          />
        </div>
      )}

      {/* Carousel View */}
      {mode === 'carousel' && (
        <div className="absolute inset-0">
          <CarouselView onResetToSplash={() => setMode('video')} />
        </div>
      )}
    </div>
  );
}