'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import CircularGallery from '@/components/CircularGallery';

export default function CatalogPage() {
  const router = useRouter();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('/?mode=carousel');
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [router]);

  const handleCloseGallery = () => {
    router.push('/?mode=carousel');
  };

  return (
    <main className="w-screen h-screen bg-black text-white">
      <Suspense fallback={<div className="p-6">Loading 3D content...</div>}>
        <CircularGallery onClose={handleCloseGallery} />
      </Suspense>
    </main>
  );
}