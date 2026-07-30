import { pageMetadata } from '@/lib/seo';
import PatentsClient from './PatentsClient';

export const metadata = pageMetadata({
  title: 'Patents — Wireline Conveyance & Centralisation',
  description:
    "Petromac's granted patents for Wireline Express, Pathfinder, and Focus precision centraliser technologies.",
  path: '/about/patents',
});

export default function PatentsPage() {
  return <PatentsClient />;
}
