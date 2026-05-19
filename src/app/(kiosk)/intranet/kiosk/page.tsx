'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  APP_CONSTANTS,
  KIOSK_CH_PATH,
  KIOSK_LANE_PATH,
  KIOSK_PRIME_PATH,
} from '@/constants/app';

type Lane = 'oh' | 'ch';

export default function HomeClient() {
  const [typedText, setTypedText] = useState('');
  const [showButton, setShowButton] = useState(false);
  // Start hidden so the fade-in below has a frame to interpolate from.
  // Flipped to `true` on mount via the effect — same effect as the old
  // framer-motion `initial={{opacity:0}} animate={{opacity:1}}`.
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const fullText = 'Disruptive Conveyance Solutions';

  // Type out the tagline once, then reveal the lane buttons. The splash
  // stays on this screen indefinitely — no idle bounce to an attractor.
  useEffect(() => {
    setMounted(true);
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

  // Splash → pick a lane. OH still goes to the looping lane attractor with
  // an overlay button strip (4 products); CH lands directly in the Helix
  // experience because the old CH lane was just a near-identical preview
  // of the same Helix video. Rocker is one corner-badge tap away inside
  // the Helix experience.
  const handleChoose = (lane: Lane) => {
    if (lane === 'ch') {
      router.push(KIOSK_CH_PATH);
    } else {
      router.push(`${KIOSK_LANE_PATH}?lane=${lane}`);
    }
  };

  return (
    <div className="w-screen h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
      {/* CSS opacity transition replaces framer-motion fade-in. No
          backdrop-blur on the buttons — the parent is opaque bg-black
          anyway, blur was a no-op and just cost the mirror encoder
          per-frame composite work. */}
      <div
        className={`flex flex-col items-center text-center transition-opacity duration-500 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h1 className="text-5xl font-extrabold mb-6">Petromac</h1>
        <p className="text-xl h-6 font-medium tracking-wide">{typedText}</p>

        {showButton && (
          <div className="mt-12 flex gap-6">
            <button
              onClick={() => handleChoose('oh')}
              className="px-10 py-4 text-xl font-semibold text-white bg-white/10 border border-white/30 rounded-full shadow-lg hover:bg-white/20 transition-colors"
            >
              Open Hole
            </button>
            <button
              onClick={() => handleChoose('ch')}
              className="px-10 py-4 text-xl font-semibold text-white bg-white/10 border border-white/30 rounded-full shadow-lg hover:bg-white/20 transition-colors"
            >
              Cased Hole
            </button>
          </div>
        )}
      </div>

      {/* Staff utility: route to the prime screen that warms the service-worker
          cache (routes, data, images, flipbooks, balanced 1080p videos) for
          offline use. Kept unobtrusive in the corner so it doesn't compete
          with the two lane CTAs; fades in with the rest of the splash chrome. */}
      <button
        onClick={() => router.push(KIOSK_PRIME_PATH)}
        aria-label="Prime offline assets"
        className={`absolute bottom-6 right-6 flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white/70 shadow-md transition-all duration-500 hover:bg-white/15 hover:text-white ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Inline arrow-clockwise icon — keeps the splash dependency-light
            (no lucide-react import) and crisp at any DPI. */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-3.5 w-3.5"
        >
          <path d="M21 12a9 9 0 1 1-3.51-7.13" />
          <polyline points="21 4 21 10 15 10" />
        </svg>
        <span>Prime offline</span>
      </button>
    </div>
  );
}
