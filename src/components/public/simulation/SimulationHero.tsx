import Image from "next/image";
import Link from "next/link";

export default function SimulationHero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 px-6 py-14 md:py-16">
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
        className="absolute inset-0 hidden h-full w-full object-cover opacity-25 md:block"
      >
        <source src="/videos/WirelineExpress.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-slate-950/75 to-slate-950" />

      <div className="relative z-10 mx-auto max-w-4xl">
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
            <p className="text-xs font-semibold uppercase text-blue-200">
              Athena&trade; by Petromac
            </p>
            <p className="text-sm text-slate-300">
              Vendor-neutral planning intelligence
            </p>
          </div>
        </div>

        <h1 className="mb-5 max-w-4xl font-heading text-4xl font-bold leading-[1.04] text-white sm:text-5xl md:text-6xl">
          Not just hardware. A planning partner.
        </h1>

        <p className="mb-8 max-w-2xl text-lg leading-relaxed text-slate-100 md:text-xl">
          Athena brings Petromac engineering, Hermes&trade; simulation, and
          field-backed configuration logic into the planning conversation.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            href="#contact"
            className="inline-flex items-center justify-center rounded-full bg-brand px-7 py-3 font-semibold text-white shadow-lg shadow-blue-900/30 transition-all hover:-translate-y-0.5 hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black"
          >
            Request a simulation
          </Link>
          <Link
            href="#athena-demo"
            className="inline-flex items-center justify-center rounded-full border-2 border-white/60 px-7 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          >
            See Athena in action
          </Link>
        </div>
      </div>
    </section>
  );
}
