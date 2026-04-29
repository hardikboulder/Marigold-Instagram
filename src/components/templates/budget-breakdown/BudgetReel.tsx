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

export type BudgetReelHandle = FactStackReelHandle;
export type BudgetReelProps = FactStackReelProps;
export type BudgetReelStaticPreviewProps = FactStackReelStaticPreviewProps;

const DEFAULT_COLORS: FactStackColor[] = ["wine", "deep-pink", "gold", "blush"];
const DEFAULT_CTA = "Track every rupee on The Marigold.";

export const BudgetReel = forwardRef<BudgetReelHandle, BudgetReelProps>(
  function BudgetReel(
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

export function BudgetReelStaticPreview({
  colorSequence = DEFAULT_COLORS,
  ctaText = DEFAULT_CTA,
  freezeAt = 0.4,
  ...rest
}: BudgetReelStaticPreviewProps) {
  return (
    <FactStackReelStaticPreview
      colorSequence={colorSequence}
      ctaText={ctaText}
      freezeAt={freezeAt}
      {...rest}
    />
  );
}
