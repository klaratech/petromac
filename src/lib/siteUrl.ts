const DEFAULT_SITE_URL = 'https://petromac.klaratech.it';

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    DEFAULT_SITE_URL
  ).replace(/\/+$/, '');
}
