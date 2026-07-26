import type { Metadata } from 'next';

/** Site-wide share card — pages without their own raster image use this. */
const DEFAULT_OG_IMAGE = {
  url: '/images/petromac-og.png',
  width: 1200,
  height: 630,
  alt: 'Petromac – Wireline Logging & Downhole Technology',
};

export interface PageSeo {
  /** Un-branded page title — the root layout template appends "| Petromac". */
  title: string;
  description: string;
  /** Route path starting with '/' — becomes the canonical and og:url
   *  (resolved against metadataBase from the root layout). */
  path: string;
  /** Optional page-specific share image; falls back to the site card. */
  ogImage?: { url: string; width?: number; height?: number; alt?: string } | undefined;
}

/**
 * Per-page metadata builder: canonical link, page-specific Open Graph and
 * Twitter tags. Centralised because the App Router replaces (not merges)
 * a segment's openGraph object — a page that set only og:title would lose
 * the inherited og:image, so every field lives here.
 */
export function pageMetadata({ title, description, path, ogImage }: PageSeo): Metadata {
  const image = ogImage ?? DEFAULT_OG_IMAGE;
  // og:title doesn't go through the title template, so brand it here.
  const brandedTitle = `${title} | Petromac`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: 'Petromac',
      locale: 'en_US',
      title: brandedTitle,
      description,
      url: path,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: brandedTitle,
      description,
      images: [image.url],
    },
  };
}
