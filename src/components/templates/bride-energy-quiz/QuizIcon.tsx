import type { CSSProperties } from "react";

export type QuizIconType =
  | "crown"
  | "flower"
  | "paintbrush"
  | "disco-ball"
  | "temple"
  | "compass"
  | "heart"
  | "star"
  | "palette";

interface QuizIconProps {
  type: QuizIconType;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

export function QuizIcon({
  type,
  size = 120,
  color = "currentColor",
  style,
}: QuizIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 100 100",
    fill: "none" as const,
    stroke: color,
    strokeWidth: 2.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style,
  };

  switch (type) {
    case "crown":
      return (
        <svg {...common}>
          <path d="M15 70 L20 30 L35 50 L50 25 L65 50 L80 30 L85 70 Z" />
          <path d="M15 78 L85 78" />
          <circle cx="20" cy="30" r="3" fill={color} />
          <circle cx="50" cy="25" r="3" fill={color} />
          <circle cx="80" cy="30" r="3" fill={color} />
        </svg>
      );
    case "flower":
      return (
        <svg {...common}>
          <circle cx="50" cy="50" r="10" />
          <ellipse cx="50" cy="25" rx="11" ry="16" />
          <ellipse cx="50" cy="75" rx="11" ry="16" />
          <ellipse cx="25" cy="50" rx="16" ry="11" />
          <ellipse cx="75" cy="50" rx="16" ry="11" />
        </svg>
      );
    case "paintbrush":
      return (
        <svg {...common}>
          <path d="M70 18 L82 30 L42 70 L30 58 Z" />
          <path d="M30 58 L20 80 L42 70" />
          <path d="M70 18 L82 30" />
        </svg>
      );
    case "disco-ball":
      return (
        <svg {...common}>
          <circle cx="50" cy="55" r="28" />
          <line x1="50" y1="27" x2="50" y2="83" />
          <line x1="22" y1="55" x2="78" y2="55" />
          <path d="M30 38 Q50 50 70 38" />
          <path d="M30 72 Q50 60 70 72" />
          <line x1="50" y1="20" x2="50" y2="10" />
          <line x1="42" y1="14" x2="58" y2="14" />
        </svg>
      );
    case "temple":
      return (
        <svg {...common}>
          <path d="M20 80 L20 50 L50 22 L80 50 L80 80 Z" />
          <path d="M40 80 L40 60 L60 60 L60 80" />
          <line x1="50" y1="22" x2="50" y2="14" />
          <circle cx="50" cy="12" r="2.5" fill={color} />
          <line x1="15" y1="80" x2="85" y2="80" />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <circle cx="50" cy="50" r="32" />
          <path d="M50 28 L58 50 L50 72 L42 50 Z" fill={color} fillOpacity="0.15" />
          <circle cx="50" cy="50" r="3" fill={color} />
          <line x1="50" y1="22" x2="50" y2="18" />
          <line x1="50" y1="78" x2="50" y2="82" />
          <line x1="22" y1="50" x2="18" y2="50" />
          <line x1="78" y1="50" x2="82" y2="50" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M50 80 C20 60, 15 35, 32 25 C42 19, 50 28, 50 35 C50 28, 58 19, 68 25 C85 35, 80 60, 50 80 Z" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="M50 14 L60 40 L88 42 L66 60 L74 86 L50 70 L26 86 L34 60 L12 42 L40 40 Z" />
        </svg>
      );
    case "palette":
      return (
        <svg {...common}>
          <path d="M50 18 C28 18, 14 34, 14 52 C14 66, 24 76, 38 76 C44 76, 46 72, 46 68 C46 64, 44 62, 44 58 C44 54, 48 52, 52 52 L66 52 C76 52, 86 44, 86 32 C86 24, 70 18, 50 18 Z" />
          <circle cx="32" cy="40" r="4" fill={color} />
          <circle cx="50" cy="32" r="4" fill={color} />
          <circle cx="68" cy="40" r="4" fill={color} />
          <circle cx="74" cy="56" r="4" fill={color} />
        </svg>
      );
  }
}
