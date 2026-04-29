"use client";

/**
 * VendorQuoteReel — uses the shared word-by-word animation engine plus
 * `WordByWordRenderer` for the karaoke text. Only the vendor-specific
 * framing (header, attribution, CTA stage) lives here.
 */

import { forwardRef, useMemo, useRef } from "react";

import { CTABar } from "@/components/brand/CTABar";
import { WordByWordRenderer } from "@/components/animations/WordByWordRenderer";
import {
  DEFAULT_WPM,
  parseTextToTimeline,
  timelineDurationMs,
  type WordTimeline,
} from "@/lib/animations/word-by-word";
import {
  useReelPlayhead,
  type ReelHandle,
} from "@/components/templates/reels/_shared/useReelPlayhead";
import type { ConfessionalHighlightColor } from "@/lib/confessional-timing";

const PAPER_GRAIN_SVG =
  "url(\"data:image/svg+xml,%3Csvg width='180' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)' opacity='0.04'/%3E%3C/svg%3E\")";

const VISIBLE_LINES = 4;
const LINE_HEIGHT = 96;
const ATTRIBUTION_LEAD_MS = 250;
const CTA_DELAY_MS = 900;
const OUTRO_TAIL_MS = 1200;

interface HighlightPalette {
  highlight: string;
  halo: string;
}

const HIGHLIGHT_PALETTES: Record<ConfessionalHighlightColor, HighlightPalette> = {
  "hot-pink": { highlight: "var(--hot-pink)", halo: "rgba(237,147,177,0.55)" },
  gold: { highlight: "var(--gold)", halo: "rgba(212,168,83,0.55)" },
  lavender: { highlight: "var(--lavender)", halo: "rgba(224,208,240,0.65)" },
};

export interface VendorQuoteReelProps {
  vendorCategory: string;
  vendorName: string;
  quote: string;
  highlightColor?: ConfessionalHighlightColor;
  wordsPerMinute?: number;
  progressMs?: number;
  playing?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  onTick?: (ms: number, totalMs: number) => void;
  onComplete?: () => void;
}

export type VendorQuoteReelHandle = ReelHandle;

export const VendorQuoteReel = forwardRef<
  VendorQuoteReelHandle,
  VendorQuoteReelProps
>(function VendorQuoteReel(props, ref) {
  const {
    vendorCategory,
    vendorName,
    quote,
    highlightColor = "gold",
    wordsPerMinute = DEFAULT_WPM,
    progressMs,
    playing,
    loop = false,
    autoPlay = false,
    onTick,
    onComplete,
  } = props;

  const stages = useMemo(
    () => buildStages(quote, wordsPerMinute),
    [quote, wordsPerMinute],
  );

  const handleRef = useRef<ReelHandle | null>(null);
  const { currentMs } = useReelPlayhead(
    {
      totalMs: stages.outroEnd,
      progressMs,
      playing,
      autoPlay,
      loop,
      onTick,
      onComplete,
    },
    ref ?? handleRef,
  );

  return (
    <VendorReelStage
      timeline={stages.timeline}
      attributionStartMs={stages.attributionStartMs}
      ctaStartMs={stages.ctaStartMs}
      palette={HIGHLIGHT_PALETTES[highlightColor]}
      currentMs={progressMs ?? currentMs}
      vendorCategory={vendorCategory}
      vendorName={vendorName}
    />
  );
});

interface Stages {
  timeline: WordTimeline[];
  totalMs: number;
  attributionStartMs: number;
  ctaStartMs: number;
  outroEnd: number;
}

function buildStages(text: string, wpm: number): Stages {
  const timeline = parseTextToTimeline(text, wpm);
  const totalMs = timelineDurationMs(timeline);
  const attributionStartMs = totalMs + ATTRIBUTION_LEAD_MS;
  const ctaStartMs = attributionStartMs + CTA_DELAY_MS;
  const outroEnd = ctaStartMs + OUTRO_TAIL_MS;
  return { timeline, totalMs, attributionStartMs, ctaStartMs, outroEnd };
}

interface VendorReelStageProps {
  timeline: WordTimeline[];
  attributionStartMs: number;
  ctaStartMs: number;
  palette: HighlightPalette;
  currentMs: number;
  vendorCategory: string;
  vendorName: string;
}

export function VendorReelStage({
  timeline,
  attributionStartMs,
  ctaStartMs,
  palette,
  currentMs,
  vendorCategory,
  vendorName,
}: VendorReelStageProps) {
  const attributionOpacity = clamp01((currentMs - attributionStartMs) / 600);
  const ctaOpacity = clamp01((currentMs - ctaStartMs) / 600);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--wine)",
        position: "relative",
        overflow: "hidden",
        color: "var(--cream)",
        fontFamily: "'Instrument Serif', serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: PAPER_GRAIN_SVG,
          opacity: 0.6,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      <header
        style={{
          position: "absolute",
          top: 96,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "rgba(255,248,242,0.45)",
          }}
        >
          Vendor Wisdom
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: "'Instrument Serif', serif",
            fontSize: 28,
            fontStyle: "italic",
            color: palette.highlight,
            letterSpacing: 1,
          }}
        >
          {vendorCategory}
        </div>
      </header>

      <WordByWordRenderer
        timeline={timeline}
        currentTimeMs={currentMs}
        font="'Instrument Serif', serif"
        fontSize={68}
        italic
        activeColor="var(--cream)"
        dimColor="var(--cream)"
        highlightColor={palette.highlight}
        highlightStyle="sweep"
        textAlign="center"
        lineHeight={LINE_HEIGHT}
        visibleLines={VISIBLE_LINES}
        wordGapPx={18}
        linePaddingPx={96}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 240,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: attributionOpacity,
          transition: "opacity 200ms linear",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 52,
            color: "var(--cream)",
            lineHeight: 1.1,
            marginBottom: 6,
          }}
        >
          — {vendorName}
        </div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: "rgba(255,248,242,0.6)",
          }}
        >
          {vendorCategory}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          opacity: ctaOpacity,
          transition: "opacity 200ms linear",
        }}
      >
        <CTABar variant="light" />
      </div>
    </div>
  );
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export interface VendorQuoteReelStaticPreviewProps
  extends Omit<
    VendorQuoteReelProps,
    "progressMs" | "playing" | "autoPlay" | "loop"
  > {
  /** Where in the timeline to freeze. 0–1, default 0.4. */
  freezeAt?: number;
}

export function VendorQuoteReelStaticPreview({
  freezeAt = 0.4,
  ...rest
}: VendorQuoteReelStaticPreviewProps) {
  const { totalMs } = buildStages(rest.quote, rest.wordsPerMinute ?? DEFAULT_WPM);
  const target = totalMs * clamp01(freezeAt);
  return <VendorQuoteReel {...rest} progressMs={target} />;
}
