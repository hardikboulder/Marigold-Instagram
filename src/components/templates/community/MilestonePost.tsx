import type { CSSProperties } from "react";
import { CTABar } from "@/components/brand/CTABar";

export interface MilestonePostProps {
  milestoneNumber: string;
  milestoneLabel: string;
  gratitudeMessage: string;
}

interface ConfettiSpec {
  type: "dot" | "heart";
  top: string;
  left: string;
  size: number;
  rotation: number;
  color: string;
  opacity: number;
}

const CONFETTI: ConfettiSpec[] = [
  { type: "dot", top: "8%", left: "12%", size: 20, rotation: 12, color: "var(--gold)", opacity: 0.85 },
  { type: "heart", top: "14%", left: "78%", size: 28, rotation: -18, color: "var(--gold)", opacity: 0.85 },
  { type: "dot", top: "18%", left: "44%", size: 14, rotation: 0, color: "var(--gold-light)", opacity: 0.95 },
  { type: "dot", top: "26%", left: "8%", size: 28, rotation: -10, color: "var(--gold)", opacity: 0.65 },
  { type: "heart", top: "30%", left: "88%", size: 22, rotation: 22, color: "var(--gold-light)", opacity: 0.9 },
  { type: "dot", top: "62%", left: "6%", size: 18, rotation: 0, color: "var(--gold-light)", opacity: 0.85 },
  { type: "heart", top: "70%", left: "16%", size: 26, rotation: 14, color: "var(--gold)", opacity: 0.8 },
  { type: "dot", top: "66%", left: "82%", size: 24, rotation: -8, color: "var(--gold)", opacity: 0.75 },
  { type: "heart", top: "76%", left: "74%", size: 20, rotation: -22, color: "var(--gold-light)", opacity: 0.9 },
  { type: "dot", top: "44%", left: "92%", size: 12, rotation: 0, color: "var(--gold)", opacity: 1 },
  { type: "dot", top: "52%", left: "4%", size: 14, rotation: 0, color: "var(--gold)", opacity: 0.9 },
  { type: "heart", top: "22%", left: "26%", size: 18, rotation: 8, color: "var(--gold)", opacity: 0.7 },
];

function HeartGlyph({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 21s-7-4.5-9.5-9C0 8 2.5 3 7 3c2 0 3.8 1.2 5 3 1.2-1.8 3-3 5-3 4.5 0 7 5 4.5 9-2.5 4.5-9.5 9-9.5 9z"
        fill={color}
      />
    </svg>
  );
}

function ConfettiPiece({ spec }: { spec: ConfettiSpec }) {
  const wrapperStyle: CSSProperties = {
    position: "absolute",
    top: spec.top,
    left: spec.left,
    transform: `translate(-50%, -50%) rotate(${spec.rotation}deg)`,
    opacity: spec.opacity,
    pointerEvents: "none",
  };
  if (spec.type === "dot") {
    return (
      <div
        style={{
          ...wrapperStyle,
          width: spec.size,
          height: spec.size,
          borderRadius: "50%",
          background: spec.color,
        }}
      />
    );
  }
  return (
    <div style={wrapperStyle}>
      <HeartGlyph size={spec.size} color={spec.color} />
    </div>
  );
}

export function MilestonePost({
  milestoneNumber,
  milestoneLabel,
  gratitudeMessage,
}: MilestonePostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--pink)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 80px 160px",
      }}
    >
      {CONFETTI.map((spec, i) => (
        <ConfettiPiece key={i} spec={spec} />
      ))}

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 280,
            lineHeight: 0.9,
            color: "var(--cream)",
            letterSpacing: -4,
            marginBottom: 20,
            textShadow: "0 8px 24px rgba(75,21,40,0.18)",
          }}
        >
          {milestoneNumber}
        </div>

        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "var(--cream)",
            maxWidth: 760,
            lineHeight: 1.3,
            marginBottom: 50,
          }}
        >
          {milestoneLabel}
        </div>

        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 50,
            color: "var(--gold-light)",
            lineHeight: 1.2,
            maxWidth: 780,
            transform: "rotate(-1.5deg)",
          }}
        >
          {gratitudeMessage}
        </div>
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
