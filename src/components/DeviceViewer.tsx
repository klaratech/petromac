'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage } from '@react-three/drei';
import { Suspense, useState } from 'react';

export default function DeviceViewer({
  model,
  specs,
  onClose,
}: {
  model: string;
  specs?: Record<string, string>;
  onClose: () => void;
}) {
  const [showSpecs, setShowSpecs] = useState(true);

  const Model = () => {
    const { scene } = useGLTF(model);
    return <primitive object={scene} scale={2.5} />;
  };

  return (
    <div className="w-screen h-screen relative group bg-black">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }} shadows>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} />
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6} shadows>
            <Model />
          </Stage>
          <OrbitControls enablePan enableZoom enableRotate />
        </Suspense>
      </Canvas>

      {/* ✕ Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 px-4 py-2 text-white text-sm font-semibold bg-white/10 border border-white/20 rounded-lg shadow-lg backdrop-blur-md transition-opacity
                   opacity-100 touch:opacity-100 group-hover:opacity-100 hover:bg-white/20"
        style={{ transition: 'opacity 0.3s ease' }}
      >
        ✕ Close
      </button>

      {/* Toggle Button for Specs */}
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
          <table className="w-full text-sm text-left">
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
    </div>
  );
}

// Preload models
useGLTF.preload('/models/CP-12.glb');
useGLTF.preload('/models/THOR.glb');
useGLTF.preload('/models/CP-8.glb');