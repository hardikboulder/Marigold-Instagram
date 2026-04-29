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

export type VenueReelHandle = PhotoMontageReelHandle;
export type VenueReelProps = PhotoMontageReelProps;
export type VenueReelStaticPreviewProps = PhotoMontageReelStaticPreviewProps;

const DEFAULT_OVERLAY: PhotoMontageOverlay = "bottom-strip";
const DEFAULT_CTA = "Tour every venue on The Marigold.";

export const VenueReel = forwardRef<VenueReelHandle, VenueReelProps>(
  function VenueReel(
    {
      overlayStyle = DEFAULT_OVERLAY,
      ctaText = DEFAULT_CTA,
      ...rest
    },
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
  },
);

export function VenueReelStaticPreview({
  overlayStyle = DEFAULT_OVERLAY,
  ctaText = DEFAULT_CTA,
  freezeAt = 0.3,
  ...rest
}: VenueReelStaticPreviewProps) {
  return (
    <PhotoMontageReelStaticPreview
      overlayStyle={overlayStyle}
      ctaText={ctaText}
      freezeAt={freezeAt}
      {...rest}
    />
  );
}
