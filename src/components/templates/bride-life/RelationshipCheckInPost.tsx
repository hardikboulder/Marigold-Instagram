import { CTABar } from "@/components/brand/CTABar";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface RelationshipCheckInPostProps {
  conversationPrompt: string;
  activitySuggestion: string;
  annotation: string;
}

export function RelationshipCheckInPost({
  conversationPrompt,
  activitySuggestion,
  annotation,
}: RelationshipCheckInPostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "var(--lavender)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "120px 90px 160px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 80%, rgba(255,248,242,0.6), transparent 50%), radial-gradient(circle at 82% 18%, rgba(251,234,240,0.45), transparent 55%)",
          pointerEvents: "none",
        }}
      />

      <TapeStrip
        top={64}
        left="50%"
        rotation={-3}
        width={240}
        height={54}
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: 10,
          textTransform: "uppercase",
          color: "var(--wine)",
          marginTop: 60,
          marginBottom: 18,
          position: "relative",
          zIndex: 2,
        }}
      >
        Couple Check-In
      </div>

      <div
        style={{
          width: 80,
          height: 2,
          background: "var(--wine)",
          opacity: 0.35,
          marginBottom: 70,
          position: "relative",
          zIndex: 2,
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 880,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 68,
            lineHeight: 1.15,
            color: "var(--wine)",
            textAlign: "center",
          }}
        >
          &ldquo;{conversationPrompt}&rdquo;
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: "32px 44px",
          background: "rgba(255,248,242,0.78)",
          border: "1px solid rgba(75,21,40,0.12)",
          borderRadius: 20,
          maxWidth: 820,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 40,
            color: "var(--pink)",
            transform: "rotate(-2deg)",
            marginBottom: 8,
            lineHeight: 1,
          }}
        >
          Try this tonight:
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 26,
            fontWeight: 500,
            color: "var(--wine)",
            lineHeight: 1.4,
            textAlign: "left",
          }}
        >
          {activitySuggestion}
        </div>
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 36,
          color: "var(--mauve)",
          marginTop: 32,
          transform: "rotate(-1.5deg)",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        {annotation}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
