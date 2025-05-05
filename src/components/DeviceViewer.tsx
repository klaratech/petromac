'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense, useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { deviceSpecs } from '@/data/deviceSpecs';

export default function DeviceViewer({
  model,
  onClose,
}: {
  model: string;
  onClose: () => void;
}) {
  const [showSpecs, setShowSpecs] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const entry = deviceSpecs[model] || {};
  const specs = entry.specs;
  const media = entry.media;

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
    <div className="w-screen h-screen relative group bg-black">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }} shadows>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} castShadow />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} />
        <hemisphereLight intensity={0.1} />
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

      {/* ✕ Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 px-4 py-2 text-white text-sm font-semibold bg-white/10 border border-white/20 rounded-lg shadow-lg backdrop-blur-md transition-opacity hover:bg-white/20"
      >
        ✕ Close
      </button>

      {/* Toggle Specs Button */}
      {specs && (
        <button
          onClick={() => setShowSpecs(!showSpecs)}
          className="absolute top-4 left-4 z-50 px-3 py-1 text-xs font-medium rounded-lg bg-white/20 text-white hover:bg-white/30 border border-white/30 backdrop-blur transition-all"
        >
          {showSpecs ? 'Hide Specs' : 'Show Specs'}
        </button>
      )}

      {/* Specs Panel */}
      {specs && showSpecs && (
        <div className="absolute top-14 left-4 z-40 w-[300px] max-h-[80vh] overflow-auto bg-white/90 backdrop-blur-md rounded-xl shadow-xl p-4 border border-gray-300">
          <h2 className="text-lg font-semibold mb-3 text-gray-900">Specifications</h2>
          <table className="w-full text-sm text-left mb-4">
            <tbody>
              {Object.entries(specs).map(([key, value]) => (
                <tr key={key} className="border-b border-gray-200 last:border-b-0">
                  <td className="py-1 pr-4 text-gray-600 font-medium">{key}</td>
                  <td className="py-1 text-gray-800">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Media Panel */}
      {(media?.introVideo || media?.successStories?.length) && (
        <div className="absolute top-14 right-4 z-40 w-[300px] max-h-[80vh] overflow-auto bg-white/90 backdrop-blur-md rounded-xl shadow-xl p-4 border border-gray-300">
          {media?.introVideo && (
            <button
              onClick={() => setShowVideo(true)}
              className="w-full py-2 mb-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition"
            >
              ▶ Introduction
            </button>
          )}
          {media?.successStories && media.successStories.length > 0 && (
            <a
              href={media.successStories[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2 mb-2 text-sm text-center font-medium text-white bg-green-600 rounded hover:bg-green-700 transition"
            >
              ★ Success Stories
            </a>
          )}
        </div>
      )}

      {/* Video Overlay */}
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
    </div>
  );
}