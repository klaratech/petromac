'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import DeviceViewer from './DeviceViewer';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface ModelItem {
  name: string;
  file: string;
}

interface Props {
  onClose: () => void;
  models: ModelItem[];
  forceSingleModel?: boolean;
}

export default function CircularGallery({
  onClose,
  models,
  forceSingleModel = false,
}: Props) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isZooming, setIsZooming] = useState(false);

  // Preload models
  useEffect(() => {
    models.forEach((m) => useGLTF.preload(m.file));
  }, [models]);

  // Auto-launch viewer if single model
  useEffect(() => {
    if (forceSingleModel && models.length === 1) {
      setSelectedModel(models[0].file);
    }
  }, [forceSingleModel, models]);

  const handleModelClick = (file: string) => {
    setIsZooming(true);
    setTimeout(() => {
      setSelectedModel(file);
      setIsZooming(false);
    }, 600);
  };

  function FloatingModel({
    url,
    position,
    onClick,
  }: {
    url: string;
    position: [number, number, number];
    onClick: () => void;
  }) {
    const { scene } = useGLTF(url);
    const ref = useRef<THREE.Group>(null);
    const [scale, setScale] = useState(1);

    const clonedScene = useMemo(() => {
      const cloned = scene.clone(true);
      cloned.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = false;
          mesh.receiveShadow = false;

          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat?.color) mat.color.multiplyScalar(1.3);
        }
      });
      return cloned;
    }, [scene]);

    useEffect(() => {
      requestAnimationFrame(() => {
        const box = new THREE.Box3().setFromObject(clonedScene);
        const size = box.getSize(new THREE.Vector3()).length();
        const scaleFactor = 4.5 / size;
        setScale(scaleFactor);
      });
    }, [clonedScene]);

    useFrame(({ clock }) => {
      if (ref.current) {
        ref.current.rotation.y = clock.getElapsedTime() * 0.5;
      }
    });

    return (
      <group position={position} onClick={onClick} ref={ref} scale={scale}>
        <Center>
          <primitive object={clonedScene} />
        </Center>
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

  return (
    <div className="w-full h-screen relative group">
      <Image
        src="/images/tv-bg.png"
        alt="Background"
        fill
        priority
        className="absolute inset-0 object-cover z-0"
      />

      <AnimatePresence>
        {!selectedModel && (
          <motion.div
            key="gallery"
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: isZooming ? 1.5 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full absolute inset-0 z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 px-5 py-3 text-white text-sm font-semibold bg-white/10 border border-white/20 rounded-lg shadow-lg backdrop-blur-md hover:bg-white/20"
            >
              ✕ Close
            </button>

            <Canvas shadows camera={{ position: [0, 0, 12], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={0.8} />
              <Suspense fallback={null}>
                <RotatingGroup>
                  {models.map((model, index) => {
                    const angle = (index / models.length) * 2 * Math.PI;
                    const x = Math.cos(angle) * 6;
                    const z = Math.sin(angle) * 6;
                    return (
                      <FloatingModel
                        key={model.name}
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
            className="absolute inset-0 z-10"
          >
            <DeviceViewer
              model={selectedModel}
              directView={forceSingleModel}
              onClose={(reason) => {
                if (reason === 'exit') {
                  onClose(); // Return to productlines
                } else {
                  setSelectedModel(null); // Back to gallery
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}