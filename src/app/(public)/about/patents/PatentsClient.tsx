"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

interface Patent {
  title: string;
  number: string;
  jurisdiction: string;
  link: string;
}

interface Device {
  family: "Wireline Express" | "Focus";
  device: string;
  summary: string;
  patents: Patent[];
}

const DEVICES: Device[] = [
  {
    family: "Wireline Express",
    device: "Tool Taxi & Guide",
    summary:
      "The core Wireline Express conveyance technology — sensor transportation, guide devices, and the Lubrication Delivery system. The foundation of the open-hole gravity-descent record.",
    patents: [
      { title: "Sensor Transportation Apparatus and Guide Device", number: "US9,863,198", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US9863198B2.pdf" },
      { title: "Sensor Transportation Apparatus and Guide Device", number: "US10,364,627", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US10364627B2.pdf" },
      { title: "Wellbore Logging Tool Assembly", number: "US10,612,333", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US10612333B2.pdf" },
      { title: "Sensor Transportation Apparatus and Guide Device", number: "US11,047,191", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US11047191B1.pdf" },
      { title: "Sensor Transportation Apparatus – \"Lubrication Delivery system\"", number: "US11,111,774", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US11111774B2.pdf" },
      { title: "Orientation apparatus and hole finder device for a wireline logging tool string", number: "US11,371,306", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US11371306B2.pdf" },
      { title: "Sensor transportation apparatus for a wireline logging toolstring", number: "US11,873,692", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US11873692B2.pdf" },
      { title: "Sensor Transportation Apparatus and Guide Device", number: "UAE-7283", jurisdiction: "UAE", link: "https://www.petromac.co.nz/pdf/UAE-7283.pdf" },
      { title: "Sensor Transportation Apparatus and Guide Device", number: "MY-169945", jurisdiction: "Malaysia", link: "https://www.petromac.co.nz/pdf/MY-169945%20B.pdf" },
      { title: "Sensor Transportation Apparatus and Guide Device", number: "MY-195422-A", jurisdiction: "Malaysia", link: "https://www.petromac.co.nz/pdf/MY-195422-A.pdf" },
      { title: "Sensor Transportation Apparatus and Guide Device", number: "EP2920405", jurisdiction: "France, Netherlands, Norway, UK", link: "https://www.petromac.co.nz/pdf/EP2920405B1.pdf" },
      { title: "Sensor Transportation Apparatus and Guide Device", number: "EP3726001", jurisdiction: "Denmark, Italy, Norway, UK", link: "https://www.petromac.co.nz/pdf/EP3726001B1.pdf" },
      { title: "Sensor Transportation Apparatus and Guide Device", number: "Eurasia 031097", jurisdiction: "Russia, Armenia, Azerbaijan, Belarus, Kazakhstan, Kyrgyzstan, Tajikistan, Turkmenistan", link: "https://www.petromac.co.nz/pdf/EA031097B1.pdf" },
      { title: "Un dispositivo guía para uso en equipos de sensores de guía en Aplicaciones de registro por cable de perforación", number: "NC2020/0008570", jurisdiction: "Colombia", link: "https://www.petromac.co.nz/pdf/NC202_0008570.pdf" },
      { title: "Sensor Transportation Apparatus and Guide Device", number: "ZL201380059792.3", jurisdiction: "China", link: "https://www.petromac.co.nz/pdf/CN104919132B.pdf" },
      { title: "Sensor Transportation Device - \"Guide Device\"", number: "ZL201810053768.3", jurisdiction: "China", link: "https://www.petromac.co.nz/pdf/CN108104751B.pdf" },
      { title: "Aparelho de transporte... Guide device combination through a wellbore.", number: "BR 112015010666.8", jurisdiction: "Brazil", link: "https://www.petromac.co.nz/pdf/BR%20taxi.pdf" },
    ],
  },
  {
    family: "Wireline Express",
    device: "Pathfinder",
    summary:
      "Universal hole finder for navigating restrictions, ledges, and washouts in high-deviation wells.",
    patents: [
      { title: "Guide Device", number: "US11,371,296", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US11371296B2.pdf" },
      { title: "A device for centering a sensor assembly in a wellbore", number: "US12,116,850", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US12116850B1.pdf" },
      { title: "A Guide Device", number: "MY-203027-A", jurisdiction: "Malaysia", link: "https://www.petromac.co.nz/pdf/MY-203027-A.pdf" },
      { title: "A Guide Device", number: "GB2583249", jurisdiction: "UK", link: "https://www.petromac.co.nz/pdf/GB2583249B.pdf" },
      { title: "Guide Device", number: "CA3085434", jurisdiction: "Canada", link: "https://www.petromac.co.nz/pdf/CA3085434 Granted specification.pdf" },
      { title: "Guide Device", number: "AU2019205752", jurisdiction: "Australia", link: "https://www.petromac.co.nz/pdf/AU2019205752B2.pdf" },
    ],
  },
  {
    family: "Wireline Express",
    device: "Wireline Express — Cased Hole",
    summary:
      "Cased-hole adaptation of the conveyance system for in-casing logging operations.",
    patents: [
      { title: "Sensor transportation device", number: "US11,933,160", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US11933160B1.pdf" },
      { title: "Toolstring transportation apparatus", number: "US11,970,914", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US11970914.pdf" },
    ],
  },
  {
    family: "Focus",
    device: "Helix Centraliser (CX7, CX9, CX13)",
    summary:
      "World-first open-hole roller centraliser. Improved leverage geometry for entering restrictions and maintaining centralisation across a wide casing range.",
    patents: [
      { title: "Device for centering a sensor assembly in a bore", number: "US10,947,791", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US10947791B1.pdf" },
      { title: "Device for centering sensor assembly in a bore", number: "US11,913,291", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US11913291B2.pdf" },
      { title: "Device for centering sensor assembly in a bore", number: "US12,281,525", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US12281525.pdf" },
      { title: "Device for centering sensor assembly in a bore", number: "SA 16064", jurisdiction: "Saudi Arabia", link: "https://www.petromac.co.nz/pdf/SA16064.pdf" },
      { title: "Device for centering sensor assembly in a bore", number: "GB2611986", jurisdiction: "UK", link: "https://www.petromac.co.nz/pdf/GB2611986.pdf" },
    ],
  },
  {
    family: "Focus",
    device: "Rocker Centraliser (CRU, CRIL)",
    summary:
      "Synchronised rocker-arm mechanism for centralisation in small tubing and casing sizes where conventional centralisers lose leverage.",
    patents: [
      { title: "A device for centering a sensor assembly in a bore", number: "US10,947,792", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US10947792B1.pdf" },
      { title: "Device for centering sensor assembly in a bore", number: "US12,104,443", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US12104443B2.pdf" },
    ],
  },
  {
    family: "Focus",
    device: "Adjustable Centraliser (CA7)",
    summary:
      "Field-adjustable centraliser geometry for varied wellbore conditions in a single run.",
    patents: [
      { title: "Sensor transportation device", number: "US10,988,991", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US10988991B1.pdf" },
    ],
  },
  {
    family: "Focus",
    device: "Parallelogram & Compact Spring Centraliser (CP12)",
    summary:
      "Parallelogram-linkage and compact-spring mechanisms for open-hole centralisation in larger boreholes.",
    patents: [
      { title: "Device for centering a sensor assembly in a bore", number: "US11,136,880", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US11136880B1.pdf" },
    ],
  },
  {
    family: "Focus",
    device: "Co-pivot Centraliser (CP8)",
    summary:
      "Co-pivot mechanism for centralisation in tight bores where pivot-on-same-side geometry constrains travel.",
    patents: [
      { title: "Device for centering sensor assembly in a bore – \"Co-pivot Centraliser\"", number: "US11,713,627", jurisdiction: "USA", link: "https://www.petromac.co.nz/pdf/US11713627B1.pdf" },
    ],
  },
];

/**
 * Roll a patent up to a region for the summary row.
 * - EP-prefixed patents → "Europe" (regardless of how many EU countries
 *   are listed in the jurisdiction string).
 * - Eurasian patents → "Eurasia".
 * - Everything else uses the jurisdiction string verbatim (single
 *   country: USA, Malaysia, etc.).
 */
function regionFor(p: Patent): string {
  const num = p.number.trim();
  if (/^EP/i.test(num)) return "Europe";
  if (/eurasia/i.test(num)) return "Eurasia";
  return p.jurisdiction.trim();
}

function summariseJurisdictions(patents: Patent[]): string {
  const set = new Set(patents.map(regionFor));
  return Array.from(set).sort().join(", ");
}

export default function PatentsClient() {
  // Allow multiple rows to be expanded at once. Initialise empty (all closed).
  const [open, setOpen] = useState<Set<string>>(new Set());

  const rows = useMemo(
    () =>
      DEVICES.map((d) => ({
        ...d,
        jurisdictionSummary: summariseJurisdictions(d.patents),
      })),
    [],
  );

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const expandAll = () => setOpen(new Set(DEVICES.map((d) => d.device)));
  const collapseAll = () => setOpen(new Set());

  const totalPatents = DEVICES.reduce((n, d) => n + d.patents.length, 0);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header: title left, cross-link right */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-4">
          <h1 className="text-4xl font-bold text-gray-900">Patents</h1>
          <Link
            href="/about/publications"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
          >
            See also: Publications →
          </Link>
        </div>
        <p className="text-gray-600 leading-relaxed mb-6">
          Petromac&apos;s technologies are protected by a diverse portfolio of
          granted patents. {totalPatents} patents across {DEVICES.length}{" "}
          device families are listed below.
        </p>

        {/* Legal note — surfaced above the table so visitors see it first. */}
        <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-gray-700 text-sm leading-relaxed">
            <strong>Note:</strong> Any party (e.g., wireline service company,
            E&amp;P operator, or conveyance-accessory provider) that
            manufactures, imports, offers for sale, sells, or uses any
            Petromac patented technology without permission or licence from
            Petromac is considered to infringe the patented technology. If
            you wish to understand more, please feel free to contact us.
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-end gap-2 mb-3">
          <button
            onClick={expandAll}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Expand all
          </button>
          <span className="text-gray-300">·</span>
          <button
            onClick={collapseAll}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Collapse all
          </button>
        </div>

        {/* Summary table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Device
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Family
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Patents
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Jurisdictions
                  </th>
                  <th scope="col" className="px-3 py-3 w-12">
                    <span className="sr-only">Expand</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((row) => {
                  const isOpen = open.has(row.device);
                  return (
                    <SummaryRow
                      key={row.device}
                      row={row}
                      isOpen={isOpen}
                      onToggle={() => toggle(row.device)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}

function SummaryRow({
  row,
  isOpen,
  onToggle,
}: {
  row: Device & { jurisdictionSummary: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  // Stable id for the expanded panel so the summary row can reference it
  // via aria-controls. Strip whitespace and special chars.
  const panelId = `patents-detail-${row.device.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    // Activate on Enter or Space, matching native button behaviour.
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <>
      <tr
        className={`cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
          isOpen ? "bg-blue-50" : "hover:bg-gray-50"
        }`}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={`${isOpen ? "Collapse" : "Expand"} ${row.device} patents`}
      >
        <td className="px-6 py-4">
          <div className="text-sm font-semibold text-gray-900">
            {row.device}
          </div>
          <div className="text-sm text-gray-600 mt-1 leading-relaxed max-w-2xl">
            {row.summary}
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap align-top">
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              row.family === "Wireline Express"
                ? "bg-blue-100 text-blue-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {row.family}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-900 font-semibold text-right tabular-nums align-top">
          {row.patents.length}
        </td>
        <td className="px-6 py-4 text-sm text-gray-700 align-top">
          {row.jurisdictionSummary}
        </td>
        <td className="px-3 py-4 text-right align-top">
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full border text-gray-500 transition-transform ${
              isOpen ? "rotate-45 border-blue-300 text-blue-600" : "border-gray-300"
            }`}
            aria-hidden="true"
          >
            +
          </span>
        </td>
      </tr>
      {isOpen && (
        <tr id={panelId} className="bg-gray-50">
          <td colSpan={5} className="px-6 py-4">
            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-md border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Title
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    Patent
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Jurisdiction
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {row.patents.map((p) => (
                  <tr key={p.number} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {p.title}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {p.number}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {p.jurisdiction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}
