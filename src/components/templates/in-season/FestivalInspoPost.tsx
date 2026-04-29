import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

import { ConnectionArrow } from "./InSeasonIcons";

export interface FestivalConnection {
  festivalElement: string;
  weddingApplication: string;
}

export interface FestivalInspoPostProps {
  festivalName: string;
  festivalColor?: string;
  connections: FestivalConnection[];
  note: string;
}

const DEFAULT_FESTIVAL_COLOR = "#D4A853";

export function FestivalInspoPost({
  festivalName,
  festivalColor = DEFAULT_FESTIVAL_COLOR,
  connections,
  note,
}: FestivalInspoPostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: festivalColor,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "100px 80px 160px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 10%, rgba(255,248,242,0.18), transparent 55%), radial-gradient(circle at 80% 90%, rgba(0,0,0,0.22), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <PushPin variant="gold" top={56} left={70} />
      <PushPin variant="gold" top={56} right={70} />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: "var(--cream)",
          textAlign: "center",
          marginBottom: 18,
          position: "relative",
          zIndex: 2,
        }}
      >
        Festival → Wedding
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 68,
          lineHeight: 1.05,
          color: "var(--cream)",
          textAlign: "center",
          marginBottom: 52,
          position: "relative",
          zIndex: 2,
        }}
      >
        {festivalName}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 28,
          position: "relative",
          zIndex: 2,
        }}
      >
        {connections.map((c, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 1fr",
              alignItems: "center",
              gap: 16,
              background: "rgba(255,248,242,0.10)",
              border: "1px solid rgba(255,248,242,0.22)",
              borderRadius: 12,
              padding: "22px 28px",
            }}
          >
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 26,
                fontWeight: 600,
                color: "var(--cream)",
                lineHeight: 1.25,
                textAlign: "right",
              }}
            >
              {c.festivalElement}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ConnectionArrow size={56} color="var(--cream)" />
            </div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 26,
                fontWeight: 500,
                color: "var(--cream)",
                lineHeight: 1.25,
              }}
            >
              {c.weddingApplication}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 42,
          color: "var(--cream)",
          transform: "rotate(-2deg)",
          textAlign: "center",
          marginTop: 32,
          position: "relative",
          zIndex: 2,
          maxWidth: 820,
          alignSelf: "center",
        }}
      >
        {note}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
