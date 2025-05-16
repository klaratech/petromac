// ProductlinesClient.tsx
'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deviceSpecs } from '@/data/deviceSpecs';
import SystemModal from '@/components/SystemModal';
import { featuredSystems } from '@/config/featuredSystems';

// Derive filtered system names and their icons from deviceSpecs
const systemMap = Object.values(deviceSpecs).reduce<Record<string, string>>((acc, device) => {
  if (device.system && featuredSystems.includes(device.system) && !acc[device.system]) {
    acc[device.system] = device.systemIcon;
  }
  return acc;
}, {});

const systemList = Object.entries(systemMap); // [ ["Focus", "/images/focus.png"], ... ]

export default function ProductlinesClient() {
  const router = useRouter();
  const [fading, setFading] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  useEffect(() => {
    const fadeTimeout = setTimeout(() => {
      setFading(true);
      const navTimeout = setTimeout(() => {
        router.push('/?mode=video');
      }, 1000);
      return () => clearTimeout(navTimeout);
    }, 120000);
    return () => clearTimeout(fadeTimeout);
  }, [router]);

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
        {systemList.map(([system, icon]) => (
          <div
            key={system}
            className="w-[220px] h-[220px] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setSelectedSystem(system)}
          >
            <Image
              src={icon}
              alt={system}
              width={180}
              height={180}
              className="rounded-xl shadow-xl object-contain"
            />
          </div>
        ))}
      </div>

      {selectedSystem && (
        <SystemModal
          system={selectedSystem}
          onClose={() => setSelectedSystem(null)}
        />
      )}
    </div>
  );
}