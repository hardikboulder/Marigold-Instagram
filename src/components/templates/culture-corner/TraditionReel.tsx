"use client";

import { forwardRef } from "react";

import {
  TextRevealReel,
  TextRevealReelStaticPreview,
  type TextRevealReelHandle,
  type TextRevealReelProps,
  type TextRevealReelStaticPreviewProps,
} from "@/components/templates/reels";

export type TraditionReelHandle = TextRevealReelHandle;
export type TraditionReelProps = TextRevealReelProps;
export type TraditionReelStaticPreviewProps = TextRevealReelStaticPreviewProps;

const DEFAULTS = {
  backgroundGradient: "gold-to-cream" as const,
  font: "instrument-serif" as const,
  holdTimeMs: 1800,
  seriesTag: "CULTURE CORNER",
};

export const TraditionReel = forwardRef<
  TraditionReelHandle,
  TraditionReelProps
>(function TraditionReel(
  {
    backgroundGradient = DEFAULTS.backgroundGradient,
    font = DEFAULTS.font,
    holdTimeMs = DEFAULTS.holdTimeMs,
    seriesTag = DEFAULTS.seriesTag,
    ...rest
  },
  ref,
) {
  return (
    <TextRevealReel
      ref={ref}
      backgroundGradient={backgroundGradient}
      font={font}
      holdTimeMs={holdTimeMs}
      seriesTag={seriesTag}
      {...rest}
    />
  );
});

export function TraditionReelStaticPreview({
  backgroundGradient = DEFAULTS.backgroundGradient,
  font = DEFAULTS.font,
  holdTimeMs = DEFAULTS.holdTimeMs,
  seriesTag = DEFAULTS.seriesTag,
  freezeAt = 0.6,
  ...rest
}: TraditionReelStaticPreviewProps) {
  return (
    <TextRevealReelStaticPreview
      backgroundGradient={backgroundGradient}
      font={font}
      holdTimeMs={holdTimeMs}
      seriesTag={seriesTag}
      freezeAt={freezeAt}
      {...rest}
    />
  );
}
