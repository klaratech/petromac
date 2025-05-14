'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import CircularGallery from '@/components/CircularGallery';

const MODEL_MAP: Record<string, { name: string; file: string }[]> = {
  focus: [
    { name: 'CP-12', file: '/models/cp12.glb?v=20240509' },
    { name: 'CP-8', file: '/models/cp8.glb?v=20240509' },
    { name: 'Helix', file: '/models/helix.glb?v=20240509' },
  ],
  wirelineexpress: [
    { name: 'TTB-S75', file: '/models/ttbs75.glb?v=20240509' },
  ],
  thor: [
    { name: 'Thor', file: '/models/thor.glb?v=20240509' },
  ],
};

export default function ProductlinesClient() {
  const router = useRouter();
  const [fading, setFading] = useState(false);
  const [selectedModels, setSelectedModels] = useState<{ name: string; file: string }[] | null>(null);
  const [forceSingleModel, setForceSingleModel] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFading(true);
      setTimeout(() => router.push('/?mode=video'), 1000);
    }, 120000);
    return () => clearTimeout(timeout);
  }, [router]);

  const handleProductClick = (productKey: keyof typeof MODEL_MAP) => {
    const models = MODEL_MAP[productKey];
    setSelectedModels(models);
    setForceSingleModel(models.length === 1);
  };

  if (selectedModels) {
    return (
      <CircularGallery
        models={selectedModels}
        onClose={() => {
          setSelectedModels(null);
          setForceSingleModel(false);
        }}
        forceSingleModel={forceSingleModel}
      />
    );
  }

  return (
    <div
      className={`relative w-full h-screen bg-blue-800 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-1000 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <Image
        src="/images/tv-bg.png"
        alt="Background"
        fill
        priority
        className="absolute inset-0 object-cover z-0"
      />

      <div className="relative z-10 flex gap-16 items-center justify-center">
        {/* Wireline Express */}
        <div
          className="w-[220px] h-[220px] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
          onClick={() => handleProductClick('wirelineexpress')}
        >
          <Image
            src="/images/wirelineexpress.png"
            alt="Wireline Express"
            width={180}
            height={180}
            className="rounded-xl shadow-xl object-contain"
          />
        </div>

        {/* Focus */}
        <div
          className="w-[220px] h-[220px] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
          onClick={() => handleProductClick('focus')}
        >
          <Image
            src="/images/focus.png"
            alt="Focus"
            width={180}
            height={180}
            className="rounded-xl shadow-xl object-contain"
          />
        </div>

        {/* Thor */}
        <div
          className="w-[220px] h-[220px] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
          onClick={() => handleProductClick('thor')}
        >
          <Image
            src="/images/thor1.png"
            alt="Thor"
            width={180}
            height={180}
            className="rounded-xl shadow-xl object-contain"
          />
        </div>
      </div>
    </div>
  );
}