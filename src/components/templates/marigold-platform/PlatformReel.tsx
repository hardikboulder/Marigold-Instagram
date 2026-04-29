"use client";

import { forwardRef } from "react";

import {
  BeforeAfterReel,
  BeforeAfterReelStaticPreview,
  type BeforeAfterReelHandle,
  type BeforeAfterReelProps,
  type BeforeAfterReelStaticPreviewProps,
} from "@/components/templates/reels";

export type PlatformReelHandle = BeforeAfterReelHandle;
export type PlatformReelProps = BeforeAfterReelProps;
export type PlatformReelStaticPreviewProps = BeforeAfterReelStaticPreviewProps;

const DEFAULT_TRANSITION = "swipe" as const;

export const PlatformReel = forwardRef<PlatformReelHandle, PlatformReelProps>(
  function PlatformReel(
    { transitionStyle = DEFAULT_TRANSITION, ...rest },
    ref,
  ) {
    return (
      <BeforeAfterReel
        ref={ref}
        transitionStyle={transitionStyle}
        {...rest}
      />
    );
  },
);

export function PlatformReelStaticPreview({
  transitionStyle = DEFAULT_TRANSITION,
  freezeAt = 0.55,
  ...rest
}: PlatformReelStaticPreviewProps) {
  return (
    <BeforeAfterReelStaticPreview
      transitionStyle={transitionStyle}
      freezeAt={freezeAt}
      {...rest}
    />
  );
}
