'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense, useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { deviceSpecs } from '@/data/deviceSpecs';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeviceViewer({
  model,
  onClose,
  directView = false,
}: {
  model: string;
  onClose: (reason: 'exit' | 'back') => void;
  directView?: boolean;
}) {
  const [showSpecs, setShowSpecs] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  const cleanModel = model.split('?')[0];
  const entry = deviceSpecs[cleanModel] || {};
  const specs = entry.specs;
  const media = entry.media;

  const handleClose = () => {
    setFadingOut(true);
    setTimeout(() => {
      onClose(directView ? 'exit' : 'back');
    }, 400);
  };

  const Model = () => {
    const { scene } = useGLTF(model);
    const ref = useRef<THREE.Group>(null);

    useEffect(() => {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
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

          {(media?.introVideo || Array.isArray(media?.successStories) || specs) && (
            <div className="absolute top-14 right-4 z-50 w-[260px] bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-gray-300 p-4 overflow-hidden">
              {media?.introVideo && (
                <button
                  onClick={() => setShowVideo(true)}
                  className="w-full py-2 mb-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition"
                >
                  ▶ Introduction
                </button>
              )}

              {Array.isArray(media?.successStories) && media.successStories.length > 0 && (
                <a
                  href={media.successStories[0] ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2 mb-2 text-sm text-center font-medium text-white bg-green-600 rounded hover:bg-green-700 transition"
                >
                  ★ Success Stories
                </a>
              )}

              {specs && (
                <>
                  <button
                    onClick={() => setShowSpecs(!showSpecs)}
                    className="w-full py-2 text-sm font-medium text-white bg-gray-700 rounded hover:bg-gray-800 transition mb-2"
                  >
                    Specifications
                  </button>

                  <div
                    className={`transition-all duration-300 overflow-hidden ${
                      showSpecs ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                      <h2 className="text-md font-semibold mb-2 text-gray-800">Specifications</h2>
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
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {showVideo && media?.introVideo && (
            <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
              <video
                src={media.introVideo}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}