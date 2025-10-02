import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/kiosk/ErrorBoundary";
import { Analytics } from "@vercel/analytics/next";
import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-plex",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Petromac",
  description: "Petromac Kiosk App",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
};

// ✅ NEW viewport export — replaces themeColor in metadata
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <Header />
        <ErrorBoundary>
          <main className="flex-1">{children}</main>
        </ErrorBoundary>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
