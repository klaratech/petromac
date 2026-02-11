"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Challenge {
  id: string;
  title: string;
  image: string;
  bullets: string[];
}

const challenges: Challenge[] = [
  {
    id: "open-hole",
    title: "Open Hole",
    image: "/images/conveyance.jpg",
    bullets: [
      "Reliable conveyance past ledges and tight spots in high-deviation wells",
      "Eliminate stuck tool incidents that cost days of rig time",
      "Pathfinder system proven in 80°+ wells worldwide",
    ],
  },
  {
    id: "cased-hole",
    title: "Cased Hole",
    image: "/images/sticking.jpg",
    bullets: [
      "Overcome differential sticking in overbalanced conditions",
      "Maintain logging speed without sacrificing data quality",
      "Thor anti-sticking system reduces NPT by up to 90%",
    ],
  },
  {
    id: "formation-testing",
    title: "Formation Testing",
    image: "/images/orientation.jpg",
    bullets: [
      "Orient probes to gravity low-side for optimal seal quality",
      "Reduce dry tests and improve pressure data reliability",
      "Focus system ensures consistent probe-to-formation contact",
    ],
  },
  {
    id: "data-quality",
    title: "Data Quality",
    image: "/images/sampling.jpg",
    bullets: [
      "Plan jobs across all 3 major wireline providers with Athena",
      "Simulate tensions, friction, and jarring confidence before the job",
      "Validate tool string design against well conditions in minutes",
    ],
  },
];

export default function ChallengeSelector() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <section id="challenge-selector" className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-brandblack text-center mb-4">
          What challenge are you facing?
        </h2>
        <p className="text-brandgray text-center mb-12 max-w-2xl mx-auto">
          Select a challenge to see how Petromac solves it in the field.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {challenges.map((c) => {
            const isExpanded = expanded === c.id;
            return (
              <motion.div
                key={c.id}
                layout
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                className={`rounded-xl overflow-hidden cursor-pointer border-2 transition-colors focus:outline-2 focus:outline-brand ${
                  isExpanded
                    ? "border-brand shadow-card lg:col-span-2"
                    : "border-slate-200 hover:border-brand/40 shadow-subtle hover:shadow-card"
                }`}
                onClick={() => toggle(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(c.id);
                  }
                }}
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={c.image}
                    alt={c.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white font-heading">
                    {c.title}
                  </h3>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 bg-slate-50">
                        <ul className="space-y-2 mb-4">
                          {c.bullets.map((b, i) => (
                            <li key={i} className="flex gap-2 text-sm text-brandgray">
                              <span className="text-brand font-bold mt-0.5">✓</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                        <Link
                          href="/success-stories/flipbook"
                          className="inline-flex items-center text-brand font-semibold text-sm hover:text-brand/80 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Learn more
                          <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
