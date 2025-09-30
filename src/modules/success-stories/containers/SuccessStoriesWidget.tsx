'use client';

import { SuccessStoriesPanel } from '@/components/shared/panels';

export default function SuccessStoriesWidget() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Success Stories Filter</h2>
      <SuccessStoriesPanel dense />
    </div>
  );
}
