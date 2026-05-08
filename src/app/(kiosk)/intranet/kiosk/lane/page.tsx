import { Suspense } from 'react';
import LaneClient from './LaneClient';

export const dynamic = 'force-dynamic';

export default function LanePage() {
  return (
    <main className="w-screen h-screen bg-black text-white">
      <Suspense fallback={<div className="p-6">Loading…</div>}>
        <LaneClient />
      </Suspense>
    </main>
  );
}
