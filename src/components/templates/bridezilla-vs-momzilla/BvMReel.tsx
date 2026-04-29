"use client";

import { forwardRef } from "react";

import {
  SplitScreenTalkReel,
  SplitScreenTalkReelStaticPreview,
  type SplitScreenTalkReelHandle,
  type SplitScreenTalkReelProps,
  type SplitScreenTalkReelStaticPreviewProps,
} from "@/components/templates/reels";

export type BvMReelHandle = SplitScreenTalkReelHandle;
export type BvMReelProps = SplitScreenTalkReelProps;
export type BvMReelStaticPreviewProps = SplitScreenTalkReelStaticPreviewProps;

const DEFAULT_TOPIC = "Guest List Size";
const DEFAULT_FINAL_TAGLINE = "we have a tab for both of you";

export const BvMReel = forwardRef<BvMReelHandle, BvMReelProps>(function BvMReel(
  { topic = DEFAULT_TOPIC, finalTagline = DEFAULT_FINAL_TAGLINE, ...rest },
  ref,
) {
  return (
    <SplitScreenTalkReel
      ref={ref}
      topic={topic}
      finalTagline={finalTagline}
      {...rest}
    />
  );
});

export function BvMReelStaticPreview({
  topic = DEFAULT_TOPIC,
  finalTagline = DEFAULT_FINAL_TAGLINE,
  freezeAt = 0.55,
  ...rest
}: BvMReelStaticPreviewProps) {
  return (
    <SplitScreenTalkReelStaticPreview
      topic={topic}
      finalTagline={finalTagline}
      freezeAt={freezeAt}
      {...rest}
    />
  );
}
