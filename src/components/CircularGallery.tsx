'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useGLTF, Center } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import DeviceViewer from './DeviceViewer';
import { deviceSpecs } from '@/data/deviceSpecs';
import { motion, AnimatePresence } from 'framer-motion';

const models = [
  { name: 'CP-12', file: '/models/cp12.glb' },
  { name: 'TTB-S75', file: '/models/ttbs75.glb' },
  { name: 'CP-8', file: '/models/cp8.glb' },
  { name: 'Helix', file: '/models/helix.glb' },
];

// Preload all models on startup
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

  useEffect(() => {
    // Scale model uniformly
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3()).length();
    const scaleFactor = 3 / size;
    scene.scale.setScalar(scaleFactor);
  }, [scene]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group position={position} onClick={onClick} ref={ref}>
      <Center>
        <primitive object={scene} />
      </Center>
      <Html center position={[0, -1.2, 0]} distanceFactor={8}>
        <div className="text-white text-xs text-center bg-black/70 px-3 py-1 rounded whitespace-nowrap max-w-[140px]">
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

export default function CircularGallery({ onClose }: { onClose: () => void }) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isZooming, setIsZooming] = useState(false);

  const handleModelClick = (file: string) => {
    setIsZooming(true);
    setTimeout(() => {
      setSelectedModel(file);
      setIsZooming(false);
    }, 600); // match animation duration
  };

  return (
    <div className="w-full h-screen relative group">
      <AnimatePresence>
        {!selectedModel && (
          <motion.div
            key="gallery"
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: isZooming ? 1.5 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full absolute inset-0"
          >
            {/* ✕ Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 px-5 py-3 text-white text-sm font-semibold bg-white/10 border border-white/20 rounded-lg shadow-lg backdrop-blur-md hover:bg-white/20"
            >
              ✕ Close
            </button>

            <Canvas shadows camera={{ position: [0, 0, 12], fov: 50 }}>
              <ambientLight intensity={0.8} />
              <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
              <hemisphereLight intensity={0.3} />
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
                        onClick={() => handleModelClick(model.file)}
                      />
                    );
                  })}
                </RotatingGroup>
              </Suspense>
            </Canvas>
          </motion.div>
        )}

        {selectedModel && (
          <motion.div
            key="viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <DeviceViewer
              model={selectedModel}
              specs={deviceSpecs[selectedModel]}
              onClose={() => setSelectedModel(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}