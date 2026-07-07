import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteUrl';

const BASE_URL = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // No trailing slash: '/intranet/' would leave the bare /intranet
        // landing page crawlable. '/intranet' covers it and the subtree.
        disallow: ['/intranet', '/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
