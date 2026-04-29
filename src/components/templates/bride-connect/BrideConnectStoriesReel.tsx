"use client";

import { forwardRef } from "react";

import {
  QuoteScrollReel,
  QuoteScrollReelStaticPreview,
  type QuoteScrollReelHandle,
  type QuoteScrollReelProps,
  type QuoteScrollReelStaticPreviewProps,
} from "@/components/templates/reels";

export type BrideConnectStoriesReelHandle = QuoteScrollReelHandle;
export type BrideConnectStoriesReelProps = QuoteScrollReelProps;
export type BrideConnectStoriesReelStaticPreviewProps =
  QuoteScrollReelStaticPreviewProps;

const DEFAULTS = {
  headerLabel: "MATCHED ON BRIDE CONNECT",
  ctaText: "Find your planning bestie on The Marigold.",
};

export const BrideConnectStoriesReel = forwardRef<
  BrideConnectStoriesReelHandle,
  BrideConnectStoriesReelProps
>(function BrideConnectStoriesReel(
  {
    headerLabel = DEFAULTS.headerLabel,
    ctaText = DEFAULTS.ctaText,
    ...rest
  },
  ref,
) {
  return (
    <QuoteScrollReel
      ref={ref}
      headerLabel={headerLabel}
      ctaText={ctaText}
      {...rest}
    />
  );
});

export function BrideConnectStoriesReelStaticPreview({
  headerLabel = DEFAULTS.headerLabel,
  ctaText = DEFAULTS.ctaText,
  freezeAt = 0.45,
  ...rest
}: BrideConnectStoriesReelStaticPreviewProps) {
  return (
    <QuoteScrollReelStaticPreview
      headerLabel={headerLabel}
      ctaText={ctaText}
      freezeAt={freezeAt}
      {...rest}
    />
  );
}
