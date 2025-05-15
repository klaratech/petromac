'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

const videos = ['/videos/intro-loop1.mp4', '/videos/intro-loop2.mp4'];

export default function HomeClient() {
  const [mode, setMode] = useState<'intro' | 'video'>('intro');
  const [typedText, setTypedText] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [showExploreButton, setShowExploreButton] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const [videoStartTime, setVideoStartTime] = useState<number | null>(null);
  const [videoIndex, setVideoIndex] = useState(0); // alternates between 0 and 1

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

  useEffect(() => {
    if (showExploreButton) {
      const timeout = setTimeout(() => {
        setShowExploreButton(false);
        setVideoIndex((prev) => (prev + 1) % videos.length);
        setVideoKey((prev) => prev + 1);
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [showExploreButton]);

  const handleStartVideo = () => {
    setMode('video');
    setVideoStartTime(Date.now());
  };

  const handleExplore = () => {
    if (videoStartTime && Date.now() - videoStartTime < 2000) return;
    setFadingOut(true);
    setTimeout(() => router.push('/productlines'), 500);
  };

  return (
    <div className="w-screen h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
      <AnimatePresence>
        {mode === 'intro' && !fadingOut && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center"
          >
            <h1 className="text-5xl font-extrabold mb-6">Petromac</h1>
            <p className="text-xl h-6 font-medium tracking-wide">{typedText}</p>

            {showButton && (
              <button
                onClick={handleStartVideo}
                onTouchStart={handleStartVideo}
                className="mt-12 px-8 py-3 text-lg font-semibold text-white bg-white/10 border border-white/30 rounded-full shadow-lg backdrop-blur hover:bg-white/20 transition-opacity duration-1000 opacity-100"
              >
                Touch to Begin
              </button>
            )}
          </motion.div>
        )}

        {mode === 'video' && (
          <motion.div
            key="video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-10"
          >
            <ReactPlayer
              key={videoKey}
              url={videos[videoIndex]}
              playing
              loop={false}
              muted
              width="100%"
              height="100%"
              className="absolute top-0 left-0"
              onStart={() => setVideoStartTime(Date.now())}
              onEnded={() => setShowExploreButton(true)}
            />

            <button
              onClick={handleExplore}
              className="absolute inset-0 z-20 w-full h-full bg-transparent cursor-pointer"
              aria-label="Tap to explore"
            />

            {showExploreButton && (
              <div className="absolute inset-0 z-30 flex items-end justify-center pb-16">
                <button
                  onClick={handleExplore}
                  className="px-8 py-3 text-xl font-semibold text-white bg-white/10 border border-white/30 rounded-full shadow-lg backdrop-blur hover:bg-white/20 transition-opacity duration-500"
                >
                  Tap to Explore
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}