'use client';

import { useEffect, useState } from 'react';
import DrilldownMapCore from './DrilldownMapCore';
import type { JobRecord } from '@/types/JobRecord';
import { fetchOperationsData } from '@/lib/map/data';

export default function DrilldownMapPublic() {
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

  if (error) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Data</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 text-lg">Loading map data...</p>
      </div>
    );
  }

  return (
    <DrilldownMapCore
      data={data}
      showCloseButton={false}
      showSuccessStoriesLink={false}
      className="relative w-full h-[80vh] overflow-hidden bg-white rounded-lg shadow-lg"
    />
  );
}
