'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DrilldownMap from '@/components/kiosk/DrilldownMap';
import type { JobRecord } from '@/types/JobRecord';

export default function DashboardClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const from = searchParams.get('from');
  const redirectTo = from === 'carousel' ? '/?mode=carousel' : '/';

  const [data, setData] = useState<JobRecord[] | null>(null);

  useEffect(() => {
    fetch('/data/operations_data.json')
      .then((res) => res.json())
      .then((json: JobRecord[]) => {
        // If Job_Status is no longer part of JobRecord, remove the filter below
        // const successfulOnly = json.filter((d) => d.Job_Status === 'Successful');
        // setData(successfulOnly);
        setData(json);
      })
      .catch(() => {
        // Error handled silently - user sees "Loading..." indefinitely
        // In production, you might want to show a user-friendly error message
        // or retry the request
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

  return (
    <main className="min-h-screen bg-gray-50 p-6 flex flex-col items-center gap-6 relative">
      <h1 className="text-4xl font-bold text-center font-sans">
        🌍 Global Operations Dashboard
      </h1>

      <section className="w-full">
        {data ? (
          <DrilldownMap data={data} />
        ) : (
          <p className="text-gray-500 text-lg text-center mt-10">Loading map data...</p>
        )}
      </section>

      <button
        onClick={() => router.push(redirectTo)}
        className="absolute top-4 right-4 px-4 py-2 text-sm font-semibold text-white bg-black/40 border border-white/30 rounded-lg shadow-lg backdrop-blur hover:bg-black/60 transition"
      >
        ✕ Close
      </button>
    </main>
  );
}
