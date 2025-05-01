'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CircularGallery from '@/components/CircularGallery';

export default function CatalogClient() {
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

  return (
    <CircularGallery onClose={() => router.push('/?mode=carousel')} />
  );
}