import { pageMetadata } from '@/lib/seo';
import PrivacyContent, { PRIVACY_TITLE } from '@/components/shared/legal/PrivacyContent';

export const metadata = pageMetadata({
  title: 'Privacy Policy',
  description:
    'How Petromac collects, uses and protects personal information submitted through this website, including contact enquiries and cookieless analytics.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-brand mb-8">{PRIVACY_TITLE}</h1>
        <PrivacyContent />
      </div>
    </div>
  );
}
