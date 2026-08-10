import Link from 'next/link';

/**
 * The four EVIDENCE pages, cross-linked to each other (Aug 2026).
 *
 * These four answer the same question — "prove it" — at different levels of
 * formality: the field record, the aggregate numbers, the peer-reviewed record,
 * and the legal record. A reader who wants one usually wants another, and until
 * now they barely referenced each other: Publications and Patents each had a
 * single "See also" pointing at the other, and neither knew about Success
 * Stories or Track Record at all.
 *
 * Listing the destinations HERE rather than on each page is the point. Pass the
 * current page's path and the component renders the other three — so a page can
 * never link to itself, can never drift out of sync, and adding a fifth
 * evidence page wires it into all the others in one edit. Hand-listed "see
 * also" links are exactly how Publications ended up reachable from one place.
 */
const EVIDENCE_PAGES = [
  { href: '/success-stories', label: 'Success stories' },
  { href: '/track-record', label: 'Track record' },
  { href: '/about/publications', label: 'Peer-reviewed publications' },
  { href: '/about/patents', label: 'Patents' },
] as const;

export type EvidencePath = (typeof EVIDENCE_PAGES)[number]['href'];

export default function SeeAlso({
  current,
  className = '',
}: {
  /** Path of the page this is rendered on — it is omitted from the list. */
  current: EvidencePath;
  className?: string;
}) {
  const others = EVIDENCE_PAGES.filter((p) => p.href !== current);

  return (
    <nav
      aria-label="See also"
      className={`shrink-0 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 ${className}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">See also</p>
      <ul className="mt-1.5 space-y-1">
        {others.map((p) => (
          <li key={p.href}>
            <Link
              href={p.href}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-sm"
            >
              {p.label}
              {/* Decorative — the label already carries the link text. */}
              <span
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
