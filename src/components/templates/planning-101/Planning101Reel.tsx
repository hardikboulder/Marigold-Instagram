"use client";

import { forwardRef } from "react";

import {
  ListCountdownReel,
  ListCountdownReelStaticPreview,
  type ListCountdownReelHandle,
  type ListCountdownReelProps,
  type ListCountdownReelStaticPreviewProps,
} from "@/components/templates/reels";

export type Planning101ReelHandle = ListCountdownReelHandle;
export type Planning101ReelProps = ListCountdownReelProps;
export type Planning101ReelStaticPreviewProps =
  ListCountdownReelStaticPreviewProps;

const DEFAULTS = {
  title: "5 Red Flags in a Venue Contract",
  hookText: "#1 is the one that bites",
  ctaText: "Vet every contract on The Marigold.",
};

export const Planning101Reel = forwardRef<
  Planning101ReelHandle,
  Planning101ReelProps
>(function Planning101Reel(
  {
    title = DEFAULTS.title,
    hookText = DEFAULTS.hookText,
    ctaText = DEFAULTS.ctaText,
    ...rest
  },
  ref,
) {
  return (
    <ListCountdownReel
      ref={ref}
      title={title}
      hookText={hookText}
      ctaText={ctaText}
      {...rest}
    />
  );
});

export function Planning101ReelStaticPreview({
  title = DEFAULTS.title,
  hookText = DEFAULTS.hookText,
  ctaText = DEFAULTS.ctaText,
  freezeAt = 0.5,
  ...rest
}: Planning101ReelStaticPreviewProps) {
  return (
    <ListCountdownReelStaticPreview
      title={title}
      hookText={hookText}
      ctaText={ctaText}
      freezeAt={freezeAt}
      {...rest}
    />
  );
}
