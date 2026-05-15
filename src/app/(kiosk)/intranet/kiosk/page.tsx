'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONSTANTS, KIOSK_LANE_PATH, VIDEO_SOURCES } from '@/constants/app';

type Lane = 'oh' | 'ch';

function KioskContent() {
  const [mode, setMode] = useState<'intro' | 'video'>('intro');
  const [typedText, setTypedText] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const fullText = 'Disruptive Conveyance Solutions';
  const lastInteractionRef = useRef(0);

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
      i += 1;
      if (i >= fullText.length) {
        clearInterval(interval);
        setTimeout(() => setShowButton(true), APP_CONSTANTS.BUTTON_SHOW_DELAY);
      }
    }, APP_CONSTANTS.TYPING_SPEED);

    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    const updateInteraction = () => {
      lastInteractionRef.current = Date.now();
    };
    updateInteraction();
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
      if (Date.now() - lastInteractionRef.current > APP_CONSTANTS.IDLE_TIMEOUT) {
        setMode('video');
      }
    }, APP_CONSTANTS.IDLE_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Splash → pick a lane → per-lane looping video screen with overlay nav.
  const handleChoose = (lane: Lane) => {
    router.push(`${KIOSK_LANE_PATH}?lane=${lane}`);
  };

  // Tapping the idle attractor video just returns to the lane chooser.
  const handleAttractorTap = () => {
    setMode('intro');
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
              <div className="mt-12 flex gap-6 transition-opacity duration-1000">
                <button
                  onClick={() => handleChoose('oh')}
                  className="px-10 py-4 text-xl font-semibold text-white bg-white/10 border border-white/30 rounded-full shadow-lg backdrop-blur hover:bg-white/20"
                >
                  Open Hole
                </button>
                <button
                  onClick={() => handleChoose('ch')}
                  className="px-10 py-4 text-xl font-semibold text-white bg-white/10 border border-white/30 rounded-full shadow-lg backdrop-blur hover:bg-white/20"
                >
                  Cased Hole
                </button>
              </div>
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
            onClick={handleAttractorTap}
            onTouchStart={handleAttractorTap}
          >
            <video
              key={VIDEO_SOURCES[videoIndex]}
              src={VIDEO_SOURCES[videoIndex]}
              autoPlay
              // Must be muted for browsers to honour autoplay without a
              // user gesture. The idle attractor is reached via timeout
              // (no gesture available); an unmute affordance can be added
              // later if showroom audio is wanted.
              muted
              playsInline
              className="absolute top-0 left-0 w-full h-full object-cover"
              onEnded={() => setVideoIndex((prev) => (prev + 1) % VIDEO_SOURCES.length)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HomeClient() {
  return (
    <Suspense fallback={null}>
      <KioskContent />
    </Suspense>
  );
}
