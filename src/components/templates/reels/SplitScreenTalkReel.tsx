"use client";

import { forwardRef } from "react";

import { CTABar } from "@/components/brand/CTABar";
import {
  ReelFrame,
  clamp01,
  easeOutCubic,
  ramp,
  useReelPlayhead,
  type ReelHandle,
} from "./_shared";

export interface SplitScreenExchange {
  bride: string;
  mom: string;
}

export interface SplitScreenTalkReelProps {
  topic: string;
  exchanges: SplitScreenExchange[];
  finalTagline: string;
  progressMs?: number;
  playing?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  onTick?: (ms: number, totalMs: number) => void;
  onComplete?: () => void;
}

export type SplitScreenTalkReelHandle = ReelHandle;

const HEADER_MS = 1200;
const TYPE_PER_WORD_MS = 220;
const HOLD_AFTER_TYPE_MS = 1100;
const FINAL_MS = 3000;

export const SplitScreenTalkReel = forwardRef<
  SplitScreenTalkReelHandle,
  SplitScreenTalkReelProps
>(function SplitScreenTalkReel(props, ref) {
  const {
    topic,
    exchanges,
    finalTagline,
    progressMs,
    playing,
    loop = false,
    autoPlay = false,
    onTick,
    onComplete,
  } = props;

  const segments = buildSegments(exchanges);
  const exchangesEnd = segments.length
    ? segments[segments.length - 1].endMs
    : HEADER_MS;
  const totalMs = exchangesEnd + FINAL_MS;

  const { currentMs } = useReelPlayhead(
    { totalMs, progressMs, playing, loop, autoPlay, onTick, onComplete },
    ref,
  );

  return (
    <SplitScreenStage
      topic={topic}
      exchanges={exchanges}
      finalTagline={finalTagline}
      currentMs={currentMs}
    />
  );
});

interface Segment {
  side: "bride" | "mom";
  text: string;
  words: string[];
  startMs: number;
  typeEndMs: number;
  endMs: number;
}

function buildSegments(exchanges: SplitScreenExchange[]): Segment[] {
  const out: Segment[] = [];
  let cursor = HEADER_MS;
  exchanges.forEach((ex) => {
    (["bride", "mom"] as const).forEach((side) => {
      const text = side === "bride" ? ex.bride : ex.mom;
      const words = text.split(/\s+/).filter(Boolean);
      const typeMs = Math.max(600, words.length * TYPE_PER_WORD_MS);
      const startMs = cursor;
      const typeEndMs = startMs + typeMs;
      const endMs = typeEndMs + HOLD_AFTER_TYPE_MS;
      out.push({ side, text, words, startMs, typeEndMs, endMs });
      cursor = endMs;
    });
  });
  return out;
}

interface StageProps {
  topic: string;
  exchanges: SplitScreenExchange[];
  finalTagline: string;
  currentMs: number;
}

export function SplitScreenStage({
  topic,
  exchanges,
  finalTagline,
  currentMs,
}: StageProps) {
  const segments = buildSegments(exchanges);
  const exchangesEnd = segments.length
    ? segments[segments.length - 1].endMs
    : HEADER_MS;
  const finalStart = exchangesEnd;

  const onFinal = currentMs >= finalStart;

  // Find the latest message per side that's started.
  const brideMsg = latestActiveOrPast(segments, currentMs, "bride");
  const momMsg = latestActiveOrPast(segments, currentMs, "mom");

  return (
    <ReelFrame background="var(--cream)">
      {/* Top half — bride */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "50%",
          background: "var(--blush)",
          padding: "60px 80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <SideLabel
          label="The Bride"
          color="var(--deep-pink)"
          align="left"
        />
        {brideMsg ? (
          <TypingMessage
            segment={brideMsg}
            currentMs={currentMs}
            color="var(--wine)"
            isActive={
              currentMs >= brideMsg.startMs && currentMs < brideMsg.endMs
            }
          />
        ) : null}
      </div>

      {/* Bottom half — mom */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          bottom: 0,
          background: "var(--wine)",
          color: "var(--cream)",
          padding: "60px 80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <SideLabel
          label="The Mom"
          color="var(--gold-light)"
          align="right"
        />
        {momMsg ? (
          <TypingMessage
            segment={momMsg}
            currentMs={currentMs}
            color="var(--cream)"
            isActive={currentMs >= momMsg.startMs && currentMs < momMsg.endMs}
          />
        ) : null}
      </div>

      {/* Topic header strip */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: "var(--mauve)",
          opacity: ramp(currentMs, 0, 600),
        }}
      >
        Bridezilla vs. Momzilla — {topic}
      </div>

      {/* Final overlay — fades both sides into a center "vs." card */}
      {onFinal ? (
        <FinalOverlay
          topic={topic}
          finalTagline={finalTagline}
          progressMs={currentMs - finalStart}
        />
      ) : null}
    </ReelFrame>
  );
}

function latestActiveOrPast(
  segments: Segment[],
  currentMs: number,
  side: "bride" | "mom",
): Segment | undefined {
  let latest: Segment | undefined;
  for (const seg of segments) {
    if (seg.side !== side) continue;
    if (seg.startMs <= currentMs) latest = seg;
  }
  return latest;
}

function SideLabel({
  label,
  color,
  align,
}: {
  label: string;
  color: string;
  align: "left" | "right";
}) {
  return (
    <div
      style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 22,
        fontWeight: 800,
        letterSpacing: 8,
        textTransform: "uppercase",
        color,
        marginBottom: 24,
        textAlign: align,
      }}
    >
      {label}
    </div>
  );
}

function TypingMessage({
  segment,
  currentMs,
  color,
  isActive,
}: {
  segment: Segment;
  currentMs: number;
  color: string;
  isActive: boolean;
}) {
  // How many words have been "typed" so far in this segment.
  const elapsed = Math.max(0, currentMs - segment.startMs);
  const visibleCount = Math.min(
    segment.words.length,
    Math.floor(elapsed / TYPE_PER_WORD_MS) + 1,
  );
  const visible = segment.words.slice(0, visibleCount).join(" ");
  return (
    <div
      style={{
        fontFamily: "'Instrument Serif', serif",
        fontStyle: "italic",
        fontSize: 64,
        lineHeight: 1.2,
        color,
        maxWidth: 860,
        opacity: isActive ? 1 : 0.7,
      }}
    >
      “{visible}
      {visibleCount < segment.words.length && isActive ? (
        <Caret color={color} />
      ) : null}
      {visibleCount >= segment.words.length ? "”" : ""}
    </div>
  );
}

function Caret({ color }: { color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 4,
        height: 60,
        background: color,
        marginLeft: 6,
        verticalAlign: "middle",
        animation: "blink 600ms step-end infinite",
      }}
    />
  );
}

function FinalOverlay({
  topic,
  finalTagline,
  progressMs,
}: {
  topic: string;
  finalTagline: string;
  progressMs: number;
}) {
  const fadeT = ramp(progressMs, 0, 600);
  const eased = easeOutCubic(fadeT);
  const ctaT = ramp(progressMs, 800, 600);
  const ctaEased = easeOutCubic(ctaT);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `rgba(75,21,40,${eased * 0.92})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
        textAlign: "center",
        color: "var(--cream)",
      }}
    >
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 200,
          lineHeight: 1,
          color: "var(--gold-light)",
          opacity: eased,
          transform: `scale(${0.6 + eased * 0.4})`,
        }}
      >
        vs.
      </div>
      <div
        style={{
          marginTop: 36,
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "var(--gold-light)",
          opacity: eased,
        }}
      >
        {topic}
      </div>
      <div
        style={{
          marginTop: 48,
          fontFamily: "'Caveat', cursive",
          fontSize: 64,
          color: "var(--cream)",
          opacity: ctaEased,
          transform: `translateY(${(1 - ctaEased) * 24}px) rotate(-2deg)`,
          maxWidth: 880,
          lineHeight: 1.15,
        }}
      >
        {finalTagline}
      </div>
      <CTABar variant="light" />
    </div>
  );
}

export interface SplitScreenTalkReelStaticPreviewProps
  extends Omit<
    SplitScreenTalkReelProps,
    "progressMs" | "playing" | "autoPlay" | "loop"
  > {
  freezeAt?: number;
}

export function SplitScreenTalkReelStaticPreview({
  freezeAt = 0.55,
  ...rest
}: SplitScreenTalkReelStaticPreviewProps) {
  const segments = buildSegments(rest.exchanges);
  const exchangesEnd = segments.length
    ? segments[segments.length - 1].endMs
    : HEADER_MS;
  const totalMs = exchangesEnd + FINAL_MS;
  return (
    <SplitScreenTalkReel {...rest} progressMs={totalMs * clamp01(freezeAt)} />
  );
}
