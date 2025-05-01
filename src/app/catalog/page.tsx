import { Suspense } from 'react';
import CatalogClient from './CatalogClient';

export const dynamic = 'force-dynamic';

export default function CatalogPage() {
  return (
    <main className="w-screen h-screen bg-black text-white">
      <Suspense fallback={<div className="p-6">Loading 3D content...</div>}>
        <CatalogClient />
      </Suspense>
    </main>
  );
}