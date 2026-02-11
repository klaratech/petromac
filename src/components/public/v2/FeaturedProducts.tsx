import Image from "next/image";
import Link from "next/link";

interface Product {
  name: string;
  description: string;
  image: string | null;
  badge?: string;
}

const products: Product[] = [
  {
    name: "Thor",
    description: "Anti-differential-sticking system for wireline logging in overbalanced wells.",
    image: "/images/thor.png",
    badge: "New",
  },
  {
    name: "Pathfinder",
    description: "Conveyance system for reliable tool delivery in high-deviation wells.",
    image: "/images/pathfinder.png",
  },
  {
    name: "Helix",
    description: "Centralizer for consistent standoff in demanding borehole conditions.",
    image: null,
  },
  {
    name: "Focus",
    description: "Probe orientation system for optimized formation testing seal quality.",
    image: "/images/focus.png",
  },
];

export default function FeaturedProducts() {
  return (
    <section className="py-20 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-brandblack text-center mb-4">
          Purpose-Built Hardware
        </h2>
        <p className="text-brandgray text-center mb-12 max-w-2xl mx-auto">
          Engineered devices that solve specific wireline logging challenges.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <Link
              key={p.name}
              href="/catalog"
              className="group block rounded-xl border-2 border-slate-200 bg-white overflow-hidden hover:border-brand/40 hover:shadow-card transition-all"
            >
              <div className="relative h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-sm">Image coming soon</span>
                  </div>
                )}
                {p.badge && (
                  <span className="absolute top-3 right-3 bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                    {p.badge}
                  </span>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-heading text-lg font-bold text-brandblack mb-1 group-hover:text-brand transition-colors">
                  {p.name}
                </h3>
                <p className="text-sm text-brandgray leading-relaxed">{p.description}</p>
                <span className="inline-block mt-3 text-brand text-sm font-semibold group-hover:translate-x-1 transition-transform">
                  View in catalog →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
