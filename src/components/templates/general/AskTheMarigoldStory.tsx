import { CTABar } from "@/components/brand/CTABar";

export interface AskTheMarigoldStoryProps {
  askerLabel: string;
  question: string;
  answer: string;
  annotations?: string[];
  ctaText: string;
}

export function AskTheMarigoldStory({
  askerLabel,
  question,
  answer,
  annotations = [],
  ctaText,
}: AskTheMarigoldStoryProps) {
  const validAnnotations = annotations.filter((a) => a && a.trim());

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--blush)",
        position: "relative",
        overflow: "hidden",
        padding: "120px 80px 220px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 80% 20%, rgba(212,168,83,0.18), transparent 55%), radial-gradient(circle at 15% 85%, rgba(224,208,240,0.28), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          textAlign: "center",
          marginBottom: 48,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: 12,
            textTransform: "uppercase",
            color: "var(--wine)",
            lineHeight: 1,
            marginBottom: 6,
          }}
        >
          Ask The
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 64,
            color: "var(--deep-pink)",
            lineHeight: 1,
          }}
        >
          Marigold
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          marginBottom: 18,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          maxWidth: 760,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "var(--mauve)",
            marginBottom: 10,
            paddingLeft: 14,
          }}
        >
          {askerLabel}
        </div>
        <div
          style={{
            background: "var(--cream)",
            borderRadius: "28px 28px 28px 6px",
            padding: "24px 28px",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 26,
            fontWeight: 500,
            lineHeight: 1.4,
            color: "var(--wine)",
            boxShadow: "0 6px 18px rgba(75,21,40,0.12)",
            border: "1px solid rgba(75,21,40,0.08)",
          }}
        >
          {question}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          marginTop: 24,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "var(--gold)",
            marginBottom: 14,
            paddingRight: 8,
          }}
        >
          The Marigold
        </div>

        <div
          style={{
            position: "relative",
            maxWidth: 820,
            background: "var(--wine)",
            color: "var(--cream)",
            borderRadius: "28px 28px 6px 28px",
            padding: "32px 36px",
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 34,
            lineHeight: 1.32,
            boxShadow: "0 10px 28px rgba(75,21,40,0.28)",
          }}
        >
          {answer}

          {validAnnotations[0] && (
            <div
              style={{
                position: "absolute",
                top: -28,
                left: -32,
                fontFamily: "'Caveat', cursive",
                fontStyle: "normal",
                fontSize: 32,
                color: "var(--deep-pink)",
                transform: "rotate(-6deg)",
                maxWidth: 320,
                textAlign: "left",
                lineHeight: 1.1,
              }}
            >
              {validAnnotations[0]}
            </div>
          )}

          {validAnnotations[1] && (
            <div
              style={{
                position: "absolute",
                bottom: -36,
                right: -16,
                fontFamily: "'Caveat', cursive",
                fontStyle: "normal",
                fontSize: 32,
                color: "var(--gold)",
                transform: "rotate(3deg)",
                maxWidth: 320,
                textAlign: "right",
                lineHeight: 1.1,
              }}
            >
              {validAnnotations[1]}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 80,
            alignSelf: "center",
            fontFamily: "'Caveat', cursive",
            fontSize: 36,
            color: "var(--wine)",
            transform: "rotate(-1.5deg)",
            textAlign: "center",
          }}
        >
          {ctaText}
        </div>
      </div>

      <CTABar variant="default" />
    </div>
  );
}
