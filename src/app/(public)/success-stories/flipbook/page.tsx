import SuccessStoriesFlipbook from '@/features/success-stories/components/SuccessStoriesFlipbook';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Success Stories',
  description:
    'Browse Petromac wireline logging success stories from operations across 50+ countries worldwide.',
};

export default function SuccessStoriesFlipbookPage() {
  return <SuccessStoriesFlipbook backHref="/track-record" backLabel="Back to Track Record" />;
}
