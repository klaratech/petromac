'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductCardModel, SearchEntry } from '@/features/catalog/content';
import CatalogSearch from './CatalogSearch';
import ProductCard from './ProductCard';

export interface BrowserCategory {
  slug: string;
  name: string;
  tagline: string;
  intro: string[];
  groups: string[];
}

/**
 * Two-column catalog workspace: sticky category sidebar (desktop) or a
 * sticky horizontal chip bar (mobile) on the left, and the active category's
 * grouped product cards on the right. The active category syncs with the
 * `?category=` search param so views are bookmarkable and back/forward work,
 * without full page loads.
 */
export default function CatalogBrowser({
  categories,
  cards,
  searchEntries,
}: {
  categories: BrowserCategory[];
  cards: ProductCardModel[];
  searchEntries: SearchEntry[];
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0].slug);
  const [highlightSlug, setHighlightSlug] = useState<string | null>(null);
  // Search jump target; the counter retriggers the effect for repeat jumps
  // to the same card.
  const [jump, setJump] = useState<{ slug: string; n: number } | null>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const chipBarRef = useRef<HTMLDivElement>(null);

  const isValid = useCallback(
    (slug: string | null): slug is string => !!slug && categories.some((c) => c.slug === slug),
    [categories]
  );

  // Initialize from the URL and follow back/forward navigation.
  useEffect(() => {
    const readUrl = () => {
      const cat = new URLSearchParams(window.location.search).get('category');
      if (isValid(cat)) setActiveCategory(cat);
    };
    readUrl();
    window.addEventListener('popstate', readUrl);
    return () => window.removeEventListener('popstate', readUrl);
  }, [isValid]);

  const selectCategory = (slug: string, { scroll = true } = {}) => {
    setActiveCategory(slug);
    window.history.pushState(null, '', `${window.location.pathname}?category=${slug}`);
    if (scroll) {
      // Back to the top of the pane so the new category starts in view.
      paneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // After a search jump renders the right tab, scroll to the card and flash it.
  useEffect(() => {
    if (!jump) return;
    const el = document.querySelector(`[data-card-slug="${jump.slug}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightSlug(jump.slug);
    const timer = setTimeout(() => setHighlightSlug(null), 1800);
    return () => clearTimeout(timer);
  }, [jump]);

  // Keep the active chip visible in the mobile bar (e.g. after a deep link
  // lands on a category whose chip is scrolled out of reach).
  useEffect(() => {
    // Center the chip by setting the container's scrollLeft directly:
    // scrollIntoView also scrolls ancestors, which yanked the whole page
    // when this fired on load (and smooth scrolls get cancelled mid-load).
    const bar = chipBarRef.current;
    const chip = bar?.querySelector<HTMLElement>('[aria-current]');
    if (bar && chip) {
      bar.scrollLeft = chip.offsetLeft - (bar.clientWidth - chip.clientWidth) / 2;
    }
  }, [activeCategory]);

  const jumpToProduct = (entry: SearchEntry) => {
    if (entry.category !== activeCategory) {
      selectCategory(entry.category, { scroll: false });
    }
    setJump((j) => ({ slug: entry.slug, n: (j?.n ?? 0) + 1 }));
  };

  const activeData = categories.find((c) => c.slug === activeCategory) ?? categories[0];
  const products = cards.filter((p) => p.category === activeData.slug);
  const groups = activeData.groups.length
    ? activeData.groups
    : [...new Set(products.map((p) => p.group))];

  const categoryButton = (cat: BrowserCategory, layout: 'sidebar' | 'chip') => {
    const isActive = cat.slug === activeData.slug;
    const count = cards.filter((p) => p.category === cat.slug).length;
    if (layout === 'chip') {
      return (
        <button
          key={cat.slug}
          type="button"
          onClick={() => selectCategory(cat.slug)}
          aria-current={isActive ? 'true' : undefined}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            isActive
              ? 'bg-brand text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
          }`}
        >
          {cat.name}
          <span className={`ml-1.5 text-xs ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
            {count}
          </span>
        </button>
      );
    }
    return (
      <button
        key={cat.slug}
        type="button"
        onClick={() => selectCategory(cat.slug)}
        aria-current={isActive ? 'true' : undefined}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-l-4 text-left text-sm transition-all ${
          isActive
            ? 'bg-brand/5 border-brand text-brand font-bold shadow-sm'
            : 'border-transparent text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <span>{cat.name}</span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
            isActive ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div ref={paneRef} className="scroll-mt-24">
      {/* Mobile: sticky horizontal category bar, tucked under the 69px site
          header (68px so there's no seam between the two). */}
      <div className="lg:hidden sticky top-[68px] z-30 -mx-6 px-6 py-3 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div
          ref={chipBarRef}
          className="flex gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Product categories"
        >
          {categories.map((c) => categoryButton(c, 'chip'))}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8 items-start pt-6 lg:pt-2">
        {/* Desktop: sticky sidebar */}
        <aside
          className="hidden lg:block lg:col-span-1 lg:sticky lg:top-24 space-y-1"
          aria-label="Product categories"
        >
          <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Categories
          </p>
          {categories.map((c) => categoryButton(c, 'sidebar'))}

          <div className="pt-5 px-4">
            <a
              href="/flipbooks/catalog/petromac-product-catalog.pdf"
              download
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4"
                />
              </svg>
              Download PDF
            </a>
          </div>
        </aside>

        {/* Content pane: the active category only */}
        <main className="lg:col-span-3 min-w-0">
          <div className="mb-6">
            <CatalogSearch entries={searchEntries} onSelect={jumpToProduct} />
          </div>

          <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            {activeData.name}
          </h2>
          <p className="text-slate-600 max-w-3xl">{activeData.tagline}</p>
          {activeData.intro.map((para) => (
            <p key={para.slice(0, 32)} className="mt-2 text-sm text-slate-500 max-w-3xl">
              {para}
            </p>
          ))}

          <div className="mt-8 space-y-10">
            {groups.map((group) => {
              const groupProducts = products.filter((p) => p.group === group);
              if (groupProducts.length === 0) return null;
              return (
                <section key={group || 'default'} aria-label={group || activeData.name}>
                  {group && (
                    <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
                      {group}
                    </h3>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {groupProducts.map((p) => (
                      <ProductCard
                        key={p.slug}
                        product={p}
                        highlighted={p.slug === highlightSlug}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
