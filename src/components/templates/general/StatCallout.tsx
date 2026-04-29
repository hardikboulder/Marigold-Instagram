import { CTABar } from "@/components/brand/CTABar";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface StatCalloutProps {
  statNumber: string;
  statLabel: string;
  description: string;
}

export function StatCallout({
  statNumber,
  statLabel,
  description,
}: StatCalloutProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--wine)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 100,
        position: "relative",
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
          fontFamily: "'Instrument Serif', serif",
          fontSize: 280,
          color: "var(--hot-pink)",
          lineHeight: 0.85,
          marginBottom: 16,
        }}
      >
        {statNumber}
      </div>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 36,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 6,
          color: "rgba(255,255,255,0.4)",
          marginBottom: 40,
        }}
      >
        {statLabel}
      </div>
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 52,
          color: "var(--gold)",
          lineHeight: 1.4,
          maxWidth: 700,
          transform: "rotate(-2deg)",
        }}
      >
        {description}
      </div>

      <CTABar />
    </div>
  );
}
