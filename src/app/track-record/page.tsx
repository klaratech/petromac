"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const SuccessStoriesModal = dynamic(
  () => import("@/components/shared/SuccessStoriesModal"),
  { ssr: false }
);

const DrilldownMapPublic = dynamic(
  () => import("@/components/geo/DrilldownMapPublic"),
  { 
    ssr: false,
    loading: () => <div className="min-h-[600px] flex items-center justify-center" aria-hidden="true">Loading map...</div>,
  }
);

export default function TrackRecordPage() {
  const [showSuccessStories, setShowSuccessStories] = useState(false);

  useEffect(() => {
    document.title = "Track Record | Petromac";
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Track Record</h1>
          <p className="text-gray-600">
            Explore our global deployment history and operational track record across the world.
          </p>
        </div>
        <button
          onClick={() => setShowSuccessStories(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md whitespace-nowrap"
        >
          Success Stories
        </button>
      </div>
      <DrilldownMapPublic />
      
      {showSuccessStories && (
        <SuccessStoriesModal onClose={() => setShowSuccessStories(false)} />
      )}
    </main>
  );
}
