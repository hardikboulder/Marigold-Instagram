import type { CSSProperties } from "react";

export type PushPinVariant = "pink" | "red" | "gold" | "blue";

interface PushPinProps {
  variant: PushPinVariant;
  size?: number;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  style?: CSSProperties;
}

const PIN_GRADIENTS: Record<PushPinVariant, string> = {
  pink: "radial-gradient(circle at 35% 35%, var(--hot-pink), var(--deep-pink))",
  red: "radial-gradient(circle at 35% 35%, #ff6b6b, #c0392b)",
  gold: "radial-gradient(circle at 35% 35%, #ffd700, var(--gold))",
  blue: "radial-gradient(circle at 35% 35%, #74b9ff, #3498db)",
};

export function PushPin({
  variant,
  size = 48,
  top,
  left,
  right,
  bottom,
  style,
}: PushPinProps) {
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: PIN_GRADIENTS[variant],
        boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
        zIndex: 10,
        top,
        left,
        right,
        bottom,
        ...style,
      }}
    />
  );
}
