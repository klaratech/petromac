'use client';

import { useEffect } from 'react';

type SplashLoopProps = {
  onEnter: () => void;
};

export default function SplashLoop({ onEnter }: SplashLoopProps) {
  useEffect(() => {
    const handleInteraction = () => {
      onEnter();
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [onEnter]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      >
        <source src="/videos/intro-loop.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}