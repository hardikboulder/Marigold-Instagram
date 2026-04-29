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

export type VendorPortfolioReelHandle = PhotoMontageReelHandle;
export type VendorPortfolioReelProps = PhotoMontageReelProps;
export type VendorPortfolioReelStaticPreviewProps =
  PhotoMontageReelStaticPreviewProps;

const DEFAULT_OVERLAY: PhotoMontageOverlay = "center-card";
const DEFAULT_CTA = "Book vendors who deliver — on The Marigold.";

export const VendorPortfolioReel = forwardRef<
  VendorPortfolioReelHandle,
  VendorPortfolioReelProps
>(function VendorPortfolioReel(
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

export function VendorPortfolioReelStaticPreview({
  overlayStyle = DEFAULT_OVERLAY,
  ctaText = DEFAULT_CTA,
  freezeAt = 0.3,
  ...rest
}: VendorPortfolioReelStaticPreviewProps) {
  return (
    <PhotoMontageReelStaticPreview
      overlayStyle={overlayStyle}
      ctaText={ctaText}
      freezeAt={freezeAt}
      {...rest}
    />
  );
}
