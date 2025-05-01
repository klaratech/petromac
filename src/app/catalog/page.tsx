'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import CircularGallery from '@/components/CircularGallery';

export default function CatalogPage() {
  const router = useRouter();

  const returnToCarousel = () => {
    router.push('/?mode=carousel');
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        returnToCarousel();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [router]);

  return (
    <main className="w-screen h-screen bg-black text-white">
      <Suspense fallback={<div className="p-6">Loading 3D content...</div>}>
        <CircularGallery onClose={returnToCarousel} />
      </Suspense>
    </main>
  );
}