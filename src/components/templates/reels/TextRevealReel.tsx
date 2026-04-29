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

export type TextRevealGradient =
  | "wine-to-blush"
  | "blush-to-cream"
  | "gold-to-cream"
  | "lavender-to-blush";

export type TextRevealFont = "instrument-serif" | "caveat";

export interface TextRevealReelProps {
  lines: string[];
  ctaText: string;
  /** Optional series tag rendered as a small uppercase label above the text. */
  seriesTag?: string;
  backgroundGradient?: TextRevealGradient;
  font?: TextRevealFont;
  /** Hold time per line, in ms. Default 1500. */
  holdTimeMs?: number;
  progressMs?: number;
  playing?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  onTick?: (ms: number, totalMs: number) => void;
  onComplete?: () => void;
}

export type TextRevealReelHandle = ReelHandle;

const FADE_IN_MS = 300;
const SILENCE_AFTER_MS = 1000;
const CTA_FADE_MS = 600;
const CTA_HOLD_MS = 1200;

/**
 * Color stops for each background gradient. We interpolate across these as
 * each line appears, getting progressively lighter (or shifting hue).
 */
const GRADIENT_PALETTES: Record<TextRevealGradient, { stops: string[]; text: string; subtext: string }> = {
  "wine-to-blush": {
    stops: ["var(--wine)", "var(--deep-pink)", "var(--pink)", "var(--blush)"],
    text: "var(--cream)",
    subtext: "rgba(255,248,242,0.55)",
  },
  "blush-to-cream": {
    stops: ["var(--blush)", "#FBE0EC", "#FCE9EE", "var(--cream)"],
    text: "var(--wine)",
    subtext: "rgba(75,21,40,0.55)",
  },
  "gold-to-cream": {
    stops: ["var(--gold)", "var(--gold-light)", "#F8EAD0", "var(--cream)"],
    text: "var(--wine)",
    subtext: "rgba(75,21,40,0.55)",
  },
  "lavender-to-blush": {
    stops: ["var(--lavender)", "#EDDFF5", "#F5DDEB", "var(--blush)"],
    text: "var(--wine)",
    subtext: "rgba(75,21,40,0.55)",
  },
};

const FONT_FAMILIES: Record<TextRevealFont, string> = {
  "instrument-serif": "'Instrument Serif', serif",
  caveat: "'Caveat', cursive",
};

export const TextRevealReel = forwardRef<
  TextRevealReelHandle,
  TextRevealReelProps
>(function TextRevealReel(props, ref) {
  const {
    lines,
    ctaText,
    seriesTag,
    backgroundGradient = "wine-to-blush",
    font = "instrument-serif",
    holdTimeMs = 1500,
    progressMs,
    playing,
    loop = false,
    autoPlay = false,
    onTick,
    onComplete,
  } = props;

  const lineDuration = FADE_IN_MS + holdTimeMs;
  const linesEnd = lines.length * lineDuration;
  const ctaStart = linesEnd + SILENCE_AFTER_MS;
  const totalMs = ctaStart + CTA_FADE_MS + CTA_HOLD_MS;

  const { currentMs } = useReelPlayhead(
    {
      totalMs,
      progressMs,
      playing,
      loop,
      autoPlay,
      onTick,
      onComplete,
    },
    ref,
  );

  return (
    <TextRevealStage
      lines={lines}
      ctaText={ctaText}
      seriesTag={seriesTag}
      gradient={backgroundGradient}
      font={font}
      holdTimeMs={holdTimeMs}
      currentMs={currentMs}
    />
  );
});

interface TextRevealStageProps {
  lines: string[];
  ctaText: string;
  seriesTag?: string;
  gradient: TextRevealGradient;
  font: TextRevealFont;
  holdTimeMs: number;
  currentMs: number;
}

export function TextRevealStage({
  lines,
  ctaText,
  seriesTag,
  gradient,
  font,
  holdTimeMs,
  currentMs,
}: TextRevealStageProps) {
  const palette = GRADIENT_PALETTES[gradient];
  const lineDuration = FADE_IN_MS + holdTimeMs;
  const linesEnd = lines.length * lineDuration;
  const ctaStart = linesEnd + SILENCE_AFTER_MS;

  // Pick the background stop based on which line we're on (during fade) or
  // which line just finished. Past the last line, hold the final stop.
  const stopIdx = Math.min(
    palette.stops.length - 1,
    Math.max(
      0,
      Math.floor(
        (currentMs / Math.max(linesEnd, 1)) * palette.stops.length,
      ),
    ),
  );
  const background = palette.stops[stopIdx];

  return (
    <ReelFrame background={background} transitionBackground>
      {seriesTag ? (
        <div
          style={{
            position: "absolute",
            top: 120,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: "'Syne', sans-serif",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: palette.subtext,
          }}
        >
          {seriesTag}
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 96px",
        }}
      >
        {lines.map((line, i) => {
          const start = i * lineDuration;
          const t = ramp(currentMs, start, FADE_IN_MS);
          const eased = easeOutCubic(t);
          // After the line is fully revealed, hold full opacity. After the
          // CTA appears, dim previous lines slightly so the CTA pops.
          const dimAfterCta = clamp01(
            (currentMs - ctaStart) / CTA_FADE_MS,
          );
          const opacity = eased * (1 - dimAfterCta * 0.6);
          const translateY = (1 - eased) * 40;
          return (
            <div
              key={i}
              style={{
                fontFamily: FONT_FAMILIES[font],
                fontStyle: font === "instrument-serif" ? "italic" : "normal",
                fontSize: font === "caveat" ? 96 : 84,
                lineHeight: 1.15,
                color: palette.text,
                textAlign: "center",
                opacity,
                transform: `translateY(${translateY}px)`,
                marginBottom: 28,
                maxWidth: 880,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>

      {/* CTA slide — fades in after the silence beat */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 220,
          textAlign: "center",
          padding: "0 96px",
          opacity: ramp(currentMs, ctaStart, CTA_FADE_MS),
          transform: `translateY(${
            (1 - ramp(currentMs, ctaStart, CTA_FADE_MS)) * 24
          }px)`,
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 64,
          color: palette.text,
        }}
      >
        {ctaText}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          opacity: ramp(currentMs, ctaStart + 200, CTA_FADE_MS),
        }}
      >
        <CTABar variant={gradient === "wine-to-blush" ? "light" : "default"} />
      </div>
    </ReelFrame>
  );
}

export interface TextRevealReelStaticPreviewProps
  extends Omit<
    TextRevealReelProps,
    "progressMs" | "playing" | "autoPlay" | "loop"
  > {
  /** Where in the timeline to freeze. 0–1, default 0.55. */
  freezeAt?: number;
}

export function TextRevealReelStaticPreview({
  freezeAt = 0.55,
  ...rest
}: TextRevealReelStaticPreviewProps) {
  const lineDuration = FADE_IN_MS + (rest.holdTimeMs ?? 1500);
  const linesEnd = rest.lines.length * lineDuration;
  const ctaStart = linesEnd + SILENCE_AFTER_MS;
  const totalMs = ctaStart + CTA_FADE_MS + CTA_HOLD_MS;
  return <TextRevealReel {...rest} progressMs={totalMs * clamp01(freezeAt)} />;
}
