'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage } from '@react-three/drei';
import { Suspense } from 'react';

export default function DeviceViewer({
  model,
  onClose,
}: {
  model: string;
  onClose: () => void;
}) {
  const Model = () => {
    const { scene } = useGLTF(model);
    return <primitive object={scene} scale={2.5} />;
  };

  return (
    <div className="w-screen h-screen relative">
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
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white text-black px-4 py-2 rounded shadow hover:bg-gray-100"
      >
        ✕ Close
      </button>
    </div>
  );
}

useGLTF.preload('/models/CP-12.glb');
useGLTF.preload('/models/THOR.glb');
useGLTF.preload('/models/CP-8.glb');