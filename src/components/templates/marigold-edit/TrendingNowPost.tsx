import { CTABar } from "@/components/brand/CTABar";

export type TrendCategory =
  | "decor"
  | "fashion"
  | "food"
  | "entertainment"
  | "stationery"
  | "beauty"
  | "venue";

export interface TrendingNowPostProps {
  trendTitle: string;
  trendDetails: string[];
  editorialTake: string;
  trendCategory: TrendCategory;
}

const TREND_CATEGORY_LABELS: Record<TrendCategory, string> = {
  decor: "DECOR",
  fashion: "FASHION",
  food: "FOOD",
  entertainment: "ENTERTAINMENT",
  stationery: "STATIONERY",
  beauty: "BEAUTY",
  venue: "VENUE",
};

const CONFETTI_DOTS =
  "url(\"data:image/svg+xml,%3Csvg width='240' height='240' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFFFFF' opacity='0.45'%3E%3Ccircle cx='28' cy='42' r='3'/%3E%3Ccircle cx='110' cy='18' r='2'/%3E%3Ccircle cx='192' cy='58' r='3.5'/%3E%3Ccircle cx='62' cy='118' r='2.5'/%3E%3Ccircle cx='148' cy='96' r='3'/%3E%3Ccircle cx='216' cy='168' r='2'/%3E%3Ccircle cx='42' cy='196' r='3'/%3E%3Ccircle cx='128' cy='212' r='2.5'/%3E%3Ccircle cx='194' cy='224' r='3'/%3E%3Ccircle cx='80' cy='62' r='2'/%3E%3Ccircle cx='168' cy='148' r='2.5'/%3E%3Ccircle cx='12' cy='110' r='2'/%3E%3C/g%3E%3C/svg%3E\")";

export function TrendingNowPost({
  trendTitle,
  trendDetails,
  editorialTake,
  trendCategory,
}: TrendingNowPostProps) {
  const categoryLabel =
    TREND_CATEGORY_LABELS[trendCategory] ?? trendCategory.toUpperCase();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--pink)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: CONFETTI_DOTS,
          opacity: 0.55,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "120px 96px 200px",
          display: "flex",
          flexDirection: "column",
          color: "white",
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "var(--gold-light)",
            }}
          >
            TRENDING NOW
          </div>
          <UpArrowIcon />
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.6)",
              marginLeft: "auto",
            }}
          >
            {categoryLabel}
          </span>
        </div>

        <div
          style={{
            width: 80,
            height: 2,
            background: "var(--gold-light)",
            marginBottom: 28,
            opacity: 0.8,
          }}
        />

        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 84,
            lineHeight: 1.05,
            color: "var(--wine)",
            marginBottom: 40,
            textShadow: "0 2px 14px rgba(75,21,40,0.18)",
          }}
        >
          {trendTitle}
        </div>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {trendDetails.map((detail, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 24,
                lineHeight: 1.4,
                color: "white",
                fontWeight: 400,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  marginTop: 12,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "var(--gold-light)",
                }}
              />
              <span>{detail}</span>
            </li>
          ))}
        </ul>

        <div
          style={{
            marginTop: "auto",
            fontFamily: "'Caveat', cursive",
            fontSize: 42,
            lineHeight: 1.15,
            color: "var(--gold-light)",
            transform: "rotate(-1.5deg)",
            textAlign: "right",
            maxWidth: 720,
            alignSelf: "flex-end",
          }}
        >
          {editorialTake}
        </div>
      </div>

      <CTABar variant="overlay" handleText="THE MARIGOLD EDIT" />
    </div>
  );
}

function UpArrowIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--gold-light)"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}
