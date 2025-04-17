'use client';

import DrilldownMap from '@/components/DrilldownMap';
import operationsData from '@/data/operations_data.json';

export default function DashboardPage() {
  // Pre-filtered to only include successful jobs
  const filteredData = operationsData.filter(
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