'use client';

import { useState } from 'react';
import { AssetSlot } from '@/components/kiosk/AssetSlot';
import DrilldownMapCore from '@/components/geo/DrilldownMapCore';
import useOperationsData from '@/hooks/useOperationsData';
import SuccessStoriesFlipbook from '@/features/success-stories/components/SuccessStoriesFlipbook';
import type { JobRecord } from '@/types/JobRecord';
import type { SuccessStoriesFilters } from '@/features/success-stories/types';
import SectionPill, { type Section } from './SectionPill';
import SpecsModal from './SpecsModal';

/**
 * LogsScreen — config-driven "Case Studies" pager.
 *
 * Used by the Cased Hole experiences (Helix / Rocker) and the Open Hole
 * `OverlayExperience` scaffolds. Slide types:
 *
 *   - `map`        — Track Record drill-down map (DrilldownMapCore). Pulls
 *                    operations data from useOperationsData; the in-map
 *                    Success Stories link opens the flipbook as a takeover.
 *   - `single`     — full-bleed image with a caption pill.
 *   - `pair`       — two side-by-side comparison images.
 *   - `annotated`  — image with side text cards (and optional SVG circles).
 *
 * Track Record used to be its own HUD button — it folded into Case Studies
 * in May 2026 so the experiences are down to two HUD buttons (Mechanism +
 * Case Studies). Missing images fall back to a "drop file here" placeholder.
 *
 * Note on naming: the file, type and constants keep the historical `Logs`
 * naming for minimal churn — the displayed label is "Case Studies".
 */

/** Annotation circle — positioned in % of the image's bounding box so it
 *  follows the image regardless of how the parent column resizes. */
export interface AnnotationCircle {
  /** Centre X, % from the image's left edge. */
  xPct: number;
  /** Centre Y, % from the image's top edge. */
  yPct: number;
  /** Optional radius override, in % of the image height. Defaults to ~3.5. */
  rPct?: number;
}

/** A bullet inside a LogAnnotation. Strings render as plain bullets; the
 *  object form lets a single bullet override the parent annotation's
 *  tone (e.g. a red "limit" line under a blue benefit statement) and/or
 *  indent under the previous bullet (sub-sub-bullet). */
export type LogBullet =
  | string
  | {
      text: string;
      /** When true, the bullet renders nested under the previous one. */
      indent?: boolean;
      /** Color override for THIS bullet only. */
      tone?: 'red' | 'blue';
    };

/** A single annotation block — title, optional bullets, and the circles on
 *  the image that this block points at. The block's `tone` colors both
 *  the title text and the strokes of its circles, so a slide with both a
 *  "poor" zone (red) and an "excellent" zone (blue) reads cleanly. */
export interface LogAnnotation {
  /** Optional eyebrow shown above the title, e.g. "Key takeaway". */
  eyebrow?: string;
  /** Headline / main statement, e.g. "Excellent Centralization in 9-5/8"
   *  and 7" casings with CX9". */
  title: string;
  /** Optional bullet list shown under the title. */
  bullets?: LogBullet[];
  /** Visual tone — colors the title and the corresponding circle strokes.
   *  'red'  → limitations / poor outcome
   *  'blue' → benefits / good outcome (brand navy)
   *  undefined → neutral (white / navy circles) */
  tone?: 'red' | 'blue';
  /** Circle markers on the main image that this annotation refers to.
   *  Pass `[]` when the spotlight is on `detail` instead and the main image
   *  is presented un-annotated. */
  circles: AnnotationCircle[];
  /** Optional secondary chart shown beneath the bullets in this card —
   *  e.g. a summary histogram or distribution plot. Has its own circle
   *  overlay in its OWN coordinate space (so a circle at xPct: 65 on the
   *  detail is 65% of the detail image's bounding box, not the main one). */
  detail?: {
    src: string;
    alt: string;
    /** Optional circles overlaid on the detail image, scaled to the detail's
     *  own bounding box. Tone-colored the same way main-image circles are. */
    circles?: AnnotationCircle[];
  };
}

export type LogsSlide =
  | {
      /** Track Record drill-down map — first slide in every case-studies
       *  pager. Driven by `config.trackRecord` (system filter + Success
       *  Stories enable flag). Operations data fetched inside LogsScreen
       *  only when a map slide is present. */
      type: 'map';
      /** Optional caption pill shown bottom-centre. Defaults to "Track
       *  Record" if omitted. Pass `''` to hide entirely. */
      caption?: string;
    }
  | {
      type: 'single';
      src: string;
      /** Bottom-centre caption pill. Pass `''` or omit to hide. */
      caption?: string;
    }
  | {
      type: 'pair';
      caption?: string;
      left: { src: string; label: string };
      right: { src: string; label: string; highlight?: boolean };
    }
  | {
      /** Annotated log — image with side text cards calling out specific
       *  outcomes. Optionally carries SVG circle overlays in the image's
       *  own coordinate space. Bottom-centre caption is optional; drop it
       *  when the artwork would otherwise expose client or well names. */
      type: 'annotated';
      src: string;
      caption?: string;
      annotations: LogAnnotation[];
    };

export interface LogsConfig {
  /** Shown as the screen heading, e.g. "Helix", "Pathfinder". */
  title: string;
  slides: LogsSlide[];
  /** Spec sheet — exposed via the persistent pill's Specifications button
   *  when set. Same shape as MechanismConfig.specs so HelixExperience can
   *  fold the same deviceSpecs entry into both configs. */
  specs?: Record<string, string>;
  /** Optional graph image (load-capacity, performance curve, etc.) shown
   *  beneath the spec table in SpecsModal. */
  specsGraph?: string;
  /** Required when any slide is of type `map`. Drives the DrilldownMapCore
   *  inside that slide and toggles the in-map Success Stories link. */
  trackRecord?: {
    /** System filter passed to DrilldownMapCore `initialSystem` — e.g.
     *  "Focus - CH" for Helix/Rocker, "Wireline Express - FT" for OH
     *  Formation Testing. */
    system: string;
    /** Show the "Success Stories" link inside the map. Clicking it opens
     *  SuccessStoriesFlipbook as an inline takeover of LogsScreen. */
    enableSuccessStories?: boolean;
    /** Optional pre-selected Success Stories filters applied when the
     *  user opens the flipbook from this map (so the Helix/Rocker map
     *  lands on the Focus-CH-tagged stories rather than the full deck). */
    successStoriesFilters?: SuccessStoriesFilters;
  };
}

interface Props {
  config: LogsConfig;
  onBack: () => void;
  /** Switch to the peer sub-view (Mechanism) without bouncing back to the
   *  experience's main view. Rendered as the persistent header pill;
   *  parent typically wires this to its `setView` so 'mechanism' lands
   *  directly on MechanismScreen. */
  onSwitchSection: (_section: Section) => void;
}

// Configs (HELIX_LOGS, ROCKER_LOGS) moved to ./ch-configs.ts so the
// heavier view code in this file (DrilldownMapCore + SuccessStoriesFlipbook
// imports) can be `dynamic()`-loaded by HelixExperience / RockerExperience
// without dragging the configs into the experience's initial bundle.
//
// Slide captions on annotated Helix slides are deliberately dropped —
// they used to show client + well names which we can't expose to a kiosk
// audience.
//
// Asset slots referenced from ch-configs:
//   /public/images/kiosk-images/Helix_Log1.png      (slide 1)
//   /public/images/kiosk-images/Helix_Log2.png      (slide 2)
//   /public/images/kiosk-images/Helix_Log3-{1,2}.png  (slide 3)
//   /public/images/kiosk-images/Helix_Log4.png      (slide 4)
//   /public/images/kiosk-images/Helix_Log5-{1,2,3}.png  (slide 5)
//   /public/images/rocker-logs-{N}.png              (Rocker log comparisons)

export default function LogsScreen({
  config,
  onBack,
  onSwitchSection,
}: Props) {
  const slides = config.slides;
  const [index, setIndex] = useState(0);
  const [showSuccessStories, setShowSuccessStories] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);
  const slide = slides[index] as LogsSlide | undefined;

  // Only fetch operations data when a map slide is configured — keeps
  // standalone usages (e.g. an OH overlay with only image slides) from
  // pulling the ~600 KB JSON for no reason.
  const hasMap = slides.some((s) => s.type === 'map');
  const { data: jobData } = useOperationsData<JobRecord>({
    enabled: hasMap,
  });

  // Success Stories takes over the whole sub-view when triggered from
  // inside the map slide. Returns to the same slide index on Back. The
  // map's trackRecord config can carry an optional initial filter set
  // (e.g. CH map → Focus-CH tech tag) so the flipbook opens with the
  // relevant stories already filtered.
  if (showSuccessStories) {
    return (
      <SuccessStoriesFlipbook
        onBack={() => setShowSuccessStories(false)}
        backLabel="Back"
        {...(config.trackRecord?.successStoriesFilters
          ? { initialFilters: config.trackRecord.successStoriesFilters }
          : {})}
      />
    );
  }

  return (
    <div className="w-full h-full bg-black text-white flex flex-col">
      {/* Persistent section pill — Mechanism · Case Studies · Specifications
          (Specs only when `config.specs` is set). Same canonical pill the
          MechanismScreen + CH product screens render; tapping Specifications
          opens SpecsModal on top of this screen. */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <SectionPill
          active="logs"
          onSwitch={onSwitchSection}
          onOpenSpecs={
            config.specs ? () => setSpecsOpen(true) : undefined
          }
        />
        <button
          onClick={onBack}
          aria-label="Close"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-2xl"
        >
          ✕
        </button>
      </header>

      <div className="flex-1 relative bg-black">
        {!slide ? (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
            No log slides configured yet.
          </div>
        ) : slide.type === 'map' ? (
          <MapPane
            jobData={jobData}
            system={config.trackRecord?.system}
            onSuccessStoriesClick={
              config.trackRecord?.enableSuccessStories
                ? () => setShowSuccessStories(true)
                : undefined
            }
          />
        ) : slide.type === 'single' ? (
          <SinglePane src={slide.src} alt={slide.caption ?? ''} />
        ) : slide.type === 'pair' ? (
          <PairPane left={slide.left} right={slide.right} />
        ) : (
          <AnnotatedPane
            src={slide.src}
            alt={slide.caption ?? ''}
            annotations={slide.annotations}
          />
        )}

        {/* Pager — large round arrow buttons fixed at the left + right
            middle edges of the slide area. Disabled (faded out) at the
            boundaries instead of removed, so the layout doesn't shift
            when paging. Page indicator pill sits next to the caption. */}
        {slides.length > 1 && (
          <>
            <SlideNavButton
              direction="prev"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            />
            <SlideNavButton
              direction="next"
              onClick={() =>
                setIndex((i) => Math.min(slides.length - 1, i + 1))
              }
              disabled={index === slides.length - 1}
            />
          </>
        )}

      </div>

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

/** MapPane — renders the DrilldownMapCore inside a case-studies slide.
 *  Loading state matches the experience-level placeholder we used to show
 *  before this folded into LogsScreen. */
function MapPane({
  jobData,
  system,
  onSuccessStoriesClick,
}: {
  jobData: JobRecord[] | null | undefined;
  system: string | undefined;
  onSuccessStoriesClick?: (() => void) | undefined;
}) {
  if (!jobData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/70">
        Loading track record…
      </div>
    );
  }
  return (
    <DrilldownMapCore
      data={jobData}
      {...(system ? { initialSystem: system } : {})}
      showSuccessStoriesLink={Boolean(onSuccessStoriesClick)}
      {...(onSuccessStoriesClick ? { onSuccessStoriesClick } : {})}
      // Fill the slide area; the slide's bottom caption + pager arrows
      // sit on top of this via z-30.
      className="relative w-full h-full overflow-hidden bg-white"
    />
  );
}

/** Large round arrow button pinned to the left or right middle edge of a
 *  slide area. Used by both the Case Studies (LogsScreen) and Mechanism
 *  (MechanismScreen) pagers. */
function SlideNavButton({
  direction,
  onClick,
  disabled,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
}) {
  const sideClass = direction === 'prev' ? 'left-4' : 'right-4';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Previous slide' : 'Next slide'}
      className={`absolute top-1/2 -translate-y-1/2 z-30 ${sideClass} w-14 h-14 rounded-full bg-black/55 hover:bg-black/75 border border-white/15 text-white text-3xl flex items-center justify-center shadow-lg transition disabled:opacity-25 disabled:cursor-not-allowed`}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  );
}

function SinglePane({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <AssetSlot
        key={src}
        src={src}
        alt={alt}
        className="object-contain"
        theme="dark"
      />
    </div>
  );
}

function PairPane({
  left,
  right,
}: {
  left: { src: string; label: string };
  right: { src: string; label: string; highlight?: boolean };
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 w-full h-full">
      <ComparisonImage src={left.src} label={left.label} />
      <ComparisonImage
        src={right.src}
        label={right.label}
        highlight={right.highlight ?? false}
      />
    </div>
  );
}

function ComparisonImage({
  src,
  label,
  highlight = false,
}: {
  src: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden border ${
        highlight
          ? 'border-white/40 ring-2 ring-white/30'
          : 'border-white/10'
      } bg-black/40`}
    >
      <AssetSlot
        key={src}
        src={src}
        alt={label}
        className="object-contain"
        theme="dark"
      />
      <div className="absolute bottom-3 left-3 z-10 px-3 py-1 rounded-full bg-black/60 text-xs uppercase tracking-[0.2em]">
        {label}
      </div>
    </div>
  );
}

/**
 * AnnotatedPane — log image on the left with SVG circles overlaid at
 * configured % positions, and a vertical stack of text cards on the right.
 * Each card calls out a different annotation block; the block's `tone`
 * colors both the card title and the strokes of its circles so the
 * visual association reads at a glance.
 *
 * The circles are drawn into the image's bounding box (SVG viewBox
 * `0 0 100 100` with `preserveAspectRatio="none"`) so positions stay locked
 * to the image as it letterboxes inside its column. Each circle is drawn
 * twice — a white halo underneath the tone-colored stroke — so it reads
 * against both the white log strip and the darker table header up top.
 */
function AnnotatedPane({
  src,
  alt,
  annotations,
}: {
  src: string;
  alt: string;
  annotations: LogAnnotation[];
}) {
  // Tap-to-zoom for detail histograms. One zoom at a time across all
  // annotation cards on this slide. Tap anywhere in the lightbox to dismiss.
  const [zoomedDetail, setZoomedDetail] = useState<{ src: string; alt: string } | null>(null);

  return (
    <div className="relative w-full h-full grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 p-8">
      {/* Image column — AssetSlot fills the relative parent; circles ride
          on top in a same-bounding-box SVG. */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white">
        <AssetSlot
          key={src}
          src={src}
          alt={alt}
          className="object-contain"
          theme="light"
        />

        {/* Annotation overlay — pointer-events-none so taps still register
            on the lane underneath if anything were interactive. Flatten the
            annotations into a single circle list so each block can carry
            its own stroke colour. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {annotations.flatMap((a, ai) =>
            a.circles.map((c, ci) => {
              const r = c.rPct ?? 3.5;
              const stroke = toneStroke(a.tone);
              return (
                <g key={`a${ai}-c${ci}-${c.xPct}-${c.yPct}`}>
                  <circle
                    cx={c.xPct}
                    cy={c.yPct}
                    r={r}
                    fill="none"
                    stroke="white"
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={c.xPct}
                    cy={c.yPct}
                    r={r}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={2.5}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })
          )}
        </svg>
      </div>

      {/* Side-mounted text cards — stacked vertically and constrained to
          the slide height so two-card stacks (e.g. slide 5: ECCE + drag
          histograms) fit without scrolling. Each card flexes inside the
          column; detail histograms render as thumbnails with tap-to-zoom. */}
      <div className="flex flex-col justify-center gap-3 overflow-hidden">
        {annotations.map((a, i) => (
          <AnnotationCard
            key={`${a.title}-${i}`}
            annotation={a}
            onZoomDetail={setZoomedDetail}
          />
        ))}
      </div>

      {/* Tap-to-zoom lightbox — fullscreen black backdrop, image at native
          aspect. Single tap anywhere dismisses. Sits ABOVE the slide pager
          (z-30) and slide caption so it covers them too. */}
      {zoomedDetail && (
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 cursor-zoom-out"
          onClick={() => setZoomedDetail(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Detail image (zoomed)"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomedDetail.src}
            alt={zoomedDetail.alt}
            className="max-w-[92vw] max-h-[88vh] w-auto h-auto object-contain"
          />
        </div>
      )}
    </div>
  );
}

function AnnotationCard({
  annotation,
  onZoomDetail,
}: {
  annotation: LogAnnotation;
  onZoomDetail: (_detail: { src: string; alt: string }) => void;
}) {
  const titleClass = annotation.tone === 'red'
    ? 'text-red-400'
    : annotation.tone === 'blue'
      ? 'text-[#7FA8E6]'
      : 'text-white';
  const stroke = toneStroke(annotation.tone);
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-4 min-h-0 flex flex-col">
      {annotation.eyebrow && (
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-1.5">
          {annotation.eyebrow}
        </p>
      )}
      <p className={`text-base md:text-lg font-semibold leading-snug ${titleClass}`}>
        {annotation.title}
      </p>
      {annotation.bullets && annotation.bullets.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {annotation.bullets.map((b, i) => {
            const text = typeof b === 'string' ? b : b.text;
            const indent = typeof b === 'object' && b.indent;
            const bulletTone = typeof b === 'object' ? b.tone : undefined;
            const textColor =
              bulletTone === 'red'
                ? 'text-red-400'
                : bulletTone === 'blue'
                  ? 'text-[#7FA8E6]'
                  : 'text-white/85';
            const dotColor =
              bulletTone === 'red'
                ? 'bg-red-400'
                : bulletTone === 'blue'
                  ? 'bg-[#7FA8E6]'
                  : 'bg-white/60';
            return (
              <li
                key={`${i}-${text}`}
                className={`flex items-start gap-2 text-xs md:text-sm ${textColor} ${
                  indent ? 'pl-5' : ''
                }`}
              >
                <span
                  className={`mt-1.5 inline-block w-1 h-1 rounded-full shrink-0 ${dotColor}`}
                  aria-hidden="true"
                />
                <span>{text}</span>
              </li>
            );
          })}
        </ul>
      )}
      {annotation.detail && (
        <button
          type="button"
          onClick={() =>
            annotation.detail &&
            onZoomDetail({ src: annotation.detail.src, alt: annotation.detail.alt })
          }
          aria-label={`Zoom ${annotation.detail.alt}`}
          // Compact thumbnail — keeps two-card stacks fitting on the
          // slide without scroll. Tap opens the full-size lightbox.
          className="relative mt-3 rounded-lg overflow-hidden bg-white max-h-[140px] focus:outline-none focus:ring-2 focus:ring-brand cursor-zoom-in"
        >
          <div className="relative w-full h-[140px]">
            <AssetSlot
              key={annotation.detail.src}
              src={annotation.detail.src}
              alt={annotation.detail.alt}
              className="object-contain"
              theme="light"
            />
            {annotation.detail.circles && annotation.detail.circles.length > 0 && (
              <svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                {annotation.detail.circles.map((c, i) => {
                  const r = c.rPct ?? 4;
                  return (
                    <g key={`detail-${i}-${c.xPct}-${c.yPct}`}>
                      <circle
                        cx={c.xPct}
                        cy={c.yPct}
                        r={r}
                        fill="none"
                        stroke="white"
                        strokeWidth={1.5}
                        vectorEffect="non-scaling-stroke"
                      />
                      <circle
                        cx={c.xPct}
                        cy={c.yPct}
                        r={r}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={2.5}
                        vectorEffect="non-scaling-stroke"
                      />
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
          <span className="absolute bottom-1 right-2 text-[10px] text-slate-500 pointer-events-none">
            Tap to zoom
          </span>
        </button>
      )}
    </div>
  );
}

/** Stroke color for an annotation's circles. Red for limitation zones,
 *  brand navy for benefit zones, neutral navy when unspecified. */
function toneStroke(tone?: 'red' | 'blue'): string {
  if (tone === 'red') return '#DC2626'; // tailwind red-600
  return '#1E4A9A';
}
