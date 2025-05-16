// SystemModal.tsx
'use client';

import { deviceSpecs } from '@/data/deviceSpecs';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  system: string;
  onClose: () => void;
}

export default function SystemModal({ system, onClose }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);

  // Get the first video for this system from deviceSpecs
  const videoSrc = Object.values(deviceSpecs).find(
    (d) => d.system === system && d.media?.introVideo
  )?.media?.introVideo;

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center"
      >
        <div className="relative w-[90vw] h-[70vh] bg-black shadow-2xl rounded-xl overflow-hidden">
          {videoSrc ? (
            <video
              ref={ref}
              controls
              autoPlay
              className="w-full h-full object-contain"
              src={videoSrc}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-xl">
              No intro video available for {system}
            </div>
          )}
          <button
            onClick={() => onClose()}
            className="absolute top-4 right-4 text-white text-xl font-bold"
          >
            ✕
          </button>
          <button
            onClick={() =>
              window.location.href = `/success?system=${encodeURIComponent(system)}`
            }
            className="absolute bottom-6 right-6 bg-white text-black px-4 py-2 rounded-md shadow-md hover:bg-gray-200"
          >
            Success Stories
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}