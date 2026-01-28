'use client';

import dynamic from 'next/dynamic';

const DrilldownMapKiosk = dynamic(() => import('@/components/geo/DrilldownMapKiosk'), {
  ssr: false,
  loading: () => <div className="min-h-[600px] flex items-center justify-center" aria-hidden="true">Loading map...</div>,
});

export default function DashboardClient() {
  return <DrilldownMapKiosk />;
}
