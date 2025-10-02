'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CircularGallery from '@/components/kiosk/CircularGallery';

const models = [
  { name: 'TTB-S75', file: '/models/ttbs75.glb' },
  { name: 'CP-12', file: '/models/cp12.glb' },
  { name: 'CP-8', file: '/models/cp8.glb' },
  { name: 'Helix', file: '/models/helix.glb' },
];

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
    <CircularGallery
      models={models}
      onClose={() => router.push('/?mode=carousel')}
    />
  );
}