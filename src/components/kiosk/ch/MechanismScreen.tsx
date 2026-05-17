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

import { useState } from 'react';
import { AssetSlot } from '@/components/kiosk/AssetSlot';

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
  /** Distance from the edge (top + bottom) to each bracket arm, in % of the
   *  bracket slab's height. Lower values = wider gap between the lines =
   *  larger represented diameter. Defaults to 28 if omitted.
   *
   *  Tune per side so the lines visually align with the tool's arm-tip
   *  positions at the matching diameter (e.g. LEFT 9.0" uses a wider gap
   *  than RIGHT 5.8" on the same Helix slide). */
  spreadPct?: number;
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
  /** Image of the tool. The component draws SVG callouts on top. Also acts
   *  as the `poster` for `video` when both are set. */
  image: string;
  /** Optional mechanism video that plays in place of `image` between the
   *  dimension brackets (autoplay, loop, playsInline). Use this to embed a
   *  motion clip inside an annotated slide rather than spend a separate
   *  slide on it. `image` is still used as the poster fallback. */
  video?: string;
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
  /** Optional graph image (load-capacity, performance curve, etc.) shown
   *  beneath the spec table in SpecsModal. Pass `deviceSpec.graph` here. */
  specsGraph?: string;
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
    // 1. Annotated conventional centraliser — limitations.
    //    The conventional-mechanism video plays between the 9.0"/5.8"
    //    brackets so motion + annotation share one slide.
    //
    //    spreadPct is tuned to the casing diameter — the left bracket sits
    //    further from centre (representing the wider 9.0" casing wall), the
    //    right bracket sits closer in (5.8" wall). Ratio approximates
    //    5.8 / 9.0 ≈ 0.65.
    {
      type: 'annotated',
      label: 'Conventional centraliser',
      image: '/images/helix-mechanism-conventional.png',
      video: '/videos/transcoded/conventional-largecasings.mp4',
      callouts: [
        { side: 'left', label: '9.0"', spreadPct: 12 },
        { side: 'right', label: '5.8"', spreadPct: 26 },
      ],
      bullets: [
        { text: 'Pivot point on SAME side' },
        { text: 'Minimal slider movement' },
        { text: 'Arm angle not optimised' },
        { text: 'Limited range of casing sizes', highlight: 'red' },
      ],
    },
    // 2. Annotated HELIX — benefits. Same 9.0"/5.8" brackets as slide 1's
    //    counterpoint; the HELIX-mechanism video plays between them.
    {
      type: 'annotated',
      label: 'HELIX',
      image: '/images/helix-mechanism-helix.png',
      video: '/videos/transcoded/helix-mechanism.mp4',
      callouts: [
        { side: 'left', label: '9.0"', spreadPct: 12 },
        { side: 'right', label: '5.8"', spreadPct: 26 },
      ],
      bullets: [
        { text: 'Pivot point on OPPOSITE side' },
        { text: 'Ensures arm angle is optimised' },
        { text: 'Large slider movement' },
        { text: 'Effective mechanism in large range of casing sizes', highlight: 'blue' },
      ],
    },
    // 3. Lever-arm comparison — the takeaway: 80% less force.
    //    The artwork lives in /images/leverage-{conventional,helix}.png and
    //    already has the red short-lever arrow + green long-lever bracket
    //    baked in. (Previously these were the first Case Studies slide.)
    {
      type: 'comparison',
      label: 'Lever arm comparison',
      rows: [
        { image: '/images/leverage-conventional.png', rowLabel: 'Conventional' },
        { image: '/images/leverage-helix.png', rowLabel: 'HELIX' },
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
    // 1. Annotated conventional small-casing centraliser — limitations.
    //    The conventional-smallcasings mechanism video plays between the
    //    6.3"/3.3" brackets. The force-section schematic stays in the
    //    right column above the bullets via `detailImage`.
    //
    //    spreadPct ratio: 30/12 represents the same 3.3"/6.3" diameter
    //    ratio (~0.52) the Helix slides do for 5.8"/9.0".
    {
      type: 'annotated',
      label: 'Conventional centraliser',
      image: '/images/rocker-mechanism-conventional.png',
      video: '/videos/transcoded/conventional-smallcasings.mp4',
      detailImage: '/images/rocker-mechanism-conventional-detail.png',
      callouts: [
        { side: 'left', label: '6.3"', spreadPct: 12 },
        { side: 'right', label: '3.3"', spreadPct: 30 },
      ],
      bullets: [
        { text: 'Arms independent of each other' },
        { text: 'In smaller holes, arm angle is very shallow' },
        { text: 'Minimal slider movement' },
        { text: 'Inefficient centralization' },
        { text: 'Mechanism fails in smaller holes', highlight: 'red' },
      ],
    },
    // 2. Annotated ROCKER — benefits. Rocker mechanism video plays between
    //    the same 6.3"/3.3" brackets as slide 1's counterpoint.
    {
      type: 'annotated',
      label: 'ROCKER',
      image: '/images/rocker-mechanism-rocker.png',
      video: '/videos/transcoded/rocker-mechanism.mp4',
      callouts: [
        { side: 'left', label: '6.3"', spreadPct: 12 },
        { side: 'right', label: '3.3"', spreadPct: 30 },
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
            video={slide.video}
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
        <SpecsModal
          specs={config.specs}
          graph={config.specsGraph}
          onClose={() => setSpecsOpen(false)}
        />
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
  video,
  callouts,
  bullets,
  detailImage,
}: {
  label: string;
  image: string;
  video?: string | undefined;
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
          {/* Tool image OR mechanism video — fills the diagram column so the
              video plays as large as possible. `bg-white` paints the video's
              letterbox/pillarbox area white so it blends into the slide card
              (Android Chrome renders the unused area black by default).
              Brackets render directly into the column on top — no slab. */}
          {video ? (
            <video
              src={video}
              poster={image}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-contain bg-white"
              onError={(e) => {
                (e.currentTarget as HTMLVideoElement).style.display = 'none';
              }}
            />
          ) : (
            <AssetSlot
              src={image}
              alt={label}
              priority
              className="object-contain"
              theme="light"
            />
          )}

          {/* Dimension callouts — render directly against the column, not
              inside an edge slab. The label sits at the column edge and the
              two horizontal lines reach roughly half the column inward so
              they visually "point at" the tool arms. */}
          {leftCallout && (
            <DimensionBracket
              side="left"
              label={leftCallout.label}
              spreadPct={leftCallout.spreadPct}
            />
          )}

          {rightCallout && (
            <DimensionBracket
              side="right"
              label={rightCallout.label}
              spreadPct={rightCallout.spreadPct}
            />
          )}
        </div>

        {/* Right column — optional detail image stacked above the bullets.
            When no detail image, bullets get the full column height. */}
        <div className="col-span-1 flex flex-col gap-4">
          {detailImage && (
            <div className="relative w-full h-36 shrink-0">
              <AssetSlot
                src={detailImage}
                alt={`${label} — detail`}
                className="object-contain"
                theme="light"
              />
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
 * Two horizontal dimension lines + a diameter label, rendered directly
 * against the diagram column (no edge slab). The label sits at the very
 * edge; each line extends across roughly half the column so the brackets
 * read as pointers at the tool arms, matching the ICOTA source slide.
 *
 * `spreadPct` controls how close each line sits to the top / bottom edge:
 *   - smaller value → lines closer to the edges → wider visible gap →
 *     "larger diameter" feel (use for 9.0" / 6.3")
 *   - larger value → lines closer to centre → narrower visible gap →
 *     "smaller diameter" feel (use for 5.8" / 3.3")
 */
function DimensionBracket({
  side,
  label,
  spreadPct = 28,
}: {
  side: 'left' | 'right';
  label: string;
  spreadPct?: number | undefined;
}) {
  const isLeft = side === 'left';
  // Line spans ~5% → ~48% on the left (or 52% → 95% on the right) so each
  // line is ~43% of the column wide — long enough to visually point at the
  // tool, short enough not to cross the body in the middle.
  const lineSpan: React.CSSProperties = isLeft
    ? { left: '5%', right: '52%' }
    : { left: '52%', right: '5%' };

  return (
    <>
      <div
        aria-hidden="true"
        className="absolute h-px bg-slate-800 pointer-events-none z-10"
        style={{ top: `${spreadPct}%`, ...lineSpan }}
      />
      <div
        aria-hidden="true"
        className="absolute h-px bg-slate-800 pointer-events-none z-10"
        style={{ bottom: `${spreadPct}%`, ...lineSpan }}
      />
      <span
        aria-hidden="true"
        className={`absolute top-1/2 -translate-y-1/2 z-20 text-3xl font-semibold tabular-nums text-slate-900 pointer-events-none ${
          isLeft ? 'left-1' : 'right-1'
        }`}
      >
        {label}
      </span>
    </>
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
              <AssetSlot
                src={row.image}
                alt={row.rowLabel ?? ''}
                className="object-contain"
                theme="light"
              />
              {row.rowLabel && (
                <div className="absolute top-2 left-3 px-2 py-0.5 rounded bg-white/90 text-[10px] uppercase tracking-[0.18em] text-slate-700 z-10">
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
  graph,
  onClose,
}: {
  specs: Record<string, string>;
  graph?: string | undefined;
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
        className="relative w-full max-w-5xl mx-4 rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
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

        {/* Body — two columns on wider screens: spec table left, graph right.
            Falls back to a single column when there's no graph. */}
        <div className={`flex-1 min-h-0 overflow-y-auto px-6 py-4 grid gap-6 ${graph ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]' : 'grid-cols-1'}`}>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-8 gap-y-2 self-start">
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

          {graph && (
            <div className="flex flex-col gap-2 self-start lg:sticky lg:top-0">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                Load capacity
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={graph}
                alt="Load capacity graph"
                className="w-full h-auto rounded border border-slate-200"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
