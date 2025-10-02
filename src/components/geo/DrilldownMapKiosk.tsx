'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DrilldownMapCore from './DrilldownMapCore';
import type { JobRecord } from '@/types/JobRecord';
import { fetchOperationsData } from '@/lib/map/data';

export default function DrilldownMapKiosk() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const from = searchParams.get('from');
  const redirectTo = from === 'carousel' ? '/?mode=carousel' : '/';

  const [data, setData] = useState<JobRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOperationsData()
      .then((json: JobRecord[]) => {
        setData(json);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load operations data');
      });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push(redirectTo);
    };
    const handleFullscreenChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      const isFullscreen = document.fullscreenElement || doc.webkitFullscreenElement;
      if (!isFullscreen) router.push(redirectTo);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [router, redirectTo]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push(redirectTo)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading map data...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 flex flex-col items-center gap-6 relative">
      <h1 className="text-4xl font-bold text-center font-sans">
        🌍 Global Operations Dashboard
      </h1>

      <section className="w-full">
        <DrilldownMapCore
          data={data}
          showCloseButton={true}
          onClose={() => router.push(redirectTo)}
          showSuccessStoriesLink={true}
        />
      </section>
    </main>
  );
}
