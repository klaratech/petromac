import Image from "next/image";
import Link from "next/link";

export default function SimulationHero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 px-6 py-16 md:py-20">
      <Image
        src="/images/tv-bg.png"
        alt=""
        fill
        priority
        className="object-cover opacity-45"
        sizes="100vw"
        aria-hidden="true"
      />
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 hidden h-full w-full object-cover opacity-30 md:block"
      >
        <source src="/videos/WirelineExpress.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-slate-950/70 to-slate-950" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <div className="mb-6 flex items-center gap-4">
            <span className="relative flex h-12 w-12 shrink-0">
              <Image
                src="/images/athena_logo.png"
                alt=""
                fill
                className="object-contain"
                sizes="48px"
                aria-hidden="true"
              />
            </span>
            <div>
              <p className="text-xs uppercase text-blue-200 font-semibold">
                Athena&trade; by Petromac
              </p>
              <p className="text-sm text-slate-300">
                Vendor-neutral planning intelligence
              </p>
            </div>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.05] mb-6">
            Predict sticking risk before the tool enters the hole.
          </h1>

          <p className="text-lg md:text-xl text-slate-100 max-w-2xl mb-9 leading-relaxed">
            Athena&trade; combines Petromac engineering, Hermes&trade; tension
            simulation, and field-backed configuration logic so teams can rehearse
            the run before the truck moves.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="#contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3 font-semibold text-white shadow-lg shadow-blue-900/30 transition-all hover:bg-brand/90 hover:translate-y-[-1px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black"
            >
              Request a simulation
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="#simulation-output"
              className="inline-flex items-center justify-center rounded-full border-2 border-white/60 px-7 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
            >
              See decision outputs
            </Link>
          </div>
        </div>

        <div className="mt-14 grid max-w-4xl grid-cols-1 gap-px overflow-hidden rounded-lg bg-white/15 sm:grid-cols-3">
          {[
            ["Model", "well path, tool string, friction"],
            ["Predict", "tension, drag, sticking risk"],
            ["Decide", "configuration, limits, contingency"],
          ].map(([label, text]) => (
            <div key={label} className="bg-slate-950/75 p-4">
              <p className="font-heading text-lg font-bold text-white">{label}</p>
              <p className="mt-1 text-sm text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
