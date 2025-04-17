'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DrilldownMap from '@/components/DrilldownMap';
import operationsData from '@/data/operations_data.json';

interface JobRecord {
  Region: string;
  Country: string;
  Successful: number;
  Job_Status: string;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.location.href = from === 'carousel' ? '/?mode=carousel' : '/';
      }
    };

    const handleFullscreenChange = () => {
      const isFullscreen =
        document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (!isFullscreen) {
        window.location.href = from === 'carousel' ? '/?mode=carousel' : '/';
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

  const filteredData: JobRecord[] = operationsData.filter(
    (d: JobRecord) => d.Job_Status === 'Successful'
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