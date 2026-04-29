"use client";

import { forwardRef } from "react";

import {
  TextRevealReel,
  TextRevealReelStaticPreview,
  type TextRevealReelHandle,
  type TextRevealReelProps,
  type TextRevealReelStaticPreviewProps,
} from "@/components/templates/reels";

export type HotTakeReelHandle = TextRevealReelHandle;
export type HotTakeReelProps = TextRevealReelProps;
export type HotTakeReelStaticPreviewProps = TextRevealReelStaticPreviewProps;

const DEFAULTS = {
  backgroundGradient: "wine-to-blush" as const,
  font: "instrument-serif" as const,
  holdTimeMs: 2000,
  seriesTag: "HOT TAKE",
};

export const HotTakeReel = forwardRef<HotTakeReelHandle, HotTakeReelProps>(
  function HotTakeReel(
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
  },
);

export function HotTakeReelStaticPreview({
  backgroundGradient = DEFAULTS.backgroundGradient,
  font = DEFAULTS.font,
  holdTimeMs = DEFAULTS.holdTimeMs,
  seriesTag = DEFAULTS.seriesTag,
  freezeAt = 0.7,
  ...rest
}: HotTakeReelStaticPreviewProps) {
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
