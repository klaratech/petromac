'use client';

/**
 * MechanismScreen — config-driven "Mechanism" sub-view.
 *
 * Used by the Cased Hole experiences (Helix / Rocker) and the Open Hole
 * `OverlayExperience` scaffolds. Renders a slideshow of mechanism content
 * (annotated diagrams + comparison videos) with a previous/next pager so
 * each piece gets the full screen rather than competing for space.
 *
 * A "Specifications" button in the header opens a modal with the device's
 * spec sheet (pulled from `deviceSpecs.ts` and passed in via `config.specs`).
 */

import Image from 'next/image';
import { useState } from 'react';

// ── Slide types ──────────────────────────────────────────────────────────────

/** A single mechanism video that loops fullscreen. */
export interface MechanismVideoSlide {
  type: 'video';
  /** Heading text — e.g. "Conventional mechanism", "HELIX mechanism". */
  label: string;
  /** Video path under /public. */
  src: string;
  /** Outline the slide (use for the Petromac side of a comparison). */
  highlight?: boolean;
  /** Optional small caption shown beneath the heading. */
  caption?: string;
}

/** A line callout extending outward from one edge of the diagram, e.g.
 *  the "9.0"" / "5.8"" dimension brackets on the conventional centralizer. */
export interface DimensionCallout {
  side: 'left' | 'right';
  /** Label rendered between the two bracket lines, e.g. `9.0"`. */
  label: string;
}

export interface Bullet {
  text: string;
  /** When set, renders the bullet in a highlight tone:
   *  - 'red'  for limitations (e.g. "Limited range of casing sizes")
   *  - 'blue' for benefits / takeaways (e.g. "Effective mechanism…").
   *    Uses the brand navy `#1E4A9A`. */
  highlight?: 'red' | 'blue';
}

/** An annotated diagram with dimension callouts and a bullet list. */
export interface MechanismAnnotatedSlide {
  type: 'annotated';
  /** Heading text — e.g. "Conventional centralizer". */
  label: string;
  /** Image of the tool. The component draws SVG callouts on top. */
  image: string;
  /** Dimension callouts extending outward from the tool image. */
  callouts: DimensionCallout[];
  /** Bullet list to the right of the diagram. */
  bullets: Bullet[];
  /** Optional secondary diagram shown above the bullets in the right column —
   *  used for things like the Rocker conventional-centralizer force section
   *  view. The dimension callouts do NOT apply to this image. */
  detailImage?: string;
}

/** A two-row comparison slide — typically conventional on top, Petromac on
 *  the bottom — with a short bullet list to the right summarising the
 *  takeaway. The images themselves carry any inline annotation (arrows,
 *  brackets) baked in by graphics. */
export interface MechanismComparisonSlide {
  type: 'comparison';
  /** Heading text — e.g. "Lever arm comparison". */
  label: string;
  /** Stacked rows. Two rows is the common case (conventional vs Petromac);
   *  the renderer handles N rows. */
  rows: { image: string; rowLabel?: string }[];
  /** Bullet list to the right of the rows. */
  bullets: Bullet[];
}

export type MechanismSlide =
  | MechanismVideoSlide
  | MechanismAnnotatedSlide
  | MechanismComparisonSlide;

export interface MechanismConfig {
  /** Shown as the screen heading, e.g. "Helix", "Pathfinder". */
  title: string;
  /** Ordered slides — first one shown on entry, pager steps through. */
  slides: MechanismSlide[];
  /** Spec sheet — opened via the "Specifications" header button. Pass the
   *  `specs` object from `deviceSpecs.ts` for the relevant device. */
  specs?: Record<string, string>;
  /** Optional footer note, e.g. a slide reference. */
  sourceNote?: string;
}

interface Props {
  config: MechanismConfig;
  onBack: () => void;
}

// ── Cased Hole presets ───────────────────────────────────────────────────────
// Asset slots — drop bare renders at these paths and the slides pick them up;
// inline annotations (dimension brackets, arrows) are either drawn by the
// component or already baked into the artwork by graphics.
//
// Helix slideshow:
//   /public/images/helix-mechanism-conventional.png        (annotated slide 1)
//   /public/images/helix-mechanism-helix.png               (annotated slide 2)
//   /public/images/helix-mechanism-lever-conventional.png  (comparison slide 3, top)
//   /public/images/helix-mechanism-lever-helix.png         (comparison slide 3, bottom)
//
// Rocker slideshow:
//   /public/images/rocker-mechanism-conventional.png         (annotated slide 1, tool render)
//   /public/images/rocker-mechanism-conventional-detail.png  (annotated slide 1, force-section detail)
//   /public/images/rocker-mechanism-rocker.png               (annotated slide 2)

export const HELIX_MECHANISM: MechanismConfig = {
  title: 'Helix',
  slides: [
    {
      type: 'annotated',
      label: 'Conventional centraliser',
      image: '/images/helix-mechanism-conventional.png',
      callouts: [
        { side: 'left', label: '9.0"' },
        { side: 'right', label: '5.8"' },
      ],
      bullets: [
        { text: 'Pivot point on SAME side' },
        { text: 'Minimal slider movement' },
        { text: 'Arm angle not optimised' },
        { text: 'Limited range of casing sizes', highlight: 'red' },
      ],
    },
    {
      type: 'annotated',
      label: 'HELIX',
      image: '/images/helix-mechanism-helix.png',
      callouts: [
        { side: 'left', label: '9.0"' },
        { side: 'right', label: '5.8"' },
      ],
      bullets: [
        { text: 'Pivot point on OPPOSITE side' },
        { text: 'Ensures arm angle is optimised' },
        { text: 'Large slider movement' },
        { text: 'Effective mechanism in large range of casing sizes', highlight: 'blue' },
      ],
    },
    {
      type: 'comparison',
      label: 'Lever arm comparison',
      rows: [
        { image: '/images/helix-mechanism-lever-conventional.png', rowLabel: 'Conventional' },
        { image: '/images/helix-mechanism-lever-helix.png', rowLabel: 'HELIX' },
      ],
      bullets: [
        { text: 'Helix enters restrictions with 80% less force', highlight: 'blue' },
      ],
    },
  ],
};

export const ROCKER_MECHANISM: MechanismConfig = {
  title: 'Rocker',
  slides: [
    {
      type: 'annotated',
      label: 'Conventional centraliser',
      image: '/images/rocker-mechanism-conventional.png',
      detailImage: '/images/rocker-mechanism-conventional-detail.png',
      callouts: [
        { side: 'left', label: '6.3"' },
        { side: 'right', label: '3.3"' },
      ],
      bullets: [
        { text: 'Arms independent of each other' },
        { text: 'In smaller holes, arm angle is very shallow' },
        { text: 'Minimal slider movement' },
        { text: 'Inefficient centralization' },
        { text: 'Mechanism fails in smaller holes', highlight: 'red' },
      ],
    },
    {
      type: 'annotated',
      label: 'ROCKER',
      image: '/images/rocker-mechanism-rocker.png',
      callouts: [
        { side: 'left', label: '6.3"' },
        { side: 'right', label: '3.3"' },
      ],
      bullets: [
        { text: 'Rocker arm pivots around centreline' },
        { text: 'Large slider movement' },
        { text: 'Synchronised arm assemblies' },
        { text: 'Effective mechanism in small casing sizes', highlight: 'blue' },
      ],
    },
  ],
};

// ── Main component ──────────────────────────────────────────────────────────

export default function MechanismScreen({ config, onBack }: Props) {
  const { slides } = config;
  const [index, setIndex] = useState(0);
  const [specsOpen, setSpecsOpen] = useState(false);
  const slide = slides[index];

  return (
    <div className="w-full h-full bg-black text-white flex flex-col">
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Mechanism
          </p>
          <h2 className="text-3xl font-extrabold">{config.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {config.specs && (
            <button
              onClick={() => setSpecsOpen(true)}
              className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm tracking-wide"
            >
              Specifications
            </button>
          )}
          <button
            onClick={onBack}
            className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm tracking-wide"
          >
            ← Back
          </button>
        </div>
      </header>

      <div className="flex-1 relative bg-black">
        {!slide ? (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
            No mechanism slides configured yet.
          </div>
        ) : slide.type === 'video' ? (
          <VideoSlide
            key={slide.src}
            label={slide.label}
            src={slide.src}
            highlight={slide.highlight ?? false}
            caption={slide.caption}
          />
        ) : slide.type === 'annotated' ? (
          <AnnotatedSlide
            key={slide.image}
            label={slide.label}
            image={slide.image}
            callouts={slide.callouts}
            bullets={slide.bullets}
            detailImage={slide.detailImage}
          />
        ) : (
          <ComparisonSlide
            key={slide.label}
            label={slide.label}
            rows={slide.rows}
            bullets={slide.bullets}
          />
        )}
      </div>

      {slides.length > 1 && (
        <footer className="flex items-center justify-between gap-3 py-4 px-8 border-t border-white/10">
          <span className="text-white/50 text-xs uppercase tracking-[0.2em]">
            {config.sourceNote ?? ''}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="text-white/60 text-sm tabular-nums">
              {index + 1} / {slides.length}
            </span>
            <button
              onClick={() =>
                setIndex((i) => Math.min(slides.length - 1, i + 1))
              }
              disabled={index === slides.length - 1}
              className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </footer>
      )}

      {specsOpen && config.specs && (
        <SpecsModal specs={config.specs} onClose={() => setSpecsOpen(false)} />
      )}
    </div>
  );
}

// ── Slide renderers ─────────────────────────────────────────────────────────

function VideoSlide({
  label,
  src,
  highlight,
  caption,
}: {
  label: string;
  src: string;
  highlight: boolean;
  caption?: string | undefined;
}) {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      <div
        className={`relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden border ${
          highlight
            ? 'border-white/40 ring-2 ring-white/30'
            : 'border-white/10'
        } bg-black/40`}
      >
        {/* No `muted` / no `controls` — kiosk mechanism slides play with
            their narration audio and rely on the experience HUD for nav. */}
        <video
          src={src}
          autoPlay
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLVideoElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm px-6 text-center -z-10">
          Drop file at <code className="text-white/70 mx-1">{src}</code>
        </div>
      </div>

      {/* Bottom-centre label pill (matches LogsScreen caption pattern) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <div className="px-4 py-2 rounded-full bg-black/60 text-sm uppercase tracking-[0.2em]">
          {label}
        </div>
        {caption && <p className="text-white/60 text-xs">{caption}</p>}
      </div>
    </div>
  );
}

/**
 * AnnotatedSlide — light-themed card showing a tool image with SVG dimension
 * callouts and a bullet list. Mimics the look of the ICOTA 2026 conventional-
 * centraliser slide: two horizontal callout brackets on the left and right
 * (with diameter labels), plus a vertically-centred bullet list to the right.
 */
function AnnotatedSlide({
  label,
  image,
  callouts,
  bullets,
  detailImage,
}: {
  label: string;
  image: string;
  callouts: DimensionCallout[];
  bullets: Bullet[];
  detailImage?: string | undefined;
}) {
  const leftCallout = callouts.find((c) => c.side === 'left');
  const rightCallout = callouts.find((c) => c.side === 'right');

  return (
    <div className="w-full h-full p-6 flex">
      <div className="flex-1 m-2 rounded-2xl bg-white text-slate-900 grid grid-cols-3 gap-6 px-8 py-10">
        {/* Diagram (2/3 of the card) */}
        <div className="col-span-2 relative flex items-center justify-center">
          {/* Left dimension callout */}
          {leftCallout && (
            <DimensionBracket
              side="left"
              label={leftCallout.label}
            />
          )}

          {/* Right dimension callout */}
          {rightCallout && (
            <DimensionBracket
              side="right"
              label={rightCallout.label}
            />
          )}

          {/* Tool image — bordered slot until graphics delivers the bare
              centraliser render. */}
          <div className="relative w-3/4 h-1/2 flex items-center justify-center">
            <Image
              src={image}
              alt={label}
              fill
              priority
              className="object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs text-center px-4 -z-10 border border-dashed border-slate-300 rounded">
              Drop tool render at
              <br />
              <code className="text-slate-600">{image}</code>
            </div>
          </div>
        </div>

        {/* Right column — optional detail image stacked above the bullets.
            When no detail image, bullets get the full column height. */}
        <div className="col-span-1 flex flex-col gap-4">
          {detailImage && (
            <div className="relative w-full h-36 shrink-0">
              <Image
                src={detailImage}
                alt={`${label} — detail`}
                fill
                className="object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-[10px] text-center px-2 -z-10 border border-dashed border-slate-300 rounded">
                Drop detail at
                <br />
                <code className="text-slate-600">{detailImage}</code>
              </div>
            </div>
          )}
          <BulletList bullets={bullets} className="flex-1" />
        </div>
      </div>

      {/* Slide label pill — keeps the same affordance as VideoSlide */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="px-4 py-2 rounded-full bg-black/60 text-white text-sm uppercase tracking-[0.2em]">
          {label}
        </div>
      </div>
    </div>
  );
}

/**
 * Two horizontal bracket lines extending outward from one side of the tool,
 * with a diameter label vertically centred between them. Mimics the
 * dimension-callout treatment in the source ICOTA slide.
 *
 * The bracket is positioned absolutely against its parent — anchor by `side`
 * and use the top/bottom of the parent for the bracket arms.
 */
function DimensionBracket({
  side,
  label,
}: {
  side: 'left' | 'right';
  label: string;
}) {
  const sideClass = side === 'left' ? 'left-0' : 'right-0';
  // Bracket arms span ~25% of the container width on each side, leaving the
  // middle ~50% for the tool image. Top and bottom arms sit ~30% from the
  // top/bottom of the diagram area.
  return (
    <div
      className={`absolute ${sideClass} top-0 bottom-0 w-1/4 pointer-events-none`}
      aria-hidden="true"
    >
      <div className="absolute left-0 right-0 top-[28%] h-px bg-slate-800" />
      <div className="absolute left-0 right-0 bottom-[28%] h-px bg-slate-800" />
      <span
        className={`absolute top-1/2 -translate-y-1/2 text-3xl font-semibold tabular-nums ${
          side === 'left' ? 'left-2' : 'right-2'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * ComparisonSlide — two (or more) stacked tool renders on a white card with
 * a short bullet list on the right. Used for the Helix lever-arm comparison
 * slide: conventional centraliser on top, HELIX on the bottom.
 *
 * Any inline annotations on the rows (arrows, lever-arm brackets) are baked
 * into the artwork by graphics — this component just lays the rows out.
 */
function ComparisonSlide({
  label,
  rows,
  bullets,
}: {
  label: string;
  rows: { image: string; rowLabel?: string }[];
  bullets: Bullet[];
}) {
  return (
    <div className="w-full h-full p-6 flex">
      <div className="flex-1 m-2 rounded-2xl bg-white text-slate-900 grid grid-cols-3 gap-6 px-8 py-10">
        {/* Stacked rows (2/3 of the card) */}
        <div className="col-span-2 flex flex-col gap-4">
          {rows.map((row) => (
            <div
              key={row.image}
              className="relative flex-1 rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
            >
              <Image
                src={row.image}
                alt={row.rowLabel ?? ''}
                fill
                className="object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs text-center px-4 -z-10">
                Drop row image at
                <br />
                <code className="text-slate-600">{row.image}</code>
              </div>
              {row.rowLabel && (
                <div className="absolute top-2 left-3 px-2 py-0.5 rounded bg-white/90 text-[10px] uppercase tracking-[0.18em] text-slate-700">
                  {row.rowLabel}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bullets */}
        <BulletList bullets={bullets} className="col-span-1" />
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="px-4 py-2 rounded-full bg-black/60 text-white text-sm uppercase tracking-[0.2em]">
          {label}
        </div>
      </div>
    </div>
  );
}

/**
 * Shared bullet list for the annotated + comparison slides. Renders inside
 * the right-hand 1/3 column of the white card. Highlight tones:
 *   'red'  → limitations (text-red-600)
 *   'blue' → benefits / takeaways (brand navy #1E4A9A)
 *   undefined → neutral (slate-900)
 */
function BulletList({
  bullets,
  className = '',
}: {
  bullets: Bullet[];
  className?: string;
}) {
  return (
    <ul className={`flex flex-col justify-center gap-6 ${className}`}>
      {bullets.map((b) => {
        const tone = bulletToneClasses(b.highlight);
        return (
          <li
            key={b.text}
            className={`flex items-start gap-3 text-lg font-medium ${tone.text}`}
          >
            <span
              className={`mt-2 inline-block w-1.5 h-1.5 rounded-full ${tone.dot}`}
              aria-hidden="true"
            />
            <span>{b.text}</span>
          </li>
        );
      })}
    </ul>
  );
}

function bulletToneClasses(highlight?: 'red' | 'blue') {
  if (highlight === 'red') return { text: 'text-red-600', dot: 'bg-red-600' };
  if (highlight === 'blue') return { text: 'text-[#1E4A9A]', dot: 'bg-[#1E4A9A]' };
  return { text: 'text-slate-900', dot: 'bg-slate-900' };
}

// ── Specs modal ─────────────────────────────────────────────────────────────

function SpecsModal({
  specs,
  onClose,
}: {
  specs: Record<string, string>;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Specifications"
    >
      <div
        className="relative w-full max-w-3xl mx-4 rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
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

        <dl className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 max-h-[60vh] overflow-y-auto">
          {Object.entries(specs)
            .filter(([k]) => k !== 'Name')
            .map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-2 border-b border-slate-100">
                <dt className="text-sm text-slate-500">{k}</dt>
                <dd className="text-sm font-medium text-slate-900 text-right">
                  {v}
                </dd>
              </div>
            ))}
        </dl>
      </div>
    </div>
  );
}
