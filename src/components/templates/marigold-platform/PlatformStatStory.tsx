import { CTABar } from "@/components/brand/CTABar";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface PlatformStatStoryProps {
  statValue: string;
  statContext: string;
  supportingDetail: string;
  aside: string;
}

export function PlatformStatStory({
  statValue,
  statContext,
  supportingDetail,
  aside,
}: PlatformStatStoryProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--pink)",
        position: "relative",
        padding: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      <TapeStrip
        top={200}
        left="50%"
        width={280}
        style={{ transform: "translateX(-50%) rotate(-2deg)" }}
      />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: "var(--gold-light)",
          marginBottom: 36,
        }}
      >
        On The Marigold
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 240,
          color: "var(--cream)",
          lineHeight: 0.9,
          marginBottom: 24,
          letterSpacing: -4,
          maxWidth: 900,
        }}
      >
        {statValue}
      </div>

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "var(--wine)",
          marginBottom: 36,
          maxWidth: 760,
          lineHeight: 1.2,
        }}
      >
        {statContext}
      </div>

      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 26,
          fontWeight: 400,
          color: "var(--cream)",
          lineHeight: 1.4,
          marginBottom: 44,
          maxWidth: 780,
          opacity: 0.9,
        }}
      >
        {supportingDetail}
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 46,
          color: "var(--gold-light)",
          lineHeight: 1.3,
          maxWidth: 760,
          transform: "rotate(-2deg)",
        }}
      >
        {aside}
      </div>

      <CTABar />
    </div>
  );
}
