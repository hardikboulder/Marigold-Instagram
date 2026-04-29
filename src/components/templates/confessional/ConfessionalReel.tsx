"use client";

/**
 * ConfessionalReel — browser preview component (also used as the static
 * "frozen frame" thumbnail in the gallery / feed grid).
 *
 * The animation engine and visual word renderer are shared across every
 * text-driven reel template — see `@/lib/animations/word-by-word` and
 * `@/components/animations/WordByWordRenderer`. This file owns only the
 * Confessional-specific framing (header, attribution, CTA stage).
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

const PAPER_GRAIN_SVG =
  "url(\"data:image/svg+xml,%3Csvg width='180' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)' opacity='0.04'/%3E%3C/svg%3E\")";

const VISIBLE_LINES = 4;
const LINE_HEIGHT = 96;
const ATTRIBUTION_LEAD_MS = 250;
const CTA_DELAY_MS = 900;
const OUTRO_TAIL_MS = 1200;

export type ConfessionalHighlightColor = "hot-pink" | "gold" | "lavender";

interface HighlightPalette {
  highlight: string;
  halo: string;
}

const HIGHLIGHT_PALETTES: Record<ConfessionalHighlightColor, HighlightPalette> = {
  "hot-pink": { highlight: "var(--hot-pink)", halo: "rgba(237,147,177,0.55)" },
  gold: { highlight: "var(--gold)", halo: "rgba(212,168,83,0.55)" },
  lavender: { highlight: "var(--lavender)", halo: "rgba(224,208,240,0.65)" },
};

export interface ConfessionalReelProps {
  confessionNumber: number;
  confessionText: string;
  attribution: string;
  wordsPerMinute?: number;
  highlightColor?: ConfessionalHighlightColor;
  /** Hard-set the playhead in ms. Disables internal RAF when provided. */
  progressMs?: number;
  /** Externally toggle playback when `progressMs` is omitted. */
  playing?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  onTick?: (ms: number, totalMs: number) => void;
  onComplete?: () => void;
}

export type ConfessionalReelHandle = ReelHandle;

export const ConfessionalReel = forwardRef<
  ConfessionalReelHandle,
  ConfessionalReelProps
>(function ConfessionalReel(props, ref) {
  const {
    confessionNumber,
    confessionText,
    attribution,
    wordsPerMinute = DEFAULT_WPM,
    highlightColor = "hot-pink",
    progressMs,
    playing,
    loop = false,
    autoPlay = false,
    onTick,
    onComplete,
  } = props;

  const stages = useMemo(
    () => buildStages(confessionText, wordsPerMinute),
    [confessionText, wordsPerMinute],
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
    <ReelStage
      timeline={stages.timeline}
      attributionStartMs={stages.attributionStartMs}
      ctaStartMs={stages.ctaStartMs}
      palette={HIGHLIGHT_PALETTES[highlightColor]}
      currentMs={progressMs ?? currentMs}
      confessionNumber={confessionNumber}
      attribution={attribution}
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

interface ReelStageProps {
  timeline: WordTimeline[];
  attributionStartMs: number;
  ctaStartMs: number;
  palette: HighlightPalette;
  currentMs: number;
  confessionNumber: number;
  attribution: string;
}

export function ReelStage({
  timeline,
  attributionStartMs,
  ctaStartMs,
  palette,
  currentMs,
  confessionNumber,
  attribution,
}: ReelStageProps) {
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
          The Confessional
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
          № {pad2(confessionNumber)}
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
          fontFamily: "'Caveat', cursive",
          fontSize: 44,
          color: "rgba(255,248,242,0.85)",
          opacity: attributionOpacity,
          transition: "opacity 200ms linear",
          zIndex: 2,
        }}
      >
        {attribution}
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

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export interface ConfessionalReelStaticPreviewProps
  extends Omit<
    ConfessionalReelProps,
    "progressMs" | "playing" | "autoPlay" | "loop"
  > {
  /** Where in the timeline to freeze. 0–1, default 0.4. */
  freezeAt?: number;
}

export function ConfessionalReelStaticPreview({
  freezeAt = 0.4,
  ...rest
}: ConfessionalReelStaticPreviewProps) {
  const { totalMs } = buildStages(
    rest.confessionText,
    rest.wordsPerMinute ?? DEFAULT_WPM,
  );
  const target = totalMs * clamp01(freezeAt);
  return <ConfessionalReel {...rest} progressMs={target} />;
}
