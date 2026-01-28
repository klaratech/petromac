import { Suspense } from 'react';
import ProductlinesClient from './ProductlinesClient';

export const dynamic = 'force-dynamic';

export default function ProductlinesPage() {
  return (
    <main className="w-screen h-screen bg-black text-white">
      <Suspense fallback={<div className="p-6">Loading product lines...</div>}>
        <ProductlinesClient />
      </Suspense>
    </main>
  );
}