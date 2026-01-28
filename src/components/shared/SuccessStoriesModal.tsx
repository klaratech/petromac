"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { FLIPBOOK_KEYS, buildFlipbookPageUrls } from "@/features/flipbooks";
import { useFlipbookManifest } from "@/features/flipbooks/hooks/useFlipbookManifest";

const Flipbook = dynamic(() => import("@/components/shared/pdf/Flipbook"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full" aria-hidden="true">Loading flipbook...</div>,
});

interface Props {
  onClose: () => void;
}

export default function SuccessStoriesModal({ onClose }: Props) {
  const { manifest } = useFlipbookManifest(FLIPBOOK_KEYS.successStories);
  const pages = manifest ? buildFlipbookPageUrls(FLIPBOOK_KEYS.successStories, manifest) : [];

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full h-full max-w-7xl bg-white rounded-lg shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Success Stories</h2>
              <p className="text-blue-100 text-sm">Explore our project successes around the world</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl font-bold transition-colors"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Flipbook Content */}
          <div className="h-[calc(100%-5rem)] overflow-auto bg-gray-100 flex items-center justify-center">
            {manifest ? (
              <Flipbook pages={pages} width={500} height={700} />
            ) : (
              <div className="text-gray-600">Loading flipbook...</div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
