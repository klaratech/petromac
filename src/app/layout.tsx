import type { Metadata, Viewport } from 'next';
import { Inter, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import ErrorBoundary from '@/shared/ui/ErrorBoundary';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-plex',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.petromac.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
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
    <html lang="en">
      <head />
      <body
        className={`${inter.variable} ${ibmPlexSans.variable} font-sans antialiased min-h-dvh flex flex-col`}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
