import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

import { CultureIcon, MandalaPattern, type CultureIconType } from "./CultureIcons";

export interface TraditionExplainedPostProps {
  traditionName: string;
  meaning: string;
  modernContext: string;
  decorativeIcon?: CultureIconType;
}

export function TraditionExplainedPost({
  traditionName,
  meaning,
  modernContext,
  decorativeIcon = "diya",
}: TraditionExplainedPostProps) {
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
        padding: "120px 90px 160px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 80,
          left: "50%",
          transform: "translate(-50%, 0)",
          pointerEvents: "none",
        }}
      >
        <MandalaPattern color="var(--gold)" opacity={0.08} size={900} />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 12%, rgba(212,168,83,0.16), transparent 55%), radial-gradient(circle at 82% 88%, rgba(237,147,177,0.10), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <PushPin variant="gold" top={56} left={70} />
      <PushPin variant="pink" top={56} right={70} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          marginBottom: 18,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 56,
            height: 1,
            background: "var(--gold)",
            opacity: 0.7,
          }}
        />
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "var(--gold)",
            lineHeight: 1,
          }}
        >
          Culture Corner
        </div>
        <div
          style={{
            width: 56,
            height: 1,
            background: "var(--gold)",
            opacity: 0.7,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 18,
          marginBottom: 30,
          position: "relative",
          zIndex: 2,
        }}
      >
        <CultureIcon type={decorativeIcon} size={80} color="var(--gold)" />
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 90,
          lineHeight: 1.04,
          color: "var(--cream)",
          textAlign: "center",
          maxWidth: 880,
          margin: "0 auto 36px",
          position: "relative",
          zIndex: 2,
        }}
      >
        {traditionName}
      </div>

      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 26,
          lineHeight: 1.5,
          color: "rgba(255,248,242,0.9)",
          textAlign: "center",
          maxWidth: 820,
          margin: "0 auto 44px",
          position: "relative",
          zIndex: 2,
        }}
      >
        {meaning}
      </div>

      <div
        style={{
          margin: "0 auto",
          maxWidth: 820,
          position: "relative",
          zIndex: 2,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "var(--gold)",
            opacity: 0.85,
            marginBottom: 14,
          }}
        >
          In modern context
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 44,
            color: "var(--gold)",
            lineHeight: 1.25,
            transform: "rotate(-1.5deg)",
          }}
        >
          {modernContext}
        </div>
      </div>

      <CTABar variant="overlay" handleText="CULTURE CORNER" />
    </div>
  );
}
