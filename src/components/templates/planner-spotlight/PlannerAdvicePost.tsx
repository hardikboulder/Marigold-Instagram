import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

export type PlannerAdviceAccent = "gold" | "pink" | "lavender";

export interface PlannerAdvicePostProps {
  question: string;
  answer: string;
  plannerName: string;
  companyName: string;
  accentColor?: PlannerAdviceAccent;
}

const ACCENT_VARS: Record<PlannerAdviceAccent, string> = {
  gold: "var(--gold)",
  pink: "var(--hot-pink)",
  lavender: "var(--lavender)",
};

const PIN_VARIANT: Record<PlannerAdviceAccent, "gold" | "pink" | "blue"> = {
  gold: "gold",
  pink: "pink",
  lavender: "blue",
};

export function PlannerAdvicePost({
  question,
  answer,
  plannerName,
  companyName,
  accentColor = "gold",
}: PlannerAdvicePostProps) {
  const accent = ACCENT_VARS[accentColor];
  const pinVariant = PIN_VARIANT[accentColor];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--wine)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <PushPin variant={pinVariant} top={72} right={88} size={44} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "120px 96px 200px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          color: "var(--cream)",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: accent,
            marginBottom: 56,
          }}
        >
          ASK A PLANNER
        </div>

        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 64,
            lineHeight: 1.15,
            color: "var(--cream)",
            marginBottom: 48,
            maxWidth: 880,
          }}
        >
          &ldquo;{question}&rdquo;
        </div>

        <div
          style={{
            width: 80,
            height: 2,
            background: accent,
            opacity: 0.6,
            marginBottom: 48,
          }}
        />

        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 26,
            fontWeight: 400,
            lineHeight: 1.55,
            color: "rgba(255,248,242,0.92)",
            marginBottom: 44,
            maxWidth: 820,
          }}
        >
          {answer}
        </div>

        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 36,
            color: accent,
            transform: "rotate(-1.5deg)",
          }}
        >
          — {plannerName}, {companyName}
        </div>
      </div>

      <CTABar variant="light" handleText="PLANNER SPOTLIGHT" />
    </div>
  );
}
