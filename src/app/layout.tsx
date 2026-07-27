import type { Metadata, Viewport } from 'next';
import { Inter, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { getSiteUrl, isProductionSite } from '@/lib/siteUrl';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-plex',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const BASE_URL = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  // Staging/preview builds carry meta noindex on every page (plus an
  // X-Robots-Tag header from next.config.ts and a Disallow-all robots.txt).
  // Production indexability is guarded at build time in next.config.ts.
  robots: isProductionSite() ? { index: true, follow: true } : { index: false, follow: false },
  title: {
    default: 'Petromac | Wireline Logging & Downhole Technology',
    template: '%s | Petromac',
  },
  description:
    'Petromac designs and manufactures wireline logging devices, centralisers, and conveyance systems for the global oil & gas industry.',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Petromac',
    title: 'Petromac | Wireline Logging & Downhole Technology',
    description:
      'Petromac designs and manufactures wireline logging devices, centralisers, and conveyance systems for the global oil & gas industry.',
    url: BASE_URL,
    images: [
      {
        url: '/images/petromac-og.png',
        width: 1200,
        height: 630,
        alt: 'Petromac – Wireline Logging & Downhole Technology',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Petromac | Wireline Logging & Downhole Technology',
    description:
      'Petromac designs and manufactures wireline logging devices, centralisers, and conveyance systems for the global oil & gas industry.',
    images: ['/images/petromac-og.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-scroll-behavior lets Next temporarily force instant scrolling
    // during route-transition scroll resets — without it, the global CSS
    // scroll-behavior:smooth animates the scroll-to-top on navigation and
    // the new page can land slightly off the top. Anchor links stay smooth.
    // suppressHydrationWarning: scoped to THIS element's attributes only —
    // the pre-paint inline script adds data-motion-ok to <html> before React
    // hydrates, which React (dev builds) would otherwise flag as a mismatch.
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Runs before first paint: flags that JS is live and the user
            allows motion, so CSS can pre-hide typewriter content instead
            of flashing the finished state before the animation replays
            (see .anim-prehide in globals.css). No-JS and reduced-motion
            visitors never get the flag — they see content instantly. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.setAttribute('data-motion-ok','')}catch(e){}",
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${ibmPlexSans.variable} font-sans antialiased min-h-dvh flex flex-col`}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
