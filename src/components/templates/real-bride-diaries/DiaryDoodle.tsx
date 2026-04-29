import type { CSSProperties } from "react";

export type DiaryMarginDoodle =
  | "heart"
  | "flower"
  | "stressed"
  | "sparkle"
  | "ring";

interface DiaryDoodleProps {
  doodle: DiaryMarginDoodle;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

export function DiaryDoodle({
  doodle,
  size = 140,
  color = "var(--pink)",
  style,
}: DiaryDoodleProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden
    >
      {doodle === "heart" ? <HeartDoodle /> : null}
      {doodle === "flower" ? <FlowerDoodle /> : null}
      {doodle === "stressed" ? <StressedDoodle /> : null}
      {doodle === "sparkle" ? <SparkleDoodle /> : null}
      {doodle === "ring" ? <RingDoodle /> : null}
    </svg>
  );
}

function HeartDoodle() {
  return (
    <>
      <path d="M50 78 C 22 60, 18 38, 30 28 C 40 20, 48 28, 50 36 C 52 28, 60 20, 70 28 C 82 38, 78 60, 50 78 Z" />
      <path d="M58 42 C 60 46, 62 50, 60 54" opacity={0.6} />
    </>
  );
}

function FlowerDoodle() {
  return (
    <>
      <circle cx={50} cy={50} r={7} />
      <path d="M50 43 C 44 32, 38 30, 36 38 C 34 46, 42 48, 50 47" />
      <path d="M57 50 C 68 44, 70 38, 62 36 C 54 34, 52 42, 53 50" />
      <path d="M50 57 C 56 68, 62 70, 64 62 C 66 54, 58 52, 50 53" />
      <path d="M43 50 C 32 56, 30 62, 38 64 C 46 66, 48 58, 47 50" />
      <path d="M50 70 L 50 92" />
      <path d="M50 82 C 56 78, 62 80, 60 86" />
    </>
  );
}

function StressedDoodle() {
  return (
    <>
      <circle cx={50} cy={50} r={28} />
      <path d="M38 44 L 44 50 M 44 44 L 38 50" />
      <path d="M56 44 L 62 50 M 62 44 L 56 50" />
      <path d="M38 66 Q 50 56 62 66" />
      <path d="M30 22 Q 32 14 40 18" opacity={0.7} />
      <path d="M70 22 Q 68 14 60 18" opacity={0.7} />
      <path d="M22 40 L 14 38" opacity={0.7} />
      <path d="M78 40 L 86 38" opacity={0.7} />
      <path d="M22 56 L 14 60" opacity={0.7} />
      <path d="M78 56 L 86 60" opacity={0.7} />
    </>
  );
}

function SparkleDoodle() {
  return (
    <>
      <path d="M50 16 L 53 44 L 80 50 L 53 56 L 50 84 L 47 56 L 20 50 L 47 44 Z" />
      <path d="M22 24 L 24 30 L 30 32 L 24 34 L 22 40 L 20 34 L 14 32 L 20 30 Z" opacity={0.7} />
      <path d="M76 70 L 78 76 L 84 78 L 78 80 L 76 86 L 74 80 L 68 78 L 74 76 Z" opacity={0.7} />
    </>
  );
}

function RingDoodle() {
  return (
    <>
      <circle cx={50} cy={62} r={20} />
      <path d="M40 44 L 50 24 L 60 44 Z" />
      <path d="M44 44 L 50 36 L 56 44" opacity={0.6} />
    </>
  );
}
