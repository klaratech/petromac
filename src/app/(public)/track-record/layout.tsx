import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Record",
  description:
    "Explore Petromac's global deployment history across 50+ countries with our interactive operations map.",
};

export default function TrackRecordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
