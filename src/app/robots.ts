import type { MetadataRoute } from 'next';
import { getSiteUrl, isProductionSite } from '@/lib/siteUrl';

const BASE_URL = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  // Staging/preview: nothing is crawlable (pages also carry meta noindex
  // and an X-Robots-Tag header — see src/lib/siteUrl.ts).
  if (!isProductionSite()) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }
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
