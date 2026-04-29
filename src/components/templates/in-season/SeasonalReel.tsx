"use client";

import { forwardRef } from "react";

import {
  FactStackReel,
  FactStackReelStaticPreview,
  type FactStackColor,
  type FactStackReelHandle,
  type FactStackReelProps,
  type FactStackReelStaticPreviewProps,
} from "@/components/templates/reels";

export type SeasonalReelHandle = FactStackReelHandle;
export type SeasonalReelProps = FactStackReelProps;
export type SeasonalReelStaticPreviewProps = FactStackReelStaticPreviewProps;

const DEFAULT_COLORS: FactStackColor[] = [
  "gold",
  "blush",
  "deep-pink",
  "lavender",
];
const DEFAULT_CTA = "What's trending this season — on The Marigold.";

export const SeasonalReel = forwardRef<SeasonalReelHandle, SeasonalReelProps>(
  function SeasonalReel(
    { colorSequence = DEFAULT_COLORS, ctaText = DEFAULT_CTA, ...rest },
    ref,
  ) {
    return (
      <FactStackReel
        ref={ref}
        colorSequence={colorSequence}
        ctaText={ctaText}
        {...rest}
      />
    );
  },
);

export function SeasonalReelStaticPreview({
  colorSequence = DEFAULT_COLORS,
  ctaText = DEFAULT_CTA,
  freezeAt = 0.4,
  ...rest
}: SeasonalReelStaticPreviewProps) {
  return (
    <FactStackReelStaticPreview
      colorSequence={colorSequence}
      ctaText={ctaText}
      freezeAt={freezeAt}
      {...rest}
    />
  );
}
