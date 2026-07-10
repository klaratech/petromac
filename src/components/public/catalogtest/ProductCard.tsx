import Image from 'next/image';
import Link from 'next/link';
import type { ProductCardModel } from '@/features/catalog/content';

/**
 * Product card for the catalog browser. Presentational only — receives the
 * slim ProductCardModel (built server-side) so it can render inside the
 * client-side browser without pulling catalog.json into the bundle.
 * `highlighted` drives the brief glow after a search jump.
 */
export default function ProductCard({
  product,
  highlighted = false,
}: {
  product: ProductCardModel;
  highlighted?: boolean;
}) {
  return (
    <Link
      href={product.href}
      data-card-slug={product.slug}
      className={`group flex flex-col rounded-xl bg-white overflow-hidden ring-1 transition-all duration-300 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-12px_rgba(15,23,42,0.12)] hover:shadow-[0_2px_6px_rgba(15,23,42,0.08),0_16px_32px_-12px_rgba(30,74,154,0.25)] ${
        highlighted
          ? 'ring-2 ring-brand shadow-[0_0_0_4px_rgba(30,74,154,0.15),0_16px_32px_-12px_rgba(30,74,154,0.35)]'
          : 'ring-slate-200 hover:ring-brand/40'
      }`}
    >
      <div className="relative h-44 bg-gradient-to-b from-slate-50 to-slate-100/60 overflow-hidden">
        {product.image ? (
          <Image
            src={product.image.src}
            alt={product.image.alt}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300 text-sm">
            Image coming soon
          </div>
        )}
        {product.badge && (
          <span className="absolute top-3 right-3 rounded-full bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-white tracking-wide">
            {product.badge}
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-heading text-base font-bold text-slate-900 group-hover:text-brand transition-colors">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-slate-600 leading-relaxed flex-1">{product.summary}</p>
        {product.tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Key specifications">
            {product.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 whitespace-nowrap"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
