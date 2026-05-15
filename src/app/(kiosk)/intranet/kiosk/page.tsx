'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { APP_CONSTANTS, KIOSK_LANE_PATH } from '@/constants/app';

type Lane = 'oh' | 'ch';

export default function HomeClient() {
  const [typedText, setTypedText] = useState('');
  const [showButton, setShowButton] = useState(false);
  const router = useRouter();
  const fullText = 'Disruptive Conveyance Solutions';

  // Type out the tagline once, then reveal the lane buttons. The splash
  // stays on this screen indefinitely — no idle bounce to an attractor.
  useEffect(() => {
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
  }, []);

  // Splash → pick a lane → per-lane looping video screen with overlay nav.
  const handleChoose = (lane: Lane) => {
    router.push(`${KIOSK_LANE_PATH}?lane=${lane}`);
  };

  return (
    <div className="w-screen h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
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
    </div>
  );
}
