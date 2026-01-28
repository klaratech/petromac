import { Metadata } from 'next';
import SuccessStoriesFlipbook from '@/features/success-stories/components/SuccessStoriesFlipbook';

export const metadata: Metadata = {
  title: 'Success Stories - Petromac Kiosk',
  description: 'Browse and filter Petromac success stories by various criteria',
};

export default function SuccessStoriesPage() {
  return (
    <SuccessStoriesFlipbook
      backHref="/intranet/kiosk/dashboard"
      backLabel="Back to Track Record"
    />
  );
}
