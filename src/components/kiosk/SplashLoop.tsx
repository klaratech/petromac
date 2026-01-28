'use client';

import React, { useEffect, useRef } from 'react';

interface SplashLoopProps {
  onActivate: () => void;
}

export default function SplashLoop({ onActivate }: SplashLoopProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const requestFullscreen = () => {
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

  const handleClick = () => {
    requestFullscreen();
    onActivate();
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
      };

      const isFullscreen = document.fullscreenElement || doc.webkitFullscreenElement;
      if (!isFullscreen) {
        window.location.reload();
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
    <div
      ref={containerRef}
      className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center"
    >
      <video
        src="/videos/intro-loop2.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover -z-10"
      />

      <button
        onClick={handleClick}
        className="z-10 px-6 py-4 text-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transition-all"
      >
        Start Kiosk Mode
      </button>
    </div>
  );
}
