"use client";

import { forwardRef } from "react";

import {
  TextRevealReel,
  TextRevealReelStaticPreview,
  type TextRevealReelHandle,
  type TextRevealReelProps,
  type TextRevealReelStaticPreviewProps,
} from "@/components/templates/reels";

export type BrideLifeReelHandle = TextRevealReelHandle;
export type BrideLifeReelProps = TextRevealReelProps;
export type BrideLifeReelStaticPreviewProps = TextRevealReelStaticPreviewProps;

const DEFAULTS = {
  backgroundGradient: "lavender-to-blush" as const,
  font: "caveat" as const,
  holdTimeMs: 2200,
  seriesTag: "BRIDE LIFE",
};

export const BrideLifeReel = forwardRef<
  BrideLifeReelHandle,
  BrideLifeReelProps
>(function BrideLifeReel(
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

export function BrideLifeReelStaticPreview({
  backgroundGradient = DEFAULTS.backgroundGradient,
  font = DEFAULTS.font,
  holdTimeMs = DEFAULTS.holdTimeMs,
  seriesTag = DEFAULTS.seriesTag,
  freezeAt = 0.6,
  ...rest
}: BrideLifeReelStaticPreviewProps) {
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
