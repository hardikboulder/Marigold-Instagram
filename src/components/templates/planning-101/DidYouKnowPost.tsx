import { CTABar } from "@/components/brand/CTABar";

export interface DidYouKnowPostProps {
  fact: string;
  source: string;
  annotation?: string;
}

export function DidYouKnowPost({
  fact,
  source,
  annotation,
}: DidYouKnowPostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--wine)",
        position: "relative",
        overflow: "hidden",
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
            "radial-gradient(circle at 18% 14%, rgba(212,168,83,0.18), transparent 55%), radial-gradient(circle at 82% 86%, rgba(237,147,177,0.12), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          fontFamily: "'Syne', sans-serif",
          fontSize: 48,
          fontWeight: 800,
          letterSpacing: 10,
          textTransform: "uppercase",
          color: "var(--gold)",
          lineHeight: 1,
          marginBottom: 14,
        }}
      >
        Did You Know?
      </div>

      <div
        style={{
          width: 96,
          height: 2,
          background: "var(--gold)",
          opacity: 0.5,
          marginBottom: 60,
          position: "relative",
          zIndex: 2,
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 60,
            lineHeight: 1.2,
            color: "var(--cream)",
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          {fact}
        </div>
      </div>

      {annotation && annotation.trim() && (
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 44,
            color: "var(--hot-pink)",
            transform: "rotate(-2deg)",
            marginTop: 24,
            marginBottom: 18,
            textAlign: "center",
            position: "relative",
            zIndex: 2,
          }}
        >
          {annotation}
        </div>
      )}

      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: "rgba(245,230,200,0.55)",
          textAlign: "center",
          marginBottom: 24,
          position: "relative",
          zIndex: 2,
        }}
      >
        {source}
      </div>

      <CTABar variant="light" />
    </div>
  );
}
