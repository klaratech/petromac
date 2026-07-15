'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const NAV_ITEMS = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Catalog', href: '/catalog' },
  { name: 'Track Record', href: '/track-record' },
  { name: 'Simulation', href: '/simulation' },
];

// About's dropdown (desktop hover / focus) and mobile sub-links. Team lives
// here rather than in the top bar.
const ABOUT_SUBLINKS = [
  { name: 'Team', href: '/team' },
  { name: 'Patents', href: '/about/patents' },
  { name: 'Publications', href: '/about/publications' },
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
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close the mobile panel whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
    // Move focus to the first link so Tab continues inside the panel
    // instead of behind the overlay.
    panelRef.current?.querySelector('a')?.focus();

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

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
    <header className="sticky top-0 z-40">
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
          <Link
            href="/"
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
                // About is a link AND a dropdown: hover (or keyboard focus
                // within) reveals Team / Patents / Publications.
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
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
                  </Link>
                  <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50">
                    <div className="min-w-44 rounded-xl bg-slate-950/95 backdrop-blur-md border border-white/10 shadow-xl py-2">
                      {ABOUT_SUBLINKS.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          aria-current={isActive(sub.href) ? 'page' : undefined}
                          className={`block px-4 py-2 text-sm transition-colors ${
                            isActive(sub.href)
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
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={desktopLinkClass(isActive(item.href))}
                >
                  {item.name}
                </Link>
              )
            )}

            <div className="h-6 w-px bg-white/15" aria-hidden="true" />

            {/* Intranet moved to the footer for launch — staff know where
                to find it; visitors don't need it in the main nav. */}

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
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
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
                  {item.href === '/about' ? (
                    <div className="ml-4 border-l border-white/10 pl-2 flex flex-col gap-1 mt-1 mb-1">
                      {ABOUT_SUBLINKS.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          aria-current={isActive(sub.href) ? 'page' : undefined}
                          className={[
                            'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            isActive(sub.href)
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
    </header>
  );
}
