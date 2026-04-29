"use client";

/**
 * DiaryEntryReel — uses the shared word-by-word animation engine plus
 * `WordByWordRenderer` for the karaoke text, with a "handwritten" treatment:
 * underline highlight on the active word, dim mauve for unread, deep pink
 * for read.
 */

import { forwardRef, useMemo, useRef } from "react";

import { CTABar } from "@/components/brand/CTABar";
import { WordByWordRenderer } from "@/components/animations/WordByWordRenderer";
import {
  parseTextToTimeline,
  timelineDurationMs,
  type WordTimeline,
} from "@/lib/animations/word-by-word";
import {
  useReelPlayhead,
  type ReelHandle,
} from "@/components/templates/reels/_shared/useReelPlayhead";
import { DiaryDoodle, type DiaryMarginDoodle } from "./DiaryDoodle";

const PAPER_GRAIN_SVG =
  "url(\"data:image/svg+xml,%3Csvg width='180' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)' opacity='0.04'/%3E%3C/svg%3E\")";

const LINED_BACKGROUND =
  "repeating-linear-gradient(transparent, transparent 118px, rgba(212,83,126,0.10) 118px, rgba(212,83,126,0.10) 120px)";

const VISIBLE_LINES = 4;
const LINE_HEIGHT = 132;
const ATTRIBUTION_LEAD_MS = 250;
const CTA_DELAY_MS = 900;
const OUTRO_TAIL_MS = 1200;

const DIARY_REEL_DEFAULT_WPM = 110;

export interface DiaryEntryReelProps {
  dayOrWeek: string;
  dateLabel: string;
  diaryText: string;
  brideIdentifier: string;
  planningStage: string;
  marginDoodle: DiaryMarginDoodle;
  wordsPerMinute?: number;
  progressMs?: number;
  playing?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  onTick?: (ms: number, totalMs: number) => void;
  onComplete?: () => void;
}

export type DiaryEntryReelHandle = ReelHandle;

export const DiaryEntryReel = forwardRef<
  DiaryEntryReelHandle,
  DiaryEntryReelProps
>(function DiaryEntryReel(props, ref) {
  const {
    dayOrWeek,
    dateLabel,
    diaryText,
    brideIdentifier,
    planningStage,
    marginDoodle,
    wordsPerMinute = DIARY_REEL_DEFAULT_WPM,
    progressMs,
    playing,
    loop = false,
    autoPlay = false,
    onTick,
    onComplete,
  } = props;

  const stages = useMemo(
    () => buildStages(diaryText, wordsPerMinute),
    [diaryText, wordsPerMinute],
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
    <DiaryReelStage
      timeline={stages.timeline}
      attributionStartMs={stages.attributionStartMs}
      ctaStartMs={stages.ctaStartMs}
      currentMs={progressMs ?? currentMs}
      dayOrWeek={dayOrWeek}
      dateLabel={dateLabel}
      brideIdentifier={brideIdentifier}
      planningStage={planningStage}
      marginDoodle={marginDoodle}
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

interface DiaryReelStageProps {
  timeline: WordTimeline[];
  attributionStartMs: number;
  ctaStartMs: number;
  currentMs: number;
  dayOrWeek: string;
  dateLabel: string;
  brideIdentifier: string;
  planningStage: string;
  marginDoodle: DiaryMarginDoodle;
}

export function DiaryReelStage({
  timeline,
  attributionStartMs,
  ctaStartMs,
  currentMs,
  dayOrWeek,
  dateLabel,
  brideIdentifier,
  planningStage,
  marginDoodle,
}: DiaryReelStageProps) {
  const attributionOpacity = clamp01((currentMs - attributionStartMs) / 600);
  const ctaOpacity = clamp01((currentMs - ctaStartMs) / 600);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#FFFDF8",
        backgroundImage: LINED_BACKGROUND,
        backgroundPosition: "0 360px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: PAPER_GRAIN_SVG,
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />

      <header
        style={{
          position: "absolute",
          top: 140,
          left: 96,
          right: 96,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "var(--pink)",
          }}
        >
          REAL BRIDE DIARIES
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            paddingBottom: 18,
            borderBottom: "1px solid rgba(75,21,40,0.12)",
          }}
        >
          <div
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              fontSize: 88,
              color: "var(--wine)",
              lineHeight: 0.95,
            }}
          >
            {dayOrWeek}
          </div>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: 2,
              color: "var(--mauve)",
              textTransform: "uppercase",
            }}
          >
            {dateLabel}
          </div>
        </div>
      </header>

      <DiaryDoodle
        doodle={marginDoodle}
        size={170}
        color="var(--pink)"
        style={{
          position: "absolute",
          top: 460,
          right: 60,
          transform: "rotate(10deg)",
          opacity: 0.55 + 0.4 * clamp01(currentMs / 1200),
          zIndex: 2,
          transition: "opacity 240ms linear",
        }}
      />

      <WordByWordRenderer
        timeline={timeline}
        currentTimeMs={currentMs}
        font="'Caveat', cursive"
        fontSize={96}
        activeColor="var(--deep-pink)"
        dimColor="var(--wine)"
        highlightColor="var(--hot-pink)"
        highlightStyle="underline"
        textAlign="center"
        lineHeight={LINE_HEIGHT}
        visibleLines={VISIBLE_LINES}
        wordGapPx={24}
        linePaddingPx={96}
        pastOpacity={0.85}
        futureOpacity={0.32}
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
          bottom: 260,
          left: 96,
          right: 96,
          textAlign: "center",
          opacity: attributionOpacity,
          transition: "opacity 200ms linear",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 44,
            color: "var(--mauve)",
            transform: "rotate(-1.5deg)",
            marginBottom: 6,
          }}
        >
          — {planningStage}
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "var(--wine)",
          }}
        >
          {brideIdentifier}
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
        <CTABar />
      </div>
    </div>
  );
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export interface DiaryEntryReelStaticPreviewProps
  extends Omit<
    DiaryEntryReelProps,
    "progressMs" | "playing" | "autoPlay" | "loop"
  > {
  /** Where in the timeline to freeze. 0–1, default 0.4. */
  freezeAt?: number;
}

export function DiaryEntryReelStaticPreview({
  freezeAt = 0.4,
  ...rest
}: DiaryEntryReelStaticPreviewProps) {
  const { totalMs } = buildStages(
    rest.diaryText,
    rest.wordsPerMinute ?? DIARY_REEL_DEFAULT_WPM,
  );
  const target = totalMs * clamp01(freezeAt);
  return <DiaryEntryReel {...rest} progressMs={target} />;
}

export { DIARY_REEL_DEFAULT_WPM };
