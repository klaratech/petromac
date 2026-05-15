"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export default function HeroV2() {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <section className="relative h-[90vh] min-h-[600px] overflow-hidden">
      {/* Background video (desktop) / static image (mobile) */}
      <div className="absolute inset-0">
        <Image
          src="/images/sampling.jpg"
          alt=""
          fill
          className="object-cover"
          aria-hidden="true"
          priority
        />
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/images/sampling.jpg"
          className="absolute inset-0 w-full h-full object-cover hidden md:block"
        >
          <source src="/videos/transcoded/WirelineExpress.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 max-w-5xl mx-auto">
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-6">
          {/* Em-dash + brand-tinted second clause makes the headline read
              as a deliberate two-beat tagline. 'Optimised' uses the
              Petromac brand navy (#1E4A9A) to tie the headline to the
              rest of the page's brand color usage. */}
          Wireline logging — <span className="text-brand">Optimised</span>.
        </h1>
        <p className="text-xl md:text-2xl text-slate-100 max-w-2xl mb-10">
          Better data. Lower risk. Faster operations.
        </p>

        {/* CTA pair — primary (solid brand) + secondary (outline) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/track-record"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-white bg-brand hover:bg-brand/90 shadow-lg shadow-blue-900/30 transition-all hover:translate-y-[-1px] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black"
          >
            See the track record
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-white border-2 border-white/60 hover:bg-white hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          >
            Browse the catalog
          </Link>
        </div>
      </div>
    </section>
  );
}
