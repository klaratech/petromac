"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { JobRecord } from "@/types/JobRecord";

interface Stats {
  countries: number;
  deployments: number;
  years: number;
}

export default function ProofSection() {
  const [stats, setStats] = useState<Stats>({ countries: 0, deployments: 0, years: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/data/operations_data.json");
        if (!res.ok) throw new Error("Failed to load");
        const data: JobRecord[] = await res.json();

        const countries = new Set(data.map((r) => r.Country)).size;
        const deployments = data.reduce((sum, r) => sum + r.Successful, 0);
        const years = new Date().getFullYear() - 2013;

        setStats({ countries, deployments, years });
        setLoaded(true);
      } catch {
        // Fallback to known approximate values
        setStats({ countries: 51, deployments: 2845, years: new Date().getFullYear() - 2013 });
        setLoaded(true);
      }
    }
    loadStats();
  }, []);

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-brandblack mb-14">
          Proven in the Field
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-14">
          <div>
            <p className={`font-heading text-5xl md:text-6xl font-bold text-brand transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}>
              {stats.countries}+
            </p>
            <p className="text-brandgray mt-2 font-medium">Countries</p>
          </div>
          <div>
            <p className={`font-heading text-5xl md:text-6xl font-bold text-brand transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}>
              {stats.deployments.toLocaleString()}+
            </p>
            <p className="text-brandgray mt-2 font-medium">Successful Deployments</p>
          </div>
          <div>
            <p className={`font-heading text-5xl md:text-6xl font-bold text-brand transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}>
              {stats.years}+
            </p>
            <p className="text-brandgray mt-2 font-medium">Years of Experience</p>
          </div>
        </div>

        <Link
          href="/track-record"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-brand text-brand font-semibold hover:bg-brand hover:text-white transition-colors"
        >
          Explore our track record
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Partner logo strip — placeholder */}
        <div className="mt-16 pt-12 border-t border-slate-200">
          <p className="text-sm text-slate-400 mb-6 uppercase tracking-wide font-medium">
            Trusted by operators worldwide
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-12 w-28 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs"
              >
                Logo {i}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
