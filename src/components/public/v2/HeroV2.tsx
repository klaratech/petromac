"use client";

import { useRef } from "react";
import Image from "next/image";

export default function HeroV2() {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <section className="relative h-[90vh] min-h-[600px] overflow-hidden">
      {/* Background video (desktop) / static image (mobile) */}
      <div className="absolute inset-0">
        {/* Static fallback image for all screens */}
        <Image
          src="/images/sampling.jpg"
          alt=""
          fill
          className="object-cover"
          aria-hidden="true"
          priority
        />
        {/* Video overlay — hidden on mobile for performance */}
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
          <source src="/videos/WirelineExpress.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 max-w-5xl mx-auto">
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-6">
          Wireline logging, optimised.
        </h1>
        <p className="text-xl md:text-2xl text-slate-100 max-w-2xl mb-4">
          Better data. Lower risk. More efficient operations.
        </p>
        <p className="text-sm md:text-base text-slate-300/80 max-w-2xl mb-10">
          Hardware and planning software, validated in the field.
        </p>
      </div>
    </section>
  );
}
