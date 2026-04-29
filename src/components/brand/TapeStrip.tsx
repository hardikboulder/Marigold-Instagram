import type { CSSProperties } from "react";

interface TapeStripProps {
  rotation?: number;
  width?: number;
  height?: number;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  /**
   * Escape hatch for cases that need a compound transform — e.g. centred tape
   * needs `translateX(-50%) rotate(...)`. When provided, this overrides the
   * `rotation` prop's transform.
   */
  style?: CSSProperties;
}

export function TapeStrip({
  rotation = 0,
  width = 240,
  height = 64,
  top,
  left,
  right,
  bottom,
  style,
}: TapeStripProps) {
  return (
    <div
      style={{
        position: "absolute",
        width,
        height,
        background: "rgba(255,235,200,0.65)",
        border: "2px solid rgba(212,168,83,0.12)",
        zIndex: 10,
        top,
        left,
        right,
        bottom,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        ...style,
      }}
    />
  );
}
