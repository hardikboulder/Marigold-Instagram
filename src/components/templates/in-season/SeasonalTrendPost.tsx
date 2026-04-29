import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

import { TrendArrow, type TrendDirection } from "./InSeasonIcons";

export interface SeasonalTrend {
  trend: string;
  direction: TrendDirection;
}

export interface SeasonalTrendPostProps {
  season: string;
  year: string;
  backgroundColor?: string;
  trends: SeasonalTrend[];
  editorialTake: string;
}

const DEFAULT_BACKGROUND = "#2F5D4E";

export function SeasonalTrendPost({
  season,
  year,
  backgroundColor = DEFAULT_BACKGROUND,
  trends,
  editorialTake,
}: SeasonalTrendPostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: backgroundColor,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "100px 90px 160px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 12%, rgba(255,248,242,0.12), transparent 55%), radial-gradient(circle at 82% 88%, rgba(0,0,0,0.22), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <PushPin variant="gold" top={56} left={70} />
      <PushPin variant="gold" top={56} right={70} />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: 10,
          textTransform: "uppercase",
          color: "var(--cream)",
          textAlign: "center",
          marginBottom: 18,
          position: "relative",
          zIndex: 2,
        }}
      >
        In Season
      </div>

      <div
        style={{
          width: 80,
          height: 2,
          background: "var(--cream)",
          opacity: 0.4,
          margin: "0 auto 32px",
          position: "relative",
          zIndex: 2,
        }}
      />

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 64,
          lineHeight: 1.1,
          color: "var(--cream)",
          textAlign: "center",
          marginBottom: 48,
          position: "relative",
          zIndex: 2,
        }}
      >
        {season} {year} Wedding Trends
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 22,
          position: "relative",
          zIndex: 2,
        }}
      >
        {trends.map((t, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              borderBottom: "1px solid rgba(255,248,242,0.18)",
              paddingBottom: 18,
            }}
          >
            <TrendArrow direction={t.direction} size={32} color="var(--cream)" />
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 28,
                fontWeight: 500,
                color: "var(--cream)",
                lineHeight: 1.3,
                flex: 1,
              }}
            >
              {t.trend}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 44,
          color: "var(--gold-light)",
          transform: "rotate(-2deg)",
          textAlign: "center",
          marginTop: 36,
          position: "relative",
          zIndex: 2,
        }}
      >
        {editorialTake}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
