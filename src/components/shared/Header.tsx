"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { name: "About", href: "/about" },
    { name: "Catalog", href: "/catalog" },
    { name: "Track Record", href: "/case-studies" },
    { name: "Contacts", href: "/contact" },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header className="bg-black text-white border-b border-gray-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Image
            src="/images/Petromac-Logo.png.webp"
            alt="Petromac Logo"
            width={150}
            height={45}
            className="h-auto w-36"
            priority
          />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                isActive(item.href)
                  ? "text-blue-400 border-b-2 border-blue-400 pb-1"
                  : "text-gray-300"
              }`}
            >
              {item.name}
            </Link>
          ))}
          
          {/* Visually separated Intranet link */}
          <div className="h-6 w-px bg-gray-600 mx-2" />
          <Link
            href="/intranet"
            className={`text-sm font-medium transition-colors hover:text-blue-400 ${
              isActive("/intranet")
                ? "text-blue-400 border-b-2 border-blue-400 pb-1"
                : "text-gray-300"
            }`}
          >
            Intranet
          </Link>
        </nav>
      </div>
    </header>
  );
}
