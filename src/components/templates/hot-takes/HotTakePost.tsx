import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

import { FlameIcon } from "./FlameIcon";

export interface HotTakePostProps {
  hotTake: string;
  responsePrompt?: string;
  ctaText?: string;
}

export function HotTakePost({
  hotTake,
  responsePrompt = "agree or fight me",
  ctaText = "Drop your take in the comments 👇",
}: HotTakePostProps) {
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
        padding: "120px 90px 160px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 12%, rgba(212,168,83,0.18), transparent 55%), radial-gradient(circle at 82% 88%, rgba(237,147,177,0.14), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <PushPin variant="gold" top={56} left={70} />
      <PushPin variant="pink" top={56} right={70} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginBottom: 24,
          position: "relative",
          zIndex: 2,
        }}
      >
        <FlameIcon size={64} />
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "var(--gold)",
            lineHeight: 1,
          }}
        >
          Hot Take
        </div>
        <FlameIcon size={64} />
      </div>

      <div
        style={{
          width: 120,
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
            fontStyle: "italic",
            fontSize: 64,
            lineHeight: 1.12,
            color: "var(--cream)",
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          &ldquo;{hotTake}&rdquo;
        </div>
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 56,
          color: "var(--gold)",
          transform: "rotate(-3deg)",
          marginTop: 24,
          marginBottom: 32,
          position: "relative",
          zIndex: 2,
        }}
      >
        {responsePrompt}
      </div>

      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: 1,
          color: "rgba(255,248,242,0.55)",
          textAlign: "center",
          marginBottom: 24,
          position: "relative",
          zIndex: 2,
        }}
      >
        {ctaText}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
