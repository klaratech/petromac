'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

const videos = ['/videos/dice.mp4','/videos/WirelineExpress.mp4?v=20250519','/videos/helix.mp4?v=20250519', '/videos/pf.mp4?v=250519'];

export default function HomeClient() {
  const [mode, setMode] = useState<'intro' | 'video'>('intro');
  const [typedText, setTypedText] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const fullText = 'Disruptive Conveyance Solutions';
  const lastInteractionRef = useRef(Date.now());

  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'video') {
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
    window.addEventListener('click', updateInteraction);
    window.addEventListener('touchstart', updateInteraction);
    return () => {
      window.removeEventListener('mousemove', updateInteraction);
      window.removeEventListener('keydown', updateInteraction);
      window.removeEventListener('click', updateInteraction);
      window.removeEventListener('touchstart', updateInteraction);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastInteractionRef.current > 30_000) {
        setMode('video');
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleExplore = () => {
    router.push('/productlines');
  };

  return (
    <div className="w-screen h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
      <AnimatePresence>
        {mode === 'intro' && (
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
                onClick={() => setMode('video')}
                className="mt-12 px-8 py-3 text-lg font-semibold text-white bg-white/10 border border-white/30 rounded-full shadow-lg backdrop-blur hover:bg-white/20 transition-opacity duration-1000"
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
            onClick={handleExplore}
            onTouchStart={handleExplore}
          >
            <ReactPlayer
              url={videos[videoIndex]}
              playing
              loop={false}
              muted={false}
              width="100%"
              height="100%"
              className="absolute top-0 left-0"
              onEnded={() => setVideoIndex((prev) => (prev + 1) % videos.length)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}