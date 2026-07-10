import Image from 'next/image';
import Link from 'next/link';
import type { CatalogProduct } from '@/features/catalog/content/types';
import { productHref } from '@/features/catalog/content';

export default function ProductCard({ product }: { product: CatalogProduct }) {
  const hero = product.images.find((i) => i.role === 'gallery') ?? product.images[0];
  return (
    <Link
      href={productHref(product)}
      className="group flex flex-col rounded-xl border-2 border-slate-200 bg-white overflow-hidden hover:border-brand/40 hover:shadow-lg transition-all"
    >
      <div className="relative h-44 bg-slate-50 overflow-hidden">
        {hero ? (
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300 text-sm">
            Image coming soon
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-heading text-base font-bold text-slate-900 group-hover:text-brand transition-colors">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-slate-600 leading-relaxed flex-1">{product.summary}</p>
        <span className="mt-3 text-brand text-sm font-semibold group-hover:translate-x-1 transition-transform">
          View product →
        </span>
      </div>
    </Link>
  );
}
