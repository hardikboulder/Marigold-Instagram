import type { CSSProperties } from "react";

export type CultureIconType =
  | "diya"
  | "marigold-flower"
  | "paisley"
  | "lotus"
  | "kalash"
  | "rangoli"
  | "henna-hand"
  | "om";

interface IconProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}

function frame(size: number, style?: CSSProperties) {
  return {
    width: size,
    height: size,
    display: "block",
    ...style,
  } as CSSProperties;
}

function Diya({ size = 96, color = "var(--gold)", style }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      style={frame(size, style)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 64 Q50 80 84 64 Q70 78 50 80 Q30 78 16 64 Z"
        fill={color}
      />
      <path
        d="M48 28 Q44 44 50 56 Q56 44 52 28 Q50 22 50 22 Q50 22 48 28 Z"
        fill={color}
        opacity={0.85}
      />
      <ellipse cx={50} cy={66} rx={28} ry={4} fill={color} opacity={0.55} />
    </svg>
  );
}

function MarigoldFlower({
  size = 96,
  color = "var(--gold)",
  style,
}: IconProps) {
  const petals = Array.from({ length: 12 });
  return (
    <svg
      viewBox="0 0 100 100"
      style={frame(size, style)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(50 50)">
        {petals.map((_, i) => {
          const angle = (i * 360) / petals.length;
          return (
            <ellipse
              key={i}
              cx={0}
              cy={-30}
              rx={9}
              ry={16}
              fill={color}
              opacity={0.85}
              transform={`rotate(${angle})`}
            />
          );
        })}
        <circle r={14} fill={color} />
        <circle r={6} fill={color} opacity={0.55} />
      </g>
    </svg>
  );
}

function Paisley({ size = 96, color = "var(--gold)", style }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      style={frame(size, style)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M30 86 C12 70 14 36 38 22 C58 12 80 22 78 44 C76 60 64 64 56 60 C48 56 50 44 60 44"
        stroke={color}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={62} cy={42} r={4} fill={color} />
    </svg>
  );
}

function Lotus({ size = 96, color = "var(--gold)", style }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      style={frame(size, style)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(50 60)">
        <path
          d="M-32 10 Q-20 -28 0 -32 Q20 -28 32 10 Z"
          fill={color}
          opacity={0.85}
        />
        <path
          d="M-40 12 Q-28 -10 -8 -12 Q-4 4 -16 18 Z"
          fill={color}
          opacity={0.6}
        />
        <path
          d="M40 12 Q28 -10 8 -12 Q4 4 16 18 Z"
          fill={color}
          opacity={0.6}
        />
        <path
          d="M-46 14 Q-32 4 -22 16 Q-22 22 -36 22 Z"
          fill={color}
          opacity={0.45}
        />
        <path
          d="M46 14 Q32 4 22 16 Q22 22 36 22 Z"
          fill={color}
          opacity={0.45}
        />
      </g>
    </svg>
  );
}

function Kalash({ size = 96, color = "var(--gold)", style }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      style={frame(size, style)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M28 50 Q22 70 38 84 L62 84 Q78 70 72 50 Z"
        fill={color}
        opacity={0.9}
      />
      <rect x={32} y={42} width={36} height={10} rx={2} fill={color} />
      <path
        d="M40 40 Q50 28 60 40"
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M44 30 Q50 10 56 30 Q50 22 44 30 Z"
        fill={color}
        opacity={0.85}
      />
      <circle cx={50} cy={20} r={4} fill={color} />
    </svg>
  );
}

function Rangoli({ size = 96, color = "var(--gold)", style }: IconProps) {
  const petals = Array.from({ length: 8 });
  return (
    <svg
      viewBox="0 0 100 100"
      style={frame(size, style)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(50 50)">
        {petals.map((_, i) => {
          const angle = (i * 360) / petals.length;
          return (
            <path
              key={i}
              d="M0 -36 Q8 -22 0 -10 Q-8 -22 0 -36 Z"
              fill={color}
              opacity={0.8}
              transform={`rotate(${angle})`}
            />
          );
        })}
        <circle r={8} fill={color} />
        {petals.map((_, i) => {
          const angle = (i * 360) / petals.length + 22.5;
          return (
            <circle
              key={`dot-${i}`}
              cx={0}
              cy={-24}
              r={2.5}
              fill={color}
              opacity={0.6}
              transform={`rotate(${angle})`}
            />
          );
        })}
      </g>
    </svg>
  );
}

function HennaHand({ size = 96, color = "var(--gold)", style }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      style={frame(size, style)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M30 86 L30 56 Q30 50 36 50 L36 30 Q36 24 42 24 L42 50 L46 50 L46 22 Q46 16 52 16 L52 50 L56 50 L56 24 Q56 18 62 18 L62 50 L66 50 L66 32 Q66 26 72 26 L72 56 Q72 78 60 86 Z"
        fill={color}
        opacity={0.92}
      />
      <circle cx={50} cy={66} r={5} fill="var(--wine)" opacity={0.45} />
      <circle cx={42} cy={74} r={2.5} fill="var(--wine)" opacity={0.4} />
      <circle cx={58} cy={74} r={2.5} fill="var(--wine)" opacity={0.4} />
      <circle cx={50} cy={78} r={2} fill="var(--wine)" opacity={0.4} />
    </svg>
  );
}

function Om({ size = 96, color = "var(--gold)", style }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      style={frame(size, style)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M60 30 Q72 30 72 42 Q72 56 56 56 Q40 56 40 44 Q40 30 56 30 M40 60 Q26 60 26 72 Q26 84 42 84 Q60 84 60 70"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M64 24 Q70 18 78 22"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={78} cy={18} r={4} fill={color} />
    </svg>
  );
}

export function CultureIcon({
  type,
  size,
  color,
  style,
}: { type: CultureIconType } & IconProps) {
  switch (type) {
    case "diya":
      return <Diya size={size} color={color} style={style} />;
    case "marigold-flower":
      return <MarigoldFlower size={size} color={color} style={style} />;
    case "paisley":
      return <Paisley size={size} color={color} style={style} />;
    case "lotus":
      return <Lotus size={size} color={color} style={style} />;
    case "kalash":
      return <Kalash size={size} color={color} style={style} />;
    case "rangoli":
      return <Rangoli size={size} color={color} style={style} />;
    case "henna-hand":
      return <HennaHand size={size} color={color} style={style} />;
    case "om":
      return <Om size={size} color={color} style={style} />;
  }
}

export function MandalaPattern({
  color = "var(--gold)",
  opacity = 0.06,
  size = 720,
  style,
}: {
  color?: string;
  opacity?: number;
  size?: number;
  style?: CSSProperties;
}) {
  const rings = [340, 280, 220, 160, 100];
  const petals = Array.from({ length: 16 });
  return (
    <svg
      viewBox="0 0 720 720"
      style={{
        width: size,
        height: size,
        opacity,
        pointerEvents: "none",
        ...style,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(360 360)" stroke={color} fill="none" strokeWidth={1.4}>
        {rings.map((r) => (
          <circle key={r} r={r} />
        ))}
        {petals.map((_, i) => {
          const angle = (i * 360) / petals.length;
          return (
            <g key={i} transform={`rotate(${angle})`}>
              <path d="M0 -340 Q24 -240 0 -160 Q-24 -240 0 -340 Z" />
              <circle cx={0} cy={-100} r={4} fill={color} stroke="none" />
            </g>
          );
        })}
        {Array.from({ length: 32 }).map((_, i) => {
          const angle = (i * 360) / 32;
          return (
            <line
              key={`spoke-${i}`}
              x1={0}
              y1={-340}
              x2={0}
              y2={-220}
              transform={`rotate(${angle})`}
            />
          );
        })}
      </g>
    </svg>
  );
}
