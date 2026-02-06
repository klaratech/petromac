'use client';

import { deviceSpecs, systemMedia } from '@modules/catalog/data/deviceSpecs';
import { useEffect, useRef, useState } from 'react';
import useOperationsData from '@/hooks/useOperationsData';
import { motion, AnimatePresence } from 'framer-motion';
import CircularGallery from '@/components/kiosk/CircularGallery';
import DrilldownMapCore from '@/components/geo/DrilldownMapCore';
import type { JobRecord } from '@/types/JobRecord';

interface Props {
  system: string;
  onClose: () => void;
  onVideoPlay?: () => void;
  onVideoPause?: () => void;
}

export default function SystemModal({
  system,
  onClose,
  onVideoPlay,
  onVideoPause
}: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [showDrilldown, setShowDrilldown] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const { data: jobData } = useOperationsData<JobRecord>({ enabled: showDrilldown });

  const media = systemMedia[system];
  const videoSrc = media?.video;

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [onClose]);

  // No longer need manual fetch; jobData is provided by useOperationsData hook.

  const models = Object.entries(deviceSpecs)
    .filter(([, d]) => d.system === system)
    .map(([file, d]) => ({ name: d.specs.Name, file }));

  const renderCloseButton = () => (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 text-white text-xl font-bold z-50"
    >
      ✕
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
      >
        <div className="relative w-full h-full bg-black">
          {showDrilldown && jobData ? (
            <DrilldownMapCore
              data={jobData}
              initialSystem={system}
              showCloseButton={true}
              onClose={() => setShowDrilldown(false)}
              showSuccessStoriesLink={true}
            />
          ) : showGallery ? (
            <CircularGallery
              models={models}
              onClose={() => setShowGallery(false)}
              forceSingleModel={models.length === 1}
            />
          ) : (
            <>
              {videoSrc ? (
                <video
                  ref={ref}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  src={videoSrc}
                  onPlay={onVideoPlay}
                  onPause={onVideoPause}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xl">
                  No intro video available for {system}
                </div>
              )}
              {renderCloseButton()}
              <div className="absolute bottom-6 right-6 flex gap-4 z-40">
                <button
                  onClick={() => setShowDrilldown(true)}
                  className="bg-white text-black px-4 py-2 rounded-md shadow-md hover:bg-gray-200"
                >
                  Track Record
                </button>
                <button
                  onClick={() => setShowGallery(true)}
                  className="bg-white text-black px-4 py-2 rounded-md shadow-md hover:bg-gray-200"
                >
                  More Info
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
