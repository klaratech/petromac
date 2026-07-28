import Script from 'next/script';
import { isProductionSite } from '@/lib/siteUrl';

/**
 * Cloudflare Web Analytics.
 *
 * Chosen over GA4 deliberately: it is COOKIELESS and does no cross-site
 * tracking or fingerprinting, so it needs no consent banner — which the site
 * doesn't have and, as things stand, doesn't need (see PrivacyContent).
 * GA4 would set cookies, which for EU visitors means a consent mechanism and
 * a materially bigger job than the analytics itself.
 *
 * Only loads on the PRODUCTION site, so test.petromac.co.nz traffic (us) never
 * pollutes the numbers, and only when a token is configured — so dev and any
 * deploy without the token simply ship no script at all.
 *
 * `beacon.min.js` is on cloudflareinsights.com, so it must be allowed by the
 * CSP script-src / connect-src in next.config.ts.
 */
export default function WebAnalytics() {
  const token = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;
  if (!token || !isProductionSite()) return null;

  return (
    <Script
      id="cf-web-analytics"
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      data-cf-beacon={JSON.stringify({ token })}
    />
  );
}
