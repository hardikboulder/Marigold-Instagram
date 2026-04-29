"use client";

import { forwardRef } from "react";

import { CTABar } from "@/components/brand/CTABar";
import {
  ReelFrame,
  clamp01,
  easeOutBack,
  easeOutCubic,
  ramp,
  useReelPlayhead,
  type ReelHandle,
} from "@/components/templates/reels/_shared";

export interface WeddingMathEquation {
  number: string;
  text: string;
}

export interface WeddingMathReelProps {
  equations: WeddingMathEquation[];
  punchline: string;
  ctaText: string;
  holdTimeMs?: number;
  progressMs?: number;
  playing?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  onTick?: (ms: number, totalMs: number) => void;
  onComplete?: () => void;
}

export type WeddingMathReelHandle = ReelHandle;

const PUNCHLINE_MS = 1800;
const CTA_MS = 2400;

export const WeddingMathReel = forwardRef<
  WeddingMathReelHandle,
  WeddingMathReelProps
>(function WeddingMathReel(props, ref) {
  const {
    equations,
    punchline,
    ctaText,
    holdTimeMs = 1400,
    progressMs,
    playing,
    loop = false,
    autoPlay = false,
    onTick,
    onComplete,
  } = props;

  const validEquations = equations.filter(
    (eq) => (eq.number || "").trim() || (eq.text || "").trim(),
  );
  const equationMs = Math.max(800, holdTimeMs);
  const totalMs = validEquations.length * equationMs + PUNCHLINE_MS + CTA_MS;

  const { currentMs } = useReelPlayhead(
    { totalMs, progressMs, playing, loop, autoPlay, onTick, onComplete },
    ref,
  );

  return (
    <WeddingMathStage
      equations={validEquations}
      punchline={punchline}
      ctaText={ctaText}
      equationMs={equationMs}
      currentMs={currentMs}
    />
  );
});

interface StageProps {
  equations: WeddingMathEquation[];
  punchline: string;
  ctaText: string;
  equationMs: number;
  currentMs: number;
}

export function WeddingMathStage({
  equations,
  punchline,
  ctaText,
  equationMs,
  currentMs,
}: StageProps) {
  const equationsTotal = equations.length * equationMs;
  const punchlineStart = equationsTotal;
  const ctaStart = punchlineStart + PUNCHLINE_MS;

  if (currentMs >= ctaStart) {
    return <CtaFrame ctaText={ctaText} progressMs={currentMs - ctaStart} />;
  }

  if (currentMs >= punchlineStart) {
    return (
      <PunchlineFrame
        punchline={punchline}
        progressMs={currentMs - punchlineStart}
      />
    );
  }

  const idx = Math.min(
    equations.length - 1,
    Math.floor(currentMs / equationMs),
  );
  const equation = equations[idx];
  const local = currentMs - idx * equationMs;

  const numberT = ramp(local, 0, 420);
  const numberScale = 1.4 - 0.4 * easeOutBack(numberT);
  const numberOpacity = ramp(local, 0, 200);

  const textT = ramp(local, 280, 420);
  const textEased = easeOutCubic(textT);

  const accent = idx % 2 === 0 ? "var(--gold-light)" : "var(--hot-pink)";

  return (
    <ReelFrame background="var(--wine)" transitionBackground>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 14%, rgba(212,168,83,0.16), transparent 55%), radial-gradient(circle at 82% 86%, rgba(237,147,177,0.14), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 110,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: 10,
          textTransform: "uppercase",
          color: "var(--gold)",
          opacity: 0.7,
        }}
      >
        Wedding Math · {String(idx + 1).padStart(2, "0")} /{" "}
        {String(equations.length).padStart(2, "0")}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          textAlign: "center",
          gap: 36,
        }}
      >
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 110,
            lineHeight: 1.05,
            letterSpacing: 1,
            color: accent,
            opacity: numberOpacity,
            transform: `scale(${numberScale})`,
            transformOrigin: "center",
            fontVariantNumeric: "tabular-nums",
            maxWidth: 940,
          }}
        >
          {equation.number}
        </div>

        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 44,
            lineHeight: 1.25,
            color: "var(--cream)",
            opacity: textEased,
            transform: `translateY(${(1 - textEased) * 36}px)`,
            maxWidth: 820,
          }}
        >
          {equation.text}
        </div>
      </div>

      <CTABar variant="light" />
    </ReelFrame>
  );
}

function PunchlineFrame({
  punchline,
  progressMs,
}: {
  punchline: string;
  progressMs: number;
}) {
  const opacity = ramp(progressMs, 0, 500);
  const eased = easeOutCubic(opacity);
  return (
    <ReelFrame background="var(--deep-pink)">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 90px",
          textAlign: "center",
          color: "var(--cream)",
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 84,
            lineHeight: 1.15,
            opacity: eased,
            transform: `translateY(${(1 - eased) * 24}px)`,
            maxWidth: 880,
          }}
        >
          {punchline}
        </div>
      </div>
      <CTABar variant="light" />
    </ReelFrame>
  );
}

function CtaFrame({
  ctaText,
  progressMs,
}: {
  ctaText: string;
  progressMs: number;
}) {
  const opacity = ramp(progressMs, 0, 500);
  const eased = easeOutCubic(opacity);
  return (
    <ReelFrame background="var(--wine)">
      <div
        style={{
          position: "absolute",
          inset: 0,
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
            fontFamily: "'Caveat', cursive",
            fontSize: 56,
            color: "var(--gold-light)",
            marginBottom: 24,
            opacity: eased,
            transform: `rotate(-2deg) translateY(${(1 - eased) * 16}px)`,
          }}
        >
          run the math, not your luck
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 76,
            lineHeight: 1.15,
            opacity: eased,
            transform: `translateY(${(1 - eased) * 24}px)`,
            maxWidth: 880,
          }}
        >
          {ctaText}
        </div>
      </div>
      <CTABar variant="light" />
    </ReelFrame>
  );
}

export interface WeddingMathReelStaticPreviewProps
  extends Omit<
    WeddingMathReelProps,
    "progressMs" | "playing" | "autoPlay" | "loop"
  > {
  freezeAt?: number;
}

export function WeddingMathReelStaticPreview({
  freezeAt = 0.35,
  ...rest
}: WeddingMathReelStaticPreviewProps) {
  const validEquations = rest.equations.filter(
    (eq) => (eq.number || "").trim() || (eq.text || "").trim(),
  );
  const equationMs = Math.max(800, rest.holdTimeMs ?? 1400);
  const totalMs = validEquations.length * equationMs + PUNCHLINE_MS + CTA_MS;
  return (
    <WeddingMathReel {...rest} progressMs={totalMs * clamp01(freezeAt)} />
  );
}
