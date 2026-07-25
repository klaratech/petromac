import { Metadata } from 'next';
import TermsContent, { TERMS_TITLE } from '@/components/shared/legal/TermsContent';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of Use for Petromac website',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-brand mb-8">{TERMS_TITLE}</h1>
        <TermsContent />
      </div>
    </div>
  );
}
