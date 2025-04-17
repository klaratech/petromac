'use client';

import { useEffect, useState, Suspense } from 'react';
import CircularGallery from '@/components/CircularGallery';
import DeviceViewer from '@/components/DeviceViewer';

export default function CatalogPage() {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedDevice) {
          setSelectedDevice(null);
        } else {
          window.location.href = '/?mode=carousel';
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedDevice]);

  return (
    <main className="w-screen h-screen bg-black text-white">
      <Suspense fallback={<div className="p-6">Loading 3D content...</div>}>
        {selectedDevice ? (
          <DeviceViewer model={selectedDevice} onClose={() => setSelectedDevice(null)} />
        ) : (
          <CircularGallery onSelectDevice={setSelectedDevice} />
        )}
      </Suspense>
    </main>
  );
}