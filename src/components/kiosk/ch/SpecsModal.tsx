'use client';

import { useState } from 'react';

/**
 * SpecsModal — full-card spec sheet + optional load-capacity graph that the
 * pill's "Specifications" button opens.
 *
 * Sourced from `deviceSpecs.ts`. The same modal is rendered by every screen
 * that exposes Specifications on its pill (HelixProductScreen,
 * RockerProductScreen, MechanismScreen, LogsScreen) — each owns its own
 * `specsOpen` state and unmounts the modal on close. The implementation
 * used to live inline inside MechanismScreen; lifted out in May 2026 so the
 * new CH product screens could mount it without dragging the rest of
 * MechanismScreen along.
 *
 * The body is two columns when a graph is provided (dense two-column spec
 * table left, graph right, no inner scroll — max-h on the card keeps the
 * whole sheet inside the viewport) and single-column otherwise. The graph
 * has a tap-to-zoom lightbox above the modal.
 */
interface Props {
  specs: Record<string, string>;
  graph?: string | undefined;
  onClose: () => void;
}

export default function SpecsModal({ specs, graph, onClose }: Props) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/85"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Specifications"
    >
      <div
        className="relative w-full max-w-6xl mx-4 rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
              Specifications
            </p>
            <h3 className="text-xl font-bold">{specs.Name ?? 'Device'}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close specifications"
            className="w-9 h-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center text-xl"
          >
            ✕
          </button>
        </header>

        {/* Body — two columns side-by-side when a graph is present: dense
            two-column spec grid on the left, graph filling the right. No
            scroll target on the body — max-h on the outer card keeps the
            entire sheet within the viewport. */}
        <div
          className={`flex-1 min-h-0 px-6 py-4 grid gap-6 ${
            graph
              ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]'
              : 'grid-cols-1'
          } overflow-hidden`}
        >
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0 self-start content-start">
            {Object.entries(specs)
              .filter(([k]) => k !== 'Name')
              .map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-3 py-1.5 border-b border-slate-100"
                >
                  <dt className="text-xs text-slate-500 leading-tight">{k}</dt>
                  <dd className="text-xs font-medium text-slate-900 text-right leading-tight">
                    {v}
                  </dd>
                </div>
              ))}
          </dl>

          {graph && (
            <div className="flex flex-col gap-2 self-start">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  Load capacity
                </p>
                <p className="text-[10px] text-slate-400">Tap to zoom</p>
              </div>
              {/* Tap the graph → fullscreen lightbox. stopPropagation keeps
                  the click from bubbling up to the modal's dismiss handler. */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomed(true);
                }}
                aria-label="Zoom load capacity graph"
                className="block w-full rounded border border-slate-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={graph}
                  alt="Load capacity graph"
                  className="w-full h-auto block cursor-zoom-in"
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tap-to-zoom lightbox — full-viewport black backdrop, image at native
          aspect, single tap anywhere dismisses it. Sits ABOVE the SpecsModal
          so it covers the spec table too. */}
      {zoomed && graph && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 cursor-zoom-out"
          onClick={(e) => {
            e.stopPropagation();
            setZoomed(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Load capacity graph (zoomed)"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={graph}
            alt="Load capacity graph"
            className="max-w-[96vw] max-h-[92vh] w-auto h-auto object-contain"
          />
        </div>
      )}
    </div>
  );
}
