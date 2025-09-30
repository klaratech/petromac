import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative bg-cover bg-center text-white h-[70vh]" style={{ backgroundImage: "url('/images/hero.jpg')" }}>
      <div className="flex flex-col items-center justify-center h-full bg-black/50 text-center px-4">
        <h1 className="font-heading text-4xl md:text-6xl tracking-tight font-bold mb-4">
          Bespoke Devices for the Wireline Logging Industry
        </h1>
        <p className="max-w-2xl mb-6 text-lg md:text-xl">
          Solutions for differential sticking, high deviation, orientation, and sample quality
        </p>
        <div className="flex gap-4">
          <Link href="/catalog" className="px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors">
            View Catalog
          </Link>
          <Link href="/case-studies" className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors">
            Case Studies
          </Link>
        </div>
      </div>
    </section>
  );
}
