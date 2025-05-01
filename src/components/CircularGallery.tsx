'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import { Suspense, useRef, useState } from 'react';
import * as THREE from 'three';
import DeviceViewer from './DeviceViewer'; // Adjust the import path if needed
import { deviceSpecs } from '@/data/deviceSpecs';

const models = [
  { name: 'CP-12', file: '/models/cp12.glb' },
  { name: 'TTB-S75', file: '/models/ttbs75.glb' },
  { name: 'CP-8', file: '/models/CP8.glb' },
  { name: 'Helix', file: '/models/helix.glb' },
  
];

// Preload models
models.forEach((m) => useGLTF.preload(m.file));

function FloatingModel({
  url,
  name,
  position,
  onClick,
}: {
  url: string;
  name: string;
  position: [number, number, number];
  onClick: () => void;
}) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group position={position} onClick={onClick} ref={ref}>
      <primitive object={scene} scale={1.5} />
      <Html center position={[0, -1.8, 0]} distanceFactor={10}>
        <div className="text-white text-sm text-center bg-black/60 px-2 py-1 rounded mt-2">
          {name}
        </div>
      </Html>
    </group>
  );
}

function RotatingGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

export default function CircularGallery({
  onClose,
}: {
  onClose: () => void;
}) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  if (selectedModel) {
    return (
      <DeviceViewer
        model={selectedModel}
        specs={deviceSpecs[selectedModel]}
        onClose={() => setSelectedModel(null)}
      />
    );
  }

  return (
    <div className="w-full h-screen relative group">
      {/* ✕ Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 px-4 py-2 text-white text-sm font-semibold bg-white/10 border border-white/20 rounded-lg shadow-lg backdrop-blur-md transition-opacity
                 opacity-100 touch:opacity-100 group-hover:opacity-100 hover:bg-white/20"
        style={{ transition: 'opacity 0.3s ease' }}
      >
        ✕ Close
      </button>

      <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} />
        <Suspense fallback={null}>
          <RotatingGroup>
            {models.map((model, index) => {
              const angle = (index / models.length) * 2 * Math.PI;
              const x = Math.cos(angle) * 6;
              const z = Math.sin(angle) * 6;
              return (
                <FloatingModel
                  key={model.name}
                  name={model.name}
                  url={model.file}
                  position={[x, 0, z]}
                  onClick={() => setSelectedModel(model.file)}
                />
              );
            })}
          </RotatingGroup>
        </Suspense>
      </Canvas>
    </div>
  );
}