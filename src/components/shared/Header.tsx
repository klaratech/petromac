"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { name: "About", href: "/about" },
    { name: "Catalog", href: "/catalog" },
    { name: "Track Record", href: "/track-record" },
    { name: "Team", href: "/team" },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header className="bg-black text-white border-b border-gray-800">
      <div className="container mx-auto px-4 py-5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Image
            src="/images/Petromac-Logo.png.webp"
            alt="Petromac Logo"
            width={180}
            height={54}
            className="h-auto w-44"
            priority
          />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-base font-medium transition-colors hover:text-blue-400 ${
                isActive(item.href)
                  ? "text-blue-400 border-b-2 border-blue-400 pb-1"
                  : "text-gray-300"
              }`}
            >
              {item.name}
            </Link>
          ))}
          
          {/* Visually separated Intranet link */}
          <div className="h-6 w-px bg-gray-600" />
          <Link
            href="/intranet"
            className={`text-base font-medium transition-colors hover:text-blue-400 ${
              isActive("/intranet")
                ? "text-blue-400 border-b-2 border-blue-400 pb-1"
                : "text-gray-300"
            }`}
          >
            Intranet
          </Link>
          
          {/* LinkedIn Icon */}
          <a
            href="https://www.linkedin.com/company/petromac-ltd/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-blue-400 transition-colors"
            aria-label="Visit Petromac on LinkedIn"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </nav>
      </div>
    </header>
  );
}
