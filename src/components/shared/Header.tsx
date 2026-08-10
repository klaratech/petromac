'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ContactDrawer from '@/components/shared/ContactDrawer';

const NAV_ITEMS = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Catalog', href: '/catalog' },
  { name: 'Track Record', href: '/track-record' },
  { name: 'Success Stories', href: '/success-stories' },
  { name: 'Simulation', href: '/simulation' },
];

// About's dropdown (desktop hover / focus) and mobile sub-links.
//
// "Origins" is BACK (Rajesh, Aug 2026) and owns `/about`. It was removed
// earlier because it duplicated the About item's own href: two adjacent
// entries pointed at the same URL, so whichever you tapped second was a
// same-route navigation that appeared to do nothing. The duplication is gone
// for a different reason now — About no longer navigates at all, it only
// opens this menu (see the <button> in the nav below), so `/about` has
// exactly one entry point again and it is named after the page's own H1,
// "Origins of Petromac".
//
// Patents LEFT this menu too (Aug 2026), for the same reason and by the same
// route: it is EVIDENCE, not company background, so it now sits with the other
// three evidence pages behind the "See also" card on /success-stories,
// /about/publications and /track-record — plus the existing "View patents"
// link on /catalog. Its ROUTE is unchanged (`/about/patents`) and stays in the
// sitemap; moving the path would cost a 301 and a re-crawl for nothing.
//
// NOTE the `isSubActive` exact-match special case for `/about` below is STILL
// required. Origins owns `/about`, and `isActive` treats a href as owning its
// subtree, so without it Origins lights up while you are on `/about/patents`.
//
// Publications LEFT this menu (Aug 2026). It is not "about the company" in
// the way Origins/Team/Patents are, and it is still reachable from /about,
// /about/patents, /track-record and /contact, so nothing is orphaned — the
// route is unchanged and stays in the sitemap. Where it belongs long-term is
// an open question; see TODO.
//
// Rule that still holds: every entry here points at a DISTINCT destination.
const ABOUT_SUBLINKS = [
  { name: 'Origins', href: '/about' },
  { name: 'Team', href: '/team' },
];

function LinkedInIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close the mobile panel whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /** Set when a same-route click needs a scroll-to-top once the mobile panel
   *  has finished unmounting. See handleNavClick. */
  const pendingScrollTop = useRef(false);

  /** The mobile panel sits in the DOCUMENT FLOW, not over it — opening it makes
   *  the page ~680px taller and the browser's scroll anchoring shifts scrollY
   *  to match, so nothing visually moves. The catch is that closing it reverses
   *  that mid-flight: a window.scrollTo issued in the same tick as setOpen(false)
   *  gets fought by the anchoring adjustment and lands at an arbitrary offset
   *  (measured: asked for 0, got 900). Scrolling from this effect instead runs
   *  after React has committed the unmount, so the document has already settled. */
  useEffect(() => {
    if (open || !pendingScrollTop.current) return;
    pendingScrollTop.current = false;
    // One further tick past the commit: scroll anchoring performs its
    // adjustment during the LAYOUT that follows this effect, so a scroll
    // issued synchronously here gets undone. Not rAF — it never fires in a
    // hidden tab, which is how this often gets tested.
    const id = setTimeout(() => {
      // 'instant' rather than inheriting globals.css's smooth scrolling. This
      // is the "you clicked the link for the page you are already on" case,
      // and a real browser navigation to the same URL jumps to the top rather
      // than gliding, so instant is the faithful match. It is also the only
      // deterministic option: a smooth scroll is compositor-driven, so it
      // silently never advances wherever rAF is starved.
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 0);
    return () => clearTimeout(id);
  }, [open]);

  /** Every nav link goes through this.
   *
   *  Closing here rather than relying only on the route-change effect above:
   *  tapping the link for the page you are ALREADY on does not change the
   *  pathname, so that effect never fires and the panel stayed open — the tap
   *  appeared to do nothing at all.
   *
   *  The scroll is the other half of the same problem. Next deliberately does
   *  not scroll for a same-URL navigation, so such a tap also left you halfway
   *  down the page. A browser scrolls to top when you click a link to the page
   *  you are on, and that is what a reader expects here. Behaviour (smooth vs
   *  instant) is left to the `scroll-behavior` rule in globals.css, which is
   *  already reduced-motion aware. */
  const handleNavClick = (href: string) => {
    const sameRoute = href === pathname;
    if (open) {
      // Defer past the panel unmount (see the effect above).
      pendingScrollTop.current = sameRoute;
      setOpen(false);
    } else if (sameRoute) {
      // Desktop: no panel in play, so the document is not about to resize.
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  // Lock body scroll while the mobile panel is open. Escape closes the
  // panel and returns focus to the toggle so keyboard users aren't left
  // focused on a hidden element.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    // Move focus to the first link so Tab continues inside the panel instead
    // of behind the overlay. preventScroll because this focus exists purely for
    // keyboard order — there is no reason for it to move the viewport, and a
    // focus() that scrolls is an easy way to introduce a jump later. (Note it
    // is NOT currently fixing a visible bug: opening the panel does change
    // scrollY by ~680px, but that is scroll anchoring compensating for the
    // in-flow panel, and measured viewport positions are identical either way.)
    panelRef.current?.querySelector('a')?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // Origins needs EXACT matching, the rest prefix. `isActive` treats a href as
  // owning its subtree, so prefix-matching Origins (`/about`) would light it up
  // on `/about/patents` as well and two menu entries would read as current at
  // once. This special case was deleted when Origins was removed from the menu
  // and has to come back with it (Aug 2026).
  const isSubActive = (href: string) =>
    href === '/about' ? pathname === '/about' : isActive(href);

  // About owns /about/* and /team now that Team moved into its dropdown.
  const isAboutActive = () => isActive('/about') || isActive('/team');

  /** Desktop link: permanent transparent bottom border so active/inactive
   *  items have identical height (the previous version added pb-1 +
   *  border-b-2 only on active, which nudged active items down 3px). */
  const desktopLinkClass = (active: boolean) =>
    [
      'inline-block py-1 text-[15px] font-medium tracking-wide',
      'border-b-2 transition-colors',
      active
        ? 'text-white border-blue-400'
        : 'text-slate-300 border-transparent hover:text-white hover:border-white/30',
    ].join(' ');

  return (
    <header className="sticky top-0 z-40 header-elevate">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-brand focus:text-white focus:px-4 focus:py-2 focus:rounded"
      >
        Skip to main content
      </a>

      {/* Frosted-glass nav bar */}
      <div className="bg-slate-950/85 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          {/* Logo */}
          {/* Same-route handling matters here as much as on the nav links:
              clicking the logo while already on the homepage is a same-URL
              navigation that Next deliberately ignores, so without this the
              click did nothing and you stayed halfway down the page.
              Measured on production before the fix: scrollY 2079 -> 2079,
              while the "Home" nav link beside it correctly returned to 0. */}
          <Link
            href="/"
            onClick={() => handleNavClick('/')}
            className="flex items-center transition-transform duration-200 hover:scale-[1.02] hover:brightness-110"
          >
            <Image
              src="/images/Petromac-Logo.png.webp"
              alt="Petromac Logo"
              width={180}
              height={54}
              className="h-auto w-44"
              priority
            />
          </Link>

          {/* Desktop nav (lg+) */}
          <nav className="hidden lg:flex items-center gap-7">
            {NAV_ITEMS.map((item) =>
              item.href === '/about' ? (
                // About is a DISCLOSURE, not a destination: it opens the menu
                // and never navigates, so Origins can own /about outright.
                // A <button> rather than a <Link> because there is no URL
                // behind it — hover or keyboard focus reveals the panel, and
                // `type="button"` keeps it out of any form submission.
                <div key={item.href} className="relative group">
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-current={isAboutActive() ? 'page' : undefined}
                    className={desktopLinkClass(isAboutActive())}
                  >
                    {item.name}
                    {/* Dropdown affordance — flips while the menu is open */}
                    <svg
                      className="ml-1 inline-block h-3 w-3 -translate-y-px transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50">
                    <div className="min-w-44 rounded-xl bg-slate-950/95 backdrop-blur-md border border-white/10 shadow-xl py-2">
                      {ABOUT_SUBLINKS.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => handleNavClick(sub.href)}
                          aria-current={isSubActive(sub.href) ? 'page' : undefined}
                          className={`block px-4 py-2 text-sm transition-colors ${
                            isSubActive(sub.href)
                              ? 'text-white bg-white/10'
                              : 'text-slate-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={desktopLinkClass(isActive(item.href))}
                >
                  {item.name}
                </Link>
              )
            )}

            <div className="h-6 w-px bg-white/15" aria-hidden="true" />

            <Link
              href="/intranet"
              prefetch={false}
              /* Staff-only and Disallow'd in robots.txt, so there is no crawl
                 path worth spending on it (Search Console audit, 9 Aug 2026). */
              rel="nofollow"
              onClick={() => handleNavClick('/intranet')}
              aria-current={isActive('/intranet') ? 'page' : undefined}
              className={desktopLinkClass(isActive('/intranet'))}
            >
              Intranet
            </Link>

            {/* Icons get their own tighter group: the nav's gap-7 is tuned for
                text links and left a visible void between two 36px circular
                buttons. gap-1 clusters them as a pair while the nav gap still
                separates them from the links. */}
            <div className="flex items-center gap-1">
              {/* Email — opens the contact drawer so the visitor keeps their place */}
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="flex items-center justify-center w-9 h-9 rounded-full text-slate-300 hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                aria-label="Contact us"
                aria-haspopup="dialog"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l9 6 9-6M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l2-2h14l2 2"
                  />
                </svg>
              </button>

              {/* LinkedIn — circular hover background */}
              <a
                href="https://www.linkedin.com/company/petromac-ltd/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-full text-slate-300 hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                aria-label="Visit Petromac on LinkedIn (opens in new tab)"
              >
                <LinkedInIcon />
              </a>
            </div>
          </nav>

          {/* Mobile menu button (below lg) */}
          <button
            ref={toggleRef}
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-md text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 transition-colors"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Soft hairline divider (replaces the old hard gray-800 line) */}
        <div
          className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
          aria-hidden="true"
        />
      </div>

      {/* Mobile dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          id="mobile-nav"
          className="lg:hidden bg-slate-950/95 backdrop-blur-md border-b border-white/10"
        >
          <nav
            className="container mx-auto px-4 py-3 flex flex-col gap-1"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map((item) => {
              const active = item.href === '/about' ? isAboutActive() : isActive(item.href);
              const isAbout = item.href === '/about';
              return (
                <div key={item.href}>
                  {isAbout ? (
                    // Matches desktop: About labels the group, it does not go
                    // anywhere. Its sub-links (Origins first) are already
                    // listed below and always visible on mobile, so there is
                    // nothing to expand and nothing to tap here.
                    <p
                      className="px-3 pt-3 pb-1 text-base font-medium text-slate-300"
                      aria-hidden="true"
                    >
                      {item.name}
                    </p>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => handleNavClick(item.href)}
                      aria-current={active ? 'page' : undefined}
                      className={[
                        'block px-3 py-3 rounded-lg text-base font-medium transition-colors',
                        active
                          ? 'text-white bg-white/10'
                          : 'text-slate-300 hover:text-white hover:bg-white/5',
                      ].join(' ')}
                    >
                      {item.name}
                    </Link>
                  )}
                  {item.href === '/about' ? (
                    <div className="ml-4 border-l border-white/10 pl-2 flex flex-col gap-1 mt-1 mb-1">
                      {ABOUT_SUBLINKS.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => handleNavClick(sub.href)}
                          aria-current={isSubActive(sub.href) ? 'page' : undefined}
                          className={[
                            'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            isSubActive(sub.href)
                              ? 'text-white bg-white/10'
                              : 'text-slate-400 hover:text-white hover:bg-white/5',
                          ].join(' ')}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}

            <div className="h-px bg-white/10 my-2" aria-hidden="true" />

            <Link
              href="/intranet"
              prefetch={false}
              /* Staff-only and Disallow'd in robots.txt, so there is no crawl
                 path worth spending on it (Search Console audit, 9 Aug 2026). */
              rel="nofollow"
              onClick={() => handleNavClick('/intranet')}
              aria-current={isActive('/intranet') ? 'page' : undefined}
              className={[
                'px-3 py-3 rounded-lg text-base font-medium transition-colors',
                isActive('/intranet')
                  ? 'text-white bg-white/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5',
              ].join(' ')}
            >
              Intranet
            </Link>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setContactOpen(true);
              }}
              className="px-3 py-3 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors text-left"
              aria-label="Contact us"
              aria-haspopup="dialog"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l9 6 9-6M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l2-2h14l2 2"
                />
              </svg>
              <span>Contact us</span>
            </button>

            <a
              href="https://www.linkedin.com/company/petromac-ltd/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-3 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
              aria-label="Visit Petromac on LinkedIn (opens in new tab)"
            >
              <LinkedInIcon className="w-5 h-5" />
              <span>LinkedIn</span>
            </a>
          </nav>
        </div>
      )}

      {/* Mounts only while open — ContactForm carries the Turnstile widget, and
          Turnstile cannot run a challenge inside a hidden container. */}
      <ContactDrawer open={contactOpen} onClose={() => setContactOpen(false)} />
    </header>
  );
}
