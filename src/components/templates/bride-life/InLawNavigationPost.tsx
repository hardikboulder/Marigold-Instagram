import { CTABar } from "@/components/brand/CTABar";
import { CompassGlyph } from "./BrideLifeIcons";

export interface InLawNavigationPostProps {
  situation: string;
  steps: string[];
  note: string;
}

export function InLawNavigationPost({
  situation,
  steps,
  note,
}: InLawNavigationPostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "var(--cream)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "100px 90px 160px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 80% 12%, rgba(212,168,83,0.12), transparent 55%), radial-gradient(circle at 12% 88%, rgba(251,234,240,0.7), transparent 55%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
          position: "relative",
          zIndex: 2,
        }}
      >
        <CompassGlyph size={32} color="var(--wine)" />
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "var(--wine)",
          }}
        >
          The In-Law Guide
        </div>
      </div>

      <div
        style={{
          width: 80,
          height: 2,
          background: "var(--wine)",
          opacity: 0.3,
          marginBottom: 50,
          position: "relative",
          zIndex: 2,
        }}
      />

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 60,
          lineHeight: 1.15,
          color: "var(--wine)",
          textAlign: "center",
          maxWidth: 820,
          marginBottom: 56,
          position: "relative",
          zIndex: 2,
        }}
      >
        {situation}
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 800,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "var(--pink)",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          The Approach
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 22,
                padding: "20px 28px",
                background: "rgba(251,234,240,0.55)",
                border: "1px solid rgba(75,21,40,0.10)",
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "var(--wine)",
                  color: "var(--gold-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: "italic",
                  fontSize: 28,
                  lineHeight: 1,
                  paddingBottom: 4,
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 24,
                  fontWeight: 500,
                  color: "var(--wine)",
                  lineHeight: 1.4,
                  paddingTop: 6,
                }}
              >
                {step}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 40,
          color: "var(--mauve)",
          textAlign: "center",
          maxWidth: 760,
          lineHeight: 1.25,
          marginTop: 36,
          transform: "rotate(-1.5deg)",
          position: "relative",
          zIndex: 2,
        }}
      >
        {note}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
