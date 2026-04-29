import type { CSSProperties, ReactNode } from "react";
import { PushPin, type PushPinVariant } from "./PushPin";

export type StickyNoteColor = "blush" | "gold" | "lavender";

interface StickyNoteProps {
  color: StickyNoteColor;
  rotation?: number;
  pinVariant?: PushPinVariant;
  /**
   * When true, draws faint horizontal rules at 76px intervals — the lined-paper
   * effect used on the gold confessional variant.
   */
  lined?: boolean;
  width?: number;
  children: ReactNode;
  style?: CSSProperties;
}

const COLOR_BACKGROUNDS: Record<StickyNoteColor, string> = {
  blush: "var(--blush)",
  gold: "var(--gold-light)",
  lavender: "var(--lavender)",
};

// Per the HTML reference, the blush variant has a fractionally heavier shadow
// (0.10 alpha) than gold and lavender (0.08).
const COLOR_SHADOWS: Record<StickyNoteColor, string> = {
  blush: "4px 6px 16px rgba(75,21,40,0.1)",
  gold: "4px 6px 16px rgba(75,21,40,0.08)",
  lavender: "4px 6px 16px rgba(75,21,40,0.08)",
};

const LINED_BACKGROUND =
  "repeating-linear-gradient(transparent, transparent 74px, rgba(212,83,126,0.06) 74px, rgba(212,83,126,0.06) 76px)";

export function StickyNote({
  color,
  rotation = 0,
  pinVariant,
  lined = false,
  width = 780,
  children,
  style,
}: StickyNoteProps) {
  return (
    <div
      style={{
        background: COLOR_BACKGROUNDS[color],
        backgroundImage: lined ? LINED_BACKGROUND : undefined,
        width,
        padding: "80px 72px",
        position: "relative",
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        boxShadow: COLOR_SHADOWS[color],
        ...style,
      }}
    >
      {pinVariant ? (
        <PushPin
          variant={pinVariant}
          top={-24}
          left="50%"
          style={{ transform: "translateX(-50%)" }}
        />
      ) : null}
      {children}
    </div>
  );
}
