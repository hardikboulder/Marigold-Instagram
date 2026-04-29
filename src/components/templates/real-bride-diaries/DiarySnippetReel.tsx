"use client";

import { forwardRef } from "react";

import {
  TextRevealReel,
  TextRevealReelStaticPreview,
  type TextRevealReelHandle,
  type TextRevealReelProps,
  type TextRevealReelStaticPreviewProps,
} from "@/components/templates/reels";

export type DiarySnippetReelHandle = TextRevealReelHandle;
export type DiarySnippetReelProps = TextRevealReelProps;
export type DiarySnippetReelStaticPreviewProps =
  TextRevealReelStaticPreviewProps;

const DEFAULTS = {
  backgroundGradient: "blush-to-cream" as const,
  font: "caveat" as const,
  holdTimeMs: 2000,
  seriesTag: "DIARY ENTRY",
};

export const DiarySnippetReel = forwardRef<
  DiarySnippetReelHandle,
  DiarySnippetReelProps
>(function DiarySnippetReel(
  {
    backgroundGradient = DEFAULTS.backgroundGradient,
    font = DEFAULTS.font,
    holdTimeMs = DEFAULTS.holdTimeMs,
    seriesTag = DEFAULTS.seriesTag,
    ...rest
  },
  ref,
) {
  return (
    <TextRevealReel
      ref={ref}
      backgroundGradient={backgroundGradient}
      font={font}
      holdTimeMs={holdTimeMs}
      seriesTag={seriesTag}
      {...rest}
    />
  );
});

export function DiarySnippetReelStaticPreview({
  backgroundGradient = DEFAULTS.backgroundGradient,
  font = DEFAULTS.font,
  holdTimeMs = DEFAULTS.holdTimeMs,
  seriesTag = DEFAULTS.seriesTag,
  freezeAt = 0.6,
  ...rest
}: DiarySnippetReelStaticPreviewProps) {
  return (
    <TextRevealReelStaticPreview
      backgroundGradient={backgroundGradient}
      font={font}
      holdTimeMs={holdTimeMs}
      seriesTag={seriesTag}
      freezeAt={freezeAt}
      {...rest}
    />
  );
}
