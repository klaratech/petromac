'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });
const introVideo = '/videos/intro-loop.mp4';

export default function HomeClient() {
  const [mode, setMode] = useState<'intro' | 'video'>('intro');
  const [typedText, setTypedText] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [videoKey, setVideoKey] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const lastInteractionRef = useRef<number>(Date.now());

  const fullText = 'Disruptive Conveyance Solutions';

  useEffect(() => {
    const param = searchParams.get('mode');
    if (param === 'video') {
      setMode('video');
    }
  }, [searchParams]);

  useEffect(() => {
    if (mode !== 'intro') return;

    setTypedText('');
    setShowButton(false);
    let i = 0;

    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i + 1));
      i++;

      if (i >= fullText.length) {
        clearInterval(interval);
        setTimeout(() => setShowButton(true), 500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    const updateInteraction = () => {
      lastInteractionRef.current = Date.now();
    };

    window.addEventListener('mousemove', updateInteraction);
    window.addEventListener('keydown', updateInteraction);
    window.addEventListener('touchstart', updateInteraction);
    window.addEventListener('click', updateInteraction);

    return () => {
      window.removeEventListener('mousemove', updateInteraction);
      window.removeEventListener('keydown', updateInteraction);
      window.removeEventListener('touchstart', updateInteraction);
      window.removeEventListener('click', updateInteraction);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastInteractionRef.current > 120000) {
        setMode('video');
        setVideoKey((prev) => prev + 1);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-screen h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
      {mode === 'intro' && (
        <div className="flex flex-col items-center text-center">
          <h1 className="text-5xl font-extrabold mb-6">Petromac</h1>
          <p className="text-xl h-6 font-medium tracking-wide">{typedText}</p>

          {showButton && (
            <button
              onClick={() => setMode('video')}
              onTouchStart={() => setMode('video')}
              className="mt-12 px-8 py-3 text-lg font-semibold text-white bg-white/10 border border-white/30 rounded-full shadow-lg backdrop-blur hover:bg-white/20 transition-opacity duration-1000 opacity-100"
            >
              Touch to Begin
            </button>
          )}
        </div>
      )}

      {mode === 'video' && (
        <div className="absolute inset-0">
          <ReactPlayer
            key={videoKey}
            url={introVideo}
            playing
            loop
            muted
            width="100%"
            height="100%"
            className="absolute top-0 left-0"
          />

          <div className="absolute inset-0 flex items-end justify-center pb-16 pointer-events-none">
            <button
              onClick={() => router.push('/productlines')}
              className="pointer-events-auto px-8 py-3 text-xl font-semibold text-white bg-white/10 border border-white/30 rounded-full shadow-lg backdrop-blur hover:bg-white/20 transition"
            >
              Tap to Explore
            </button>
          </div>
        </div>
      )}
    </div>
  );
}