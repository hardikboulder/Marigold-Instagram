import type { CSSProperties } from "react";

export type SelfCareIcon =
  | "leaf"
  | "book"
  | "bath"
  | "walk"
  | "coffee"
  | "music"
  | "sleep"
  | "call"
  | "journal"
  | "yoga";

interface IconProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}

const STROKE_WIDTH = 1.6;

function svgWrap(
  children: React.ReactNode,
  { size = 48, color = "var(--mauve)", style }: IconProps,
) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", ...style }}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function SelfCareIconGlyph({
  icon,
  size,
  color,
  style,
}: { icon: SelfCareIcon } & IconProps) {
  switch (icon) {
    case "leaf":
      return svgWrap(
        <>
          <path d="M10 38 C 14 22, 28 12, 38 10 C 36 22, 28 36, 12 38 Z" />
          <path d="M12 38 L 30 20" />
        </>,
        { size, color, style },
      );
    case "book":
      return svgWrap(
        <>
          <path d="M8 12 C 14 10, 20 12, 24 14 C 28 12, 34 10, 40 12 L 40 36 C 34 34, 28 36, 24 38 C 20 36, 14 34, 8 36 Z" />
          <path d="M24 14 L 24 38" />
        </>,
        { size, color, style },
      );
    case "bath":
      return svgWrap(
        <>
          <path d="M6 26 L 42 26 L 40 36 C 40 38, 38 40, 36 40 L 12 40 C 10 40, 8 38, 8 36 Z" />
          <path d="M14 26 L 14 14 C 14 11, 16 9, 19 9 C 22 9, 24 11, 24 14" />
          <circle cx={24} cy={14} r={2.5} />
          <path d="M6 26 L 4 26" />
          <path d="M44 26 L 42 26" />
        </>,
        { size, color, style },
      );
    case "walk":
      return svgWrap(
        <>
          <circle cx={28} cy={10} r={3} />
          <path d="M22 22 L 28 18 L 32 24 L 32 32" />
          <path d="M28 18 L 22 28 L 16 32" />
          <path d="M32 32 L 36 40" />
          <path d="M22 28 L 18 38" />
        </>,
        { size, color, style },
      );
    case "coffee":
      return svgWrap(
        <>
          <path d="M10 18 L 34 18 L 32 36 C 32 38, 30 40, 28 40 L 16 40 C 14 40, 12 38, 12 36 Z" />
          <path d="M34 22 C 40 22, 40 32, 34 32" />
          <path d="M16 12 C 16 14, 18 14, 18 16" />
          <path d="M22 10 C 22 13, 24 13, 24 16" />
          <path d="M28 12 C 28 14, 30 14, 30 16" />
        </>,
        { size, color, style },
      );
    case "music":
      return svgWrap(
        <>
          <path d="M18 36 L 18 14 L 36 10 L 36 32" />
          <circle cx={14} cy={36} r={4} />
          <circle cx={32} cy={32} r={4} />
        </>,
        { size, color, style },
      );
    case "sleep":
      return svgWrap(
        <>
          <path d="M40 28 C 32 32, 22 28, 18 20 C 16 16, 16 12, 18 8 C 10 12, 6 22, 12 30 C 18 38, 32 38, 40 28 Z" />
          <path d="M28 14 L 34 14 L 28 20 L 34 20" />
        </>,
        { size, color, style },
      );
    case "call":
      return svgWrap(
        <>
          <path d="M10 12 C 10 10, 12 8, 14 8 L 18 8 L 22 14 L 18 18 C 20 24, 24 28, 30 30 L 34 26 L 40 30 L 40 34 C 40 36, 38 38, 36 38 C 22 38, 10 26, 10 12 Z" />
        </>,
        { size, color, style },
      );
    case "journal":
      return svgWrap(
        <>
          <path d="M12 8 L 36 8 L 36 40 L 14 40 C 12 40, 12 38, 12 36 Z" />
          <path d="M18 16 L 30 16" />
          <path d="M18 22 L 30 22" />
          <path d="M18 28 L 26 28" />
          <path d="M12 8 C 10 10, 10 14, 12 16" />
        </>,
        { size, color, style },
      );
    case "yoga":
      return svgWrap(
        <>
          <circle cx={24} cy={10} r={3} />
          <path d="M24 14 L 24 26" />
          <path d="M10 22 L 24 26 L 38 22" />
          <path d="M14 38 L 24 26 L 34 38" />
          <path d="M10 38 L 38 38" />
        </>,
        { size, color, style },
      );
    default:
      return null;
  }
}

export function HeartGlyph({
  size = 24,
  color = "var(--mauve)",
  style,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={{ display: "block", ...style }}
      aria-hidden
    >
      <path d="M12 21 C 4 15, 2 9, 6 6 C 9 4, 11 5, 12 8 C 13 5, 15 4, 18 6 C 22 9, 20 15, 12 21 Z" />
    </svg>
  );
}

export function CompassGlyph({
  size = 28,
  color = "var(--wine)",
  style,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", ...style }}
      aria-hidden
    >
      <circle cx={16} cy={16} r={12} />
      <path d="M20 12 L 14 14 L 12 20 L 18 18 Z" fill={color} />
    </svg>
  );
}

export function MarigoldFlowerGlyph({
  size = 56,
  color = "var(--gold)",
  style,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      style={{ display: "block", ...style }}
      aria-hidden
    >
      <g stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={32} cy={32} r={6} fill={color} fillOpacity={0.25} />
        <path d="M32 22 C 28 14, 22 12, 20 18 C 18 24, 26 26, 32 26" />
        <path d="M42 32 C 50 28, 52 22, 46 20 C 40 18, 38 26, 38 32" />
        <path d="M32 42 C 36 50, 42 52, 44 46 C 46 40, 38 38, 32 38" />
        <path d="M22 32 C 14 36, 12 42, 18 44 C 24 46, 26 38, 26 32" />
        <path d="M32 16 C 30 10, 26 8, 24 12" opacity={0.7} />
        <path d="M48 32 C 54 30, 56 26, 52 24" opacity={0.7} />
        <path d="M32 48 C 34 54, 38 56, 40 52" opacity={0.7} />
        <path d="M16 32 C 10 34, 8 38, 12 40" opacity={0.7} />
      </g>
    </svg>
  );
}
