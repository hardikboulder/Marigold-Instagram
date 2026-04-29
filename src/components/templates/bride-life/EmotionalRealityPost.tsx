import { CTABar } from "@/components/brand/CTABar";

export interface EmotionalRealityPostProps {
  topicTitle: string;
  body: string;
  signoff: string;
}

export function EmotionalRealityPost({
  topicTitle,
  body,
  signoff,
}: EmotionalRealityPostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "var(--wine)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "110px 100px 160px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 14%, rgba(212,168,83,0.16), transparent 55%), radial-gradient(circle at 80% 86%, rgba(138,96,112,0.28), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "var(--gold)",
          textAlign: "center",
          maxWidth: 720,
          lineHeight: 1.4,
          marginBottom: 18,
          position: "relative",
          zIndex: 2,
        }}
      >
        The Part Nobody Talks About
      </div>

      <div
        style={{
          width: 80,
          height: 2,
          background: "var(--gold)",
          opacity: 0.5,
          marginBottom: 56,
          position: "relative",
          zIndex: 2,
        }}
      />

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 76,
          lineHeight: 1.1,
          color: "var(--cream)",
          textAlign: "center",
          maxWidth: 860,
          marginBottom: 56,
          position: "relative",
          zIndex: 2,
        }}
      >
        {topicTitle}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          width: "100%",
          maxWidth: 820,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 28,
            fontWeight: 400,
            color: "rgba(255,248,242,0.92)",
            lineHeight: 1.5,
            textAlign: "center",
          }}
        >
          {body}
        </div>
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 44,
          color: "var(--gold)",
          textAlign: "center",
          maxWidth: 820,
          lineHeight: 1.25,
          marginTop: 40,
          transform: "rotate(-1.5deg)",
          position: "relative",
          zIndex: 2,
        }}
      >
        {signoff}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
