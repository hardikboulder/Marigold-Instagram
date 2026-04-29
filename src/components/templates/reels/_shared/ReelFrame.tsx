"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Outer container for every reel — fills the 1080×1920 frame and clips so
 * absolutely-positioned children can't escape. Background is supplied by
 * the caller because every reel format owns its own palette.
 */
interface ReelFrameProps {
  background: string;
  /** Optional CSS transition on `background` for reels whose bg shifts. */
  transitionBackground?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}

export function ReelFrame({
  background,
  transitionBackground = false,
  children,
  style,
}: ReelFrameProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background,
        transition: transitionBackground
          ? "background 600ms ease-in-out"
          : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
