'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DrilldownMap from '@/components/DrilldownMap';
import operationsData from '@/data/operations_data.json';

interface JobRecord {
  Region: string;
  Country: string;
  Successful: number;
  Job_Status: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const redirectTo = from === 'carousel' ? '/?mode=carousel' : '/';
        window.location.href = redirectTo;
      }
    };

    const handleFullscreenChange = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
      };

      const isFullscreen = document.fullscreenElement || doc.webkitFullscreenElement;
      if (!isFullscreen) {
        const redirectTo = from === 'carousel' ? '/?mode=carousel' : '/';
        window.location.href = redirectTo;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [from]);

  const filteredData: JobRecord[] = (operationsData as JobRecord[]).filter(
    (d) => d.Job_Status === 'Successful'
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6 flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold text-center font-sans">
        🌍 Global Operations Dashboard
      </h1>

      <section className="w-full">
        <DrilldownMap data={filteredData} />
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}