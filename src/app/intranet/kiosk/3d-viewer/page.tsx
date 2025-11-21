import { Suspense } from 'react';
import ModelViewerClient from './ModelViewerClient';

export const dynamic = 'force-dynamic';

export default function ModelViewerPage() {
  return (
    <main className="w-screen h-screen bg-black text-white">
      <Suspense fallback={<div className="p-6">Loading 3D content...</div>}>
        <ModelViewerClient />
      </Suspense>
    </main>
  );
}
