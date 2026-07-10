'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SearchEntry } from '@/features/catalog/content';

/**
 * Instant client-side product search. The index is tiny (~30 products), so
 * plain substring matching is enough — no library needed. Results are plain
 * anchors (not <Link>) so the `#:~:text=` fragment triggers the browser's
 * native scroll-to-text highlight on the product page.
 */
export default function CatalogSearch({ entries }: { entries: SearchEntry[] }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const terms = q.split(/\s+/);
    return entries.filter((e) => terms.every((t) => e.haystack.includes(t))).slice(0, 8);
  }, [entries, query]);

  useEffect(() => {
    setActive(0);
    setOpen(results.length > 0);
  }, [results]);

  useEffect(() => {
    function onClickOutside(ev: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(ev.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function hrefFor(entry: SearchEntry): string {
    const q = query.trim();
    // Scroll-to-text fragment: browsers that support it highlight the term.
    return q ? `${entry.href}#:~:text=${encodeURIComponent(q)}` : entry.href;
  }

  function onKeyDown(ev: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      window.location.href = hrefFor(results[active]);
    } else if (ev.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-xl">
      <label htmlFor="catalog-search" className="sr-only">
        Search the catalog
      </label>
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
          />
        </svg>
        <input
          id="catalog-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(results.length > 0)}
          onKeyDown={onKeyDown}
          placeholder="Search products, models, specs… e.g. centraliser, TTB-505"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="catalog-search-results"
          className="w-full rounded-xl border-2 border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </div>
      {open && (
        <ul
          id="catalog-search-results"
          role="listbox"
          className="absolute z-30 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
        >
          {results.map((r, i) => (
            <li key={r.href} role="option" aria-selected={i === active}>
              <a
                href={hrefFor(r)}
                onMouseEnter={() => setActive(i)}
                className={`block px-4 py-3 border-b border-slate-100 last:border-b-0 ${
                  i === active ? 'bg-brand/5' : 'bg-white'
                }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-heading font-semibold text-slate-900">{r.name}</span>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{r.categoryName}</span>
                </span>
                <span className="block text-sm text-slate-500 truncate">{r.summary}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {query.trim().length >= 2 && results.length === 0 && (
        <p className="absolute z-30 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl px-4 py-3 text-sm text-slate-500">
          No products match “{query.trim()}”.
        </p>
      )}
    </div>
  );
}
