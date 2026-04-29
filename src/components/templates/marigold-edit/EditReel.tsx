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

export type EditReelHandle = FactStackReelHandle;
export type EditReelProps = FactStackReelProps;
export type EditReelStaticPreviewProps = FactStackReelStaticPreviewProps;

const DEFAULT_COLORS: FactStackColor[] = [
  "blush",
  "gold-light",
  "pink",
  "lavender",
];
const DEFAULT_CTA = "Shop the edit on The Marigold.";

export const EditReel = forwardRef<EditReelHandle, EditReelProps>(
  function EditReel(
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

export function EditReelStaticPreview({
  colorSequence = DEFAULT_COLORS,
  ctaText = DEFAULT_CTA,
  freezeAt = 0.4,
  ...rest
}: EditReelStaticPreviewProps) {
  return (
    <FactStackReelStaticPreview
      colorSequence={colorSequence}
      ctaText={ctaText}
      freezeAt={freezeAt}
      {...rest}
    />
  );
}
