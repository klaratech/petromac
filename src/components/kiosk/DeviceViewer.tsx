'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { deviceSpecs, systemMedia } from '@modules/catalog/data/deviceSpecs';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import DrilldownMapCore from '@/components/geo/DrilldownMapCore';

import type { JobRecord } from '@/types/JobRecord';

export default function DeviceViewer({
  model,
  onClose,
}: {
  model: string;
  onClose: () => void;
}) {
  const [showSpecs, setShowSpecs] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showSuccessMap, setShowSuccessMap] = useState(false);
  const [drilldownData, setDrilldownData] = useState<JobRecord[] | null>(null);
  const [fadingOut, setFadingOut] = useState(false);

  const cleanModel = model.split('?')[0];
  const entry = deviceSpecs[cleanModel] || {};
  const specs = entry.specs;
  const system = entry.system;
  const video = system ? systemMedia[system]?.video : undefined;

  const handleClose = useCallback(() => {
    setFadingOut(true);
    setTimeout(() => {
      onClose();
    }, 400);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showVideo) setShowVideo(false);
        else if (showSuccessMap) setShowSuccessMap(false);
        else if (showSpecs) setShowSpecs(false);
        else handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showVideo, showSuccessMap, showSpecs, handleClose]);

  useEffect(() => {
    fetch('/data/operations_data.json', { cache: 'force-cache' })
      .then((res) => res.json())
      .then((json) => {
        setDrilldownData(json);
      })
      .catch(() => {
        // Error handled silently
      });
  }, []);

  const Model = () => {
    const { scene } = useGLTF(model);
    const ref = useRef<THREE.Group>(null);

    useEffect(() => {
      scene.traverse((child) => {
        const mesh = child as unknown as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
    }, [scene]);

    useFrame(() => {
      if (ref.current && !isUserInteracting) {
        ref.current.rotation.y += 0.002;
      }
    });

    return (
      <group ref={ref}>
        <primitive object={scene} scale={6} />
      </group>
    );
  };

  return (
    <AnimatePresence>
      {!fadingOut && (
        <motion.div
          key="device-viewer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="w-screen h-screen relative group"
        >
          <Image
            src="/images/tv-bg.png"
            alt="Background"
            fill
            priority
            className="absolute inset-0 object-cover z-0"
          />

          <Canvas camera={{ position: [0, 0, 10], fov: 50 }} shadows>
            <ambientLight intensity={0.02} />
            <directionalLight position={[4, 4, 6]} intensity={0.15} castShadow />
            <directionalLight position={[-3, -3, -4]} intensity={0.1} />
            <Suspense fallback={null}>
              <Model />
              <OrbitControls
                enablePan
                enableZoom
                enableRotate
                onStart={() => setIsUserInteracting(true)}
                onEnd={() => setIsUserInteracting(false)}
              />
            </Suspense>
          </Canvas>

          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-50 px-4 py-2 text-white text-sm font-semibold bg-white/10 border border-white/20 rounded-lg shadow-lg backdrop-blur-md transition-opacity hover:bg-white/20"
          >
            ✕ Close
          </button>

          {(video || specs) && (
            <div className="absolute top-14 right-4 z-50 w-[260px] bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-gray-300 p-4 overflow-hidden">
              {video && (
                <button
                  onClick={() => setShowVideo(true)}
                  className="w-full py-2 mb-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition"
                >
                  ▶ Introduction
                </button>
              )}

              {system && (
                <button
                  onClick={() => setShowSuccessMap(true)}
                  className="w-full py-2 mb-2 text-sm text-center font-medium text-white bg-green-600 rounded hover:bg-green-700 transition"
                >
                  ★ Success Stories
                </button>
              )}

              {specs && (
                <button
                  onClick={() => setShowSpecs(true)}
                  className="w-full py-2 text-sm font-medium text-white bg-gray-700 rounded hover:bg-gray-800 transition mb-2"
                >
                  Specifications
                </button>
              )}
            </div>
          )}

          {showVideo && video && (
            <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
              <video
                src={video}
                controls
                autoPlay
                className="w-full h-full object-contain bg-black"
              />
              <button
                onClick={() => setShowVideo(false)}
                className="absolute top-4 right-4 px-5 py-2 text-white bg-white/10 border border-white/20 rounded-lg shadow-lg backdrop-blur hover:bg-white/20 text-sm font-semibold"
              >
                ✕ Close
              </button>
            </div>
          )}

          {showSuccessMap && (
            <div className="absolute inset-0 z-50 bg-white">
              {drilldownData ? (
                <DrilldownMapCore
                  data={drilldownData}
                  initialSystem={system}
                  showCloseButton={true}
                  onClose={() => setShowSuccessMap(false)}
                  showSuccessStoriesLink={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-lg text-gray-600">Loading map data...</p>
                </div>
              )}
            </div>
          )}

          {showSpecs && specs && (
            <motion.div
              drag
              dragConstraints={{ left: 0, top: 0, right: 1000, bottom: 800 }}
              className="absolute top-20 left-20 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 cursor-grab"
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Specifications</h2>
              <table className="w-full text-sm text-left">
                <tbody>
                  {Object.entries(specs).map(([key, value]) => (
                    <tr key={key} className="border-b border-gray-200 last:border-b-0">
                      <td className="py-1 pr-3 text-gray-600 font-medium">{key}</td>
                      <td className="py-1 text-gray-800">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={() => setShowSpecs(false)}
                className="absolute top-2 right-2 px-3 py-1 text-white bg-black/50 border border-white/20 rounded-lg text-sm hover:bg-black/70"
              >
                ✕
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
