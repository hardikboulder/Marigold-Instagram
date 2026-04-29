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

export type BeforeAfterTransition = "swipe" | "dissolve" | "split";

export interface BeforeAfterReelProps {
  beforeItems: string[];
  afterItems: string[];
  transitionStyle?: BeforeAfterTransition;
  progressMs?: number;
  playing?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  onTick?: (ms: number, totalMs: number) => void;
  onComplete?: () => void;
}

export type BeforeAfterReelHandle = ReelHandle;

const BEFORE_FRAME_MS = 2400;
const TRANSITION_MS = 600;
const AFTER_FRAME_MS = 2400;
const LOGO_FRAME_MS = 2200;

const BEFORE_FONT_POOL = [
  "'Caveat', cursive",
  "'Space Grotesk', sans-serif",
  "'Syne', sans-serif",
  "'Instrument Serif', serif",
];

const CHIP_COLORS = [
  "var(--blush)",
  "var(--peach)",
  "var(--gold-light)",
  "var(--cream)",
  "var(--lavender)",
];

export const BeforeAfterReel = forwardRef<
  BeforeAfterReelHandle,
  BeforeAfterReelProps
>(function BeforeAfterReel(props, ref) {
  const {
    beforeItems,
    afterItems,
    transitionStyle = "swipe",
    progressMs,
    playing,
    loop = false,
    autoPlay = false,
    onTick,
    onComplete,
  } = props;

  const totalMs =
    BEFORE_FRAME_MS + TRANSITION_MS + AFTER_FRAME_MS + LOGO_FRAME_MS;

  const { currentMs } = useReelPlayhead(
    { totalMs, progressMs, playing, loop, autoPlay, onTick, onComplete },
    ref,
  );

  return (
    <BeforeAfterStage
      beforeItems={beforeItems}
      afterItems={afterItems}
      transitionStyle={transitionStyle}
      currentMs={currentMs}
    />
  );
});

interface StageProps {
  beforeItems: string[];
  afterItems: string[];
  transitionStyle: BeforeAfterTransition;
  currentMs: number;
}

export function BeforeAfterStage({
  beforeItems,
  afterItems,
  transitionStyle,
  currentMs,
}: StageProps) {
  const transitionStart = BEFORE_FRAME_MS;
  const afterStart = transitionStart + TRANSITION_MS;
  const logoStart = afterStart + AFTER_FRAME_MS;

  const transitionT = clamp01(
    (currentMs - transitionStart) / TRANSITION_MS,
  );
  const afterRevealT = clamp01((currentMs - afterStart) / 600);
  const logoOpacity = ramp(currentMs, logoStart, 500);

  // The "before" frame stays underneath; we layer the "after" frame on top
  // and reveal it via the transition.
  const beforeOpacity = currentMs < logoStart ? 1 : 0;
  const afterOpacity = currentMs >= afterStart && currentMs < logoStart ? 1 : 0;

  let afterClipPath: string | undefined;
  let afterTransform: string | undefined;
  if (transitionStyle === "swipe") {
    // Reveal from left → right.
    afterClipPath = `inset(0 ${(1 - transitionT) * 100}% 0 0)`;
  } else if (transitionStyle === "dissolve") {
    // Just opacity-blend.
    afterClipPath = undefined;
  } else if (transitionStyle === "split") {
    // Split from center outwards.
    const half = (1 - transitionT) * 50;
    afterClipPath = `inset(0 ${half}% 0 ${half}%)`;
  }

  const afterFrameOpacity =
    transitionStyle === "dissolve"
      ? Math.max(transitionT, afterOpacity)
      : afterOpacity || (transitionT > 0 ? 1 : 0);

  return (
    <ReelFrame background="var(--cream)">
      {/* Before frame */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: beforeOpacity,
        }}
      >
        <BeforeFrame items={beforeItems} currentMs={currentMs} />
      </div>

      {/* After frame, layered on top with the chosen transition */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: afterFrameOpacity,
          clipPath: afterClipPath,
          WebkitClipPath: afterClipPath,
          transform: afterTransform,
        }}
      >
        <AfterFrame items={afterItems} revealT={afterRevealT} />
      </div>

      {/* Logo / tagline frame */}
      {logoOpacity > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--wine)",
            opacity: logoOpacity,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--cream)",
            textAlign: "center",
            padding: "0 80px",
          }}
        >
          <div
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 140,
              lineHeight: 1,
              transform: `translateY(${(1 - logoOpacity) * 30}px)`,
            }}
          >
            The <i style={{ fontStyle: "italic" }}>Marigold</i>
          </div>
          <div
            style={{
              marginTop: 36,
              fontFamily: "'Caveat', cursive",
              fontSize: 56,
              color: "var(--gold-light)",
            }}
          >
            built for desi weddings
          </div>
          <div
            style={{
              marginTop: 24,
              fontFamily: "'Syne', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "rgba(255,248,242,0.55)",
            }}
          >
            @themarigold
          </div>
        </div>
      ) : null}
    </ReelFrame>
  );
}

function BeforeFrame({
  items,
  currentMs,
}: {
  items: string[];
  currentMs: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "var(--cream)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "'Syne', sans-serif",
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "var(--wine)",
          zIndex: 30,
        }}
      >
        <span
          style={{
            background: "var(--gold-light)",
            padding: "12px 24px",
            border: "2px dashed var(--wine)",
            transform: "rotate(-3deg)",
            display: "inline-block",
          }}
        >
          Before The Marigold
        </span>
      </div>

      {items.map((item, i) => {
        // Each chip flies in from a random direction during the first 1.6s,
        // then sits.
        const start = (i * 100) % 1200;
        const t = easeOutCubic(ramp(currentMs, start, 500));
        const angle = ((i * 137) % 30) - 15;
        const top = 280 + ((i * 92) % 1100);
        const left = 60 + ((i * 53) % 700);
        const fromX = ((i % 2 === 0 ? -1 : 1) * 600) * (1 - t);
        const fromY = (i % 3 === 0 ? -400 : 0) * (1 - t);
        const fontFamily = BEFORE_FONT_POOL[i % BEFORE_FONT_POOL.length];
        const isHandwritten = fontFamily === "'Caveat', cursive";
        const isSerif = fontFamily === "'Instrument Serif', serif";
        const fontSize = isHandwritten ? 56 : isSerif ? 44 : 32;
        const bg = CHIP_COLORS[i % CHIP_COLORS.length];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top,
              left,
              transform: `translate(${fromX}px, ${fromY}px) rotate(${angle}deg)`,
              opacity: t,
              background: bg,
              color: "var(--wine)",
              padding: isHandwritten ? "10px 20px" : "16px 24px",
              fontFamily,
              fontSize,
              fontStyle: isSerif ? "italic" : undefined,
              fontWeight: isHandwritten || isSerif ? 400 : 600,
              boxShadow: "5px 5px 0 rgba(75,21,40,0.18)",
              border: "2px solid rgba(75,21,40,0.2)",
              maxWidth: 420,
              textAlign: "center",
              zIndex: 20 - (i % 5),
            }}
          >
            {item}
          </div>
        );
      })}
    </div>
  );
}

function AfterFrame({
  items,
  revealT,
}: {
  items: string[];
  revealT: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "var(--blush)",
        padding: "200px 80px 200px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 30,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 6,
          color: "var(--deep-pink)",
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        After The Marigold
      </div>

      {items.slice(0, 6).map((item, i) => {
        const t = easeOutCubic(clamp01(revealT - i * 0.08));
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 40,
              fontWeight: 500,
              color: "var(--wine)",
              background: "white",
              padding: "20px 28px",
              borderLeft: "4px solid var(--gold)",
              boxShadow: "0 4px 16px rgba(75,21,40,0.08)",
              opacity: t,
              transform: `translateX(${(1 - t) * -40}px)`,
            }}
          >
            <svg
              width="42"
              height="42"
              viewBox="0 0 22 22"
              fill="none"
              style={{ flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="10" fill="var(--gold)" />
              <path
                d="M6.5 11.5L9.5 14.5L15.5 8"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>{item}</div>
          </div>
        );
      })}

      <CTABar variant="overlay" />
    </div>
  );
}

export interface BeforeAfterReelStaticPreviewProps
  extends Omit<
    BeforeAfterReelProps,
    "progressMs" | "playing" | "autoPlay" | "loop"
  > {
  freezeAt?: number;
}

export function BeforeAfterReelStaticPreview({
  freezeAt = 0.55,
  ...rest
}: BeforeAfterReelStaticPreviewProps) {
  const totalMs =
    BEFORE_FRAME_MS + TRANSITION_MS + AFTER_FRAME_MS + LOGO_FRAME_MS;
  return <BeforeAfterReel {...rest} progressMs={totalMs * clamp01(freezeAt)} />;
}
