"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";

const DrilldownMapPublic = dynamic(
  () => import("@/components/geo/DrilldownMapPublic"),
  { ssr: false }
);

export default function TrackRecordPage() {
  useEffect(() => {
    document.title = "Track Record | Petromac";
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold">Track Record</h1>
      <p className="mb-6 text-gray-600">
        Explore our global deployment history and operational track record across the world.
      </p>
      <DrilldownMapPublic />
    </main>
  );
}
