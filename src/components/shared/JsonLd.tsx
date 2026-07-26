import { getSiteUrl } from '@/lib/siteUrl';

/**
 * Renders a schema.org JSON-LD block. Server-component-safe — the payload
 * is serialised at build time for SSG pages. Keep the objects minimal and
 * strictly factual; no invented ratings/offers.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output of our own literal objects — no user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const SITE_URL = getSiteUrl();

/** Absolute URL for a /public asset path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

/** Organization schema — used on the homepage. */
export const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Petromac',
  url: SITE_URL,
  logo: absoluteUrl('/images/Petromac-Logo.png.webp'),
  description:
    'Petromac designs and manufactures wireline logging devices, centralisers, and conveyance systems for the global oil & gas industry.',
  sameAs: ['https://www.linkedin.com/company/petromac-ltd/'],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'info@petromac.co.nz',
    contactType: 'sales',
    availableLanguage: 'English',
  },
} as const;
