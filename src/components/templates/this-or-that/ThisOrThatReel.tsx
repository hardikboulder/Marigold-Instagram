"use client";

import { forwardRef } from "react";

import {
  SplitScreenTalkReel,
  SplitScreenTalkReelStaticPreview,
  type SplitScreenTalkReelHandle,
  type SplitScreenTalkReelProps,
  type SplitScreenTalkReelStaticPreviewProps,
} from "@/components/templates/reels";

export type ThisOrThatReelHandle = SplitScreenTalkReelHandle;
export type ThisOrThatReelProps = SplitScreenTalkReelProps;
export type ThisOrThatReelStaticPreviewProps =
  SplitScreenTalkReelStaticPreviewProps;

const DEFAULTS = {
  topic: "Wedding Vibes",
  finalTagline: "pick your team — both live on The Marigold",
};

export const ThisOrThatReel = forwardRef<
  ThisOrThatReelHandle,
  ThisOrThatReelProps
>(function ThisOrThatReel(
  { topic = DEFAULTS.topic, finalTagline = DEFAULTS.finalTagline, ...rest },
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

export function ThisOrThatReelStaticPreview({
  topic = DEFAULTS.topic,
  finalTagline = DEFAULTS.finalTagline,
  freezeAt = 0.55,
  ...rest
}: ThisOrThatReelStaticPreviewProps) {
  return (
    <SplitScreenTalkReelStaticPreview
      topic={topic}
      finalTagline={finalTagline}
      freezeAt={freezeAt}
      {...rest}
    />
  );
}
