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
} from "./_shared";

export interface FactStackFact {
  statValue: string;
  statContext: string;
}

export type FactStackColor =
  | "wine"
  | "deep-pink"
  | "pink"
  | "blush"
  | "gold"
  | "gold-light"
  | "lavender";

export interface FactStackReelProps {
  facts: FactStackFact[];
  ctaText: string;
  /** Background color per fact, looped if shorter than `facts`. */
  colorSequence?: FactStackColor[];
  progressMs?: number;
  playing?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  onTick?: (ms: number, totalMs: number) => void;
  onComplete?: () => void;
}

export type FactStackReelHandle = ReelHandle;

const FACT_MS = 2500;
const CTA_MS = 2400;

const COLOR_PALETTES: Record<
  FactStackColor,
  { bg: string; stat: string; context: string }
> = {
  wine: { bg: "var(--wine)", stat: "var(--gold-light)", context: "var(--cream)" },
  "deep-pink": { bg: "var(--deep-pink)", stat: "var(--gold-light)", context: "var(--cream)" },
  pink: { bg: "var(--pink)", stat: "var(--cream)", context: "var(--wine)" },
  blush: { bg: "var(--blush)", stat: "var(--wine)", context: "var(--deep-pink)" },
  gold: { bg: "var(--gold)", stat: "var(--wine)", context: "var(--cream)" },
  "gold-light": { bg: "var(--gold-light)", stat: "var(--wine)", context: "var(--deep-pink)" },
  lavender: { bg: "var(--lavender)", stat: "var(--wine)", context: "var(--deep-pink)" },
};

const DEFAULT_COLORS: FactStackColor[] = [
  "wine",
  "pink",
  "gold-light",
  "blush",
];

export const FactStackReel = forwardRef<
  FactStackReelHandle,
  FactStackReelProps
>(function FactStackReel(props, ref) {
  const {
    facts,
    ctaText,
    colorSequence = DEFAULT_COLORS,
    progressMs,
    playing,
    loop = false,
    autoPlay = false,
    onTick,
    onComplete,
  } = props;

  const totalMs = facts.length * FACT_MS + CTA_MS;

  const { currentMs } = useReelPlayhead(
    { totalMs, progressMs, playing, loop, autoPlay, onTick, onComplete },
    ref,
  );

  return (
    <FactStackStage
      facts={facts}
      ctaText={ctaText}
      colorSequence={colorSequence}
      currentMs={currentMs}
    />
  );
});

interface StageProps {
  facts: FactStackFact[];
  ctaText: string;
  colorSequence: FactStackColor[];
  currentMs: number;
}

export function FactStackStage({
  facts,
  ctaText,
  colorSequence,
  currentMs,
}: StageProps) {
  const ctaStart = facts.length * FACT_MS;

  if (currentMs >= ctaStart) {
    return <CtaFrame ctaText={ctaText} progressMs={currentMs - ctaStart} />;
  }

  const idx = Math.min(facts.length - 1, Math.floor(currentMs / FACT_MS));
  const fact = facts[idx];
  const local = currentMs - idx * FACT_MS;
  const colorKey = colorSequence[idx % colorSequence.length] ?? "wine";
  const palette = COLOR_PALETTES[colorKey];

  // Stat scales 150% → 100% over 400ms with ease-out-back overshoot.
  const statT = ramp(local, 0, 500);
  const statScale = 1.5 - 0.5 * easeOutBack(statT);
  const statOpacity = ramp(local, 0, 200);

  // Context slides up 80px over 500ms, starting after 300ms.
  const contextT = ramp(local, 300, 500);
  const contextEased = easeOutCubic(contextT);

  return (
    <ReelFrame background={palette.bg} transitionBackground>
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
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 360,
            lineHeight: 1,
            color: palette.stat,
            opacity: statOpacity,
            transform: `scale(${statScale})`,
            transformOrigin: "center",
          }}
        >
          {fact.statValue}
        </div>

        <div
          style={{
            marginTop: 48,
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 500,
            fontSize: 44,
            lineHeight: 1.25,
            color: palette.context,
            opacity: contextEased,
            transform: `translateY(${(1 - contextEased) * 60}px)`,
            maxWidth: 880,
          }}
        >
          {fact.statContext}
        </div>
      </div>

      {/* Fact counter pill */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: palette.context,
          opacity: 0.6,
        }}
      >
        {String(idx + 1).padStart(2, "0")} / {String(facts.length).padStart(2, "0")}
      </div>

      <CTABar
        variant={palette.bg.includes("wine") || palette.bg.includes("deep") ? "light" : "default"}
      />
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
          The Marigold knows every number
        </div>
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
          {ctaText}
        </div>
      </div>
      <CTABar variant="light" />
    </ReelFrame>
  );
}

export interface FactStackReelStaticPreviewProps
  extends Omit<
    FactStackReelProps,
    "progressMs" | "playing" | "autoPlay" | "loop"
  > {
  freezeAt?: number;
}

export function FactStackReelStaticPreview({
  freezeAt = 0.4,
  ...rest
}: FactStackReelStaticPreviewProps) {
  const totalMs = rest.facts.length * FACT_MS + CTA_MS;
  return <FactStackReel {...rest} progressMs={totalMs * clamp01(freezeAt)} />;
}
