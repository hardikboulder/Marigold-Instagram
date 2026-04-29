"use client";

import { forwardRef } from "react";

import {
  QuoteScrollReel,
  QuoteScrollReelStaticPreview,
  type QuoteScrollReelHandle,
  type QuoteScrollReelProps,
  type QuoteScrollReelStaticPreviewProps,
} from "@/components/templates/reels";

export type CommunityReelHandle = QuoteScrollReelHandle;
export type CommunityReelProps = QuoteScrollReelProps;
export type CommunityReelStaticPreviewProps =
  QuoteScrollReelStaticPreviewProps;

const DEFAULTS = {
  headerLabel: "COMMUNITY VOICES",
  ctaText: "Share your story on The Marigold.",
};

export const CommunityReel = forwardRef<
  CommunityReelHandle,
  CommunityReelProps
>(function CommunityReel(
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

export function CommunityReelStaticPreview({
  headerLabel = DEFAULTS.headerLabel,
  ctaText = DEFAULTS.ctaText,
  freezeAt = 0.45,
  ...rest
}: CommunityReelStaticPreviewProps) {
  return (
    <QuoteScrollReelStaticPreview
      headerLabel={headerLabel}
      ctaText={ctaText}
      freezeAt={freezeAt}
      {...rest}
    />
  );
}
