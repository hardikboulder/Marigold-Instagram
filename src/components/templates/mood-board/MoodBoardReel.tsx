"use client";

import { forwardRef } from "react";

import {
  PhotoMontageReel,
  PhotoMontageReelStaticPreview,
  type PhotoMontageOverlay,
  type PhotoMontageReelHandle,
  type PhotoMontageReelProps,
  type PhotoMontageReelStaticPreviewProps,
} from "@/components/templates/reels";

export type MoodBoardReelHandle = PhotoMontageReelHandle;
export type MoodBoardReelProps = PhotoMontageReelProps;
export type MoodBoardReelStaticPreviewProps =
  PhotoMontageReelStaticPreviewProps;

const DEFAULT_OVERLAY: PhotoMontageOverlay = "full-overlay";
const DEFAULT_CTA = "Build your mood board on The Marigold.";

export const MoodBoardReel = forwardRef<
  MoodBoardReelHandle,
  MoodBoardReelProps
>(function MoodBoardReel(
  { overlayStyle = DEFAULT_OVERLAY, ctaText = DEFAULT_CTA, ...rest },
  ref,
) {
  return (
    <PhotoMontageReel
      ref={ref}
      overlayStyle={overlayStyle}
      ctaText={ctaText}
      {...rest}
    />
  );
});

export function MoodBoardReelStaticPreview({
  overlayStyle = DEFAULT_OVERLAY,
  ctaText = DEFAULT_CTA,
  freezeAt = 0.3,
  ...rest
}: MoodBoardReelStaticPreviewProps) {
  return (
    <PhotoMontageReelStaticPreview
      overlayStyle={overlayStyle}
      ctaText={ctaText}
      freezeAt={freezeAt}
      {...rest}
    />
  );
}
