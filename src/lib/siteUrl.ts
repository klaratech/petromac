// Fallback when no site URL env is set (local dev, ad-hoc builds) — such
// builds are non-production by definition and ship noindex everywhere.
// (Was the klaratech.it staging URL until that hostname was retired
// post-launch, Jul 2026.)
const DEFAULT_SITE_URL = 'http://localhost:3000';

/** Domains that count as the live production site (www + apex). */
export const PRODUCTION_SITE_URLS = ['https://www.petromac.co.nz', 'https://petromac.co.nz'];

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    DEFAULT_SITE_URL
  ).replace(/\/+$/, '');
}

/**
 * True when this build should be publicly indexable. Staging (klaratech.it,
 * localhost, previews) ships noindex + robots Disallow everywhere; only a
 * build whose site URL is the production domain — or that explicitly sets
 * NEXT_PUBLIC_ENV=production — is indexable. next.config.ts enforces at
 * build time that NEXT_PUBLIC_ENV=production is never combined with a
 * non-production site URL, so a production deploy cannot ship noindex.
 */
export function isProductionSite(): boolean {
  if (process.env.NEXT_PUBLIC_ENV === 'production') return true;
  return PRODUCTION_SITE_URLS.includes(getSiteUrl());
}
