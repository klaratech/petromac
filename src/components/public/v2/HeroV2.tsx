"use client";

import { useRef } from "react";

export default function HeroV2() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative h-[90vh] min-h-[600px] overflow-hidden">
      {/* Background video (desktop) / static image (mobile) */}
      <div className="absolute inset-0">
        {/* Static fallback image for all screens */}
        <img
          src="/images/sampling.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
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
        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
          Prevent stuck tools, failed logs, and costly contingency runs in complex wells.
        </h1>
        <p className="text-lg md:text-xl text-slate-200 max-w-2xl mb-10">
          Hardware + planning software validated in the field.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => scrollTo("challenge-selector")}
            className="px-8 py-3 rounded-lg bg-white text-brand font-semibold text-lg hover:bg-slate-100 transition-colors shadow-lg"
          >
            Select your challenge
          </button>
          <button
            onClick={() => scrollTo("contact")}
            className="px-8 py-3 rounded-lg border-2 border-white text-white font-semibold text-lg hover:bg-white/10 transition-colors"
          >
            Request Athena demo
          </button>
        </div>
      </div>
    </section>
  );
}
