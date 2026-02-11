import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Catalog",
  description:
    "Browse the complete Petromac product catalog featuring wireline logging devices, centralisers, and conveyance systems.",
};

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
