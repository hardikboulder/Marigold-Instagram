import type { CSSProperties } from "react";

export type TrendDirection = "up" | "steady" | "emerging";

export type RoundupIconType =
  | "trending"
  | "viral"
  | "marigold"
  | "alert"
  | "calendar"
  | "sparkle";

interface IconProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}

function svgWrap(
  children: React.ReactNode,
  { size = 48, color = "var(--cream)", style }: IconProps,
  viewBox = "0 0 48 48",
) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", ...style }}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function TrendArrow({
  direction,
  size = 28,
  color = "var(--cream)",
  style,
}: { direction: TrendDirection } & IconProps) {
  const symbol = direction === "up" ? "↑" : direction === "steady" ? "→" : "↗";
  return (
    <span
      style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: size,
        color,
        lineHeight: 1,
        display: "inline-block",
        ...style,
      }}
      aria-hidden
    >
      {symbol}
    </span>
  );
}

export function ConnectionArrow({
  size = 56,
  color = "var(--cream)",
  style,
}: IconProps) {
  return svgWrap(
    <>
      <path d="M8 24 L 40 24" />
      <path d="M30 14 L 40 24 L 30 34" />
    </>,
    { size, color, style },
  );
}

export function RoundupIcon({
  icon,
  size = 56,
  color = "var(--gold)",
  style,
}: { icon: RoundupIconType } & IconProps) {
  switch (icon) {
    case "trending":
      return svgWrap(
        <>
          <path d="M6 36 L 18 24 L 26 30 L 42 12" />
          <path d="M30 12 L 42 12 L 42 24" />
        </>,
        { size, color, style },
      );
    case "viral":
      return svgWrap(
        <>
          <circle cx={24} cy={24} r={6} />
          <path d="M24 8 L 24 14" />
          <path d="M24 34 L 24 40" />
          <path d="M8 24 L 14 24" />
          <path d="M34 24 L 40 24" />
          <path d="M12 12 L 17 17" />
          <path d="M31 31 L 36 36" />
          <path d="M36 12 L 31 17" />
          <path d="M17 31 L 12 36" />
        </>,
        { size, color, style },
      );
    case "marigold":
      return svgWrap(
        <>
          <circle cx={24} cy={24} r={5} fill={color} fillOpacity={0.25} />
          <path d="M24 18 C 20 12, 14 12, 14 18 C 14 22, 20 22, 24 22" />
          <path d="M30 24 C 36 24, 36 18, 30 18 C 26 18, 26 24, 26 24" />
          <path d="M24 30 C 28 36, 34 36, 34 30 C 34 26, 28 26, 24 26" />
          <path d="M18 24 C 12 24, 12 30, 18 30 C 22 30, 22 24, 22 24" />
        </>,
        { size, color, style },
      );
    case "alert":
      return svgWrap(
        <>
          <path d="M24 8 L 42 38 L 6 38 Z" />
          <path d="M24 20 L 24 28" />
          <circle cx={24} cy={33} r={1.5} fill={color} />
        </>,
        { size, color, style },
      );
    case "calendar":
      return svgWrap(
        <>
          <rect x={8} y={12} width={32} height={28} rx={2} />
          <path d="M8 20 L 40 20" />
          <path d="M16 8 L 16 16" />
          <path d="M32 8 L 32 16" />
          <circle cx={16} cy={28} r={1.5} fill={color} />
          <circle cx={24} cy={28} r={1.5} fill={color} />
          <circle cx={32} cy={28} r={1.5} fill={color} />
        </>,
        { size, color, style },
      );
    case "sparkle":
      return svgWrap(
        <>
          <path d="M24 6 L 27 21 L 42 24 L 27 27 L 24 42 L 21 27 L 6 24 L 21 21 Z" fill={color} fillOpacity={0.2} />
          <path d="M24 6 L 27 21 L 42 24 L 27 27 L 24 42 L 21 27 L 6 24 L 21 21 Z" />
        </>,
        { size, color, style },
      );
    default:
      return null;
  }
}
