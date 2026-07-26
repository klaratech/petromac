import SuccessStoriesFlipbook from '@/features/success-stories/components/SuccessStoriesFlipbook';
import { pageMetadata } from '@/lib/seo';
import operationsStats from '../../../../../public/data/operations_stats.json';

export const metadata = pageMetadata({
  title: 'Success Stories',
  description: `Browse Petromac wireline logging success stories from operations across ${operationsStats.countries}+ countries worldwide.`,
  path: '/success-stories/flipbook',
});

export default function SuccessStoriesFlipbookPage() {
  return <SuccessStoriesFlipbook backHref="/track-record" backLabel="Back to Track Record" />;
}
