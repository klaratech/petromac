'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

const models = [
  { name: 'CP-12', file: '/models/CP-12.glb' },
  { name: 'THOR', file: '/models/THOR.glb' },
  { name: 'CP-8', file: '/models/CP-8.glb' },
];

// Preload models for smooth rendering
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
      <Html center distanceFactor={10}>
        <div className="text-white text-sm text-center mt-2 bg-black/60 px-2 py-1 rounded">
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
  onSelectDevice,
}: {
  onSelectDevice: (file: string) => void;
}) {
  return (
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
                onClick={() => onSelectDevice(model.file)}
              />
            );
          })}
        </RotatingGroup>
      </Suspense>
    </Canvas>
  );
}