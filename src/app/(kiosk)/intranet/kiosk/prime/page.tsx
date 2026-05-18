import type { Metadata } from 'next';
import PrimeClient from './PrimeClient';

export const metadata: Metadata = {
  title: 'Prime Offline Kiosk - Petromac',
  description: 'Prime kiosk routes and media for offline trade-show use.',
};

export default function PrimePage() {
  return <PrimeClient />;
}
