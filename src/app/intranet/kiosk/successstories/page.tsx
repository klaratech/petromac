import { Metadata } from 'next';
import SuccessStoriesClient from './SuccessStoriesClient';

export const metadata: Metadata = {
  title: 'Success Stories - Petromac Kiosk',
  description: 'Browse and filter Petromac success stories by various criteria',
};

export default function SuccessStoriesPage() {
  return <SuccessStoriesClient />;
}
