"use client";

import { forwardRef } from "react";

import {
  ListCountdownReel,
  ListCountdownReelStaticPreview,
  type ListCountdownReelHandle,
  type ListCountdownReelProps,
  type ListCountdownReelStaticPreviewProps,
} from "@/components/templates/reels";

export type CountdownReelHandle = ListCountdownReelHandle;
export type CountdownReelProps = ListCountdownReelProps;
export type CountdownReelStaticPreviewProps =
  ListCountdownReelStaticPreviewProps;

const DEFAULTS = {
  title: "Top 5 Things to Do 6 Months Out",
  hookText: "you're behind if you haven't done #1",
  ctaText: "Track every milestone on The Marigold.",
};

export const CountdownReel = forwardRef<
  CountdownReelHandle,
  CountdownReelProps
>(function CountdownReel(
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

export function CountdownReelStaticPreview({
  title = DEFAULTS.title,
  hookText = DEFAULTS.hookText,
  ctaText = DEFAULTS.ctaText,
  freezeAt = 0.5,
  ...rest
}: CountdownReelStaticPreviewProps) {
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
