import { CTABar } from "@/components/brand/CTABar";

export interface CityCostRow {
  category: string;
  rangeLow: number;
  rangeHigh: number;
  unit?: string;
}

export interface CostByCityPostProps {
  cityName?: string;
  costs?: CityCostRow[];
  disclaimer?: string;
}

const DEFAULT_COSTS: CityCostRow[] = [
  { category: "Venue", rangeLow: 12, rangeHigh: 35, unit: "lakh" },
  { category: "Catering (per plate)", rangeLow: 1800, rangeHigh: 5500, unit: "₹" },
  { category: "Decor", rangeLow: 5, rangeHigh: 18, unit: "lakh" },
  { category: "Photography", rangeLow: 2, rangeHigh: 8, unit: "lakh" },
];

const ROW_COLORS: string[] = [
  "var(--gold)",
  "var(--hot-pink)",
  "var(--lavender)",
  "var(--peach)",
];

function formatRange(row: CityCostRow): string {
  const unit = row.unit ?? "lakh";
  if (unit === "₹") {
    return `₹${row.rangeLow.toLocaleString("en-IN")} – ₹${row.rangeHigh.toLocaleString("en-IN")}`;
  }
  return `₹${row.rangeLow}–${row.rangeHigh} ${unit}`;
}

export function CostByCityPost({
  cityName = "Mumbai",
  costs,
  disclaimer = "these are 2026 estimates and your decorator will still charge more",
}: CostByCityPostProps) {
  const rows = costs && costs.length > 0 ? costs.slice(0, 6) : DEFAULT_COSTS;
  const maxHigh = Math.max(...rows.map((r) => r.rangeHigh));

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
        padding: "110px 90px 160px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 12%, rgba(212,168,83,0.18), transparent 55%), radial-gradient(circle at 82% 88%, rgba(237,147,177,0.12), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          textAlign: "center",
          position: "relative",
          zIndex: 2,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: 9,
            textTransform: "uppercase",
            color: "var(--gold)",
          }}
        >
          Cost Comparison
        </div>
        <div
          style={{
            width: 80,
            height: 2,
            background: "var(--gold)",
            opacity: 0.6,
            margin: "12px auto 0",
          }}
        />
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 130,
          lineHeight: 0.95,
          color: "var(--cream)",
          textAlign: "center",
          letterSpacing: -2,
          position: "relative",
          zIndex: 2,
          marginTop: 8,
          marginBottom: 36,
        }}
      >
        {cityName}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          position: "relative",
          zIndex: 2,
        }}
      >
        {rows.map((row, i) => {
          const widthPct = Math.max(
            18,
            Math.min(100, (row.rangeHigh / maxHigh) * 100),
          );
          const lowPct = Math.max(
            6,
            Math.min(widthPct - 8, (row.rangeLow / maxHigh) * 100),
          );
          const color = ROW_COLORS[i % ROW_COLORS.length];
          return (
            <div key={row.category} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 22,
                    fontWeight: 600,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "var(--cream)",
                  }}
                >
                  {row.category}
                </div>
                <div
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontStyle: "italic",
                    fontSize: 32,
                    color: "var(--gold)",
                  }}
                >
                  {formatRange(row)}
                </div>
              </div>
              <div
                style={{
                  position: "relative",
                  height: 28,
                  borderRadius: 14,
                  background: "rgba(255,248,242,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${widthPct}%`,
                    background: `linear-gradient(90deg, ${color}99, ${color})`,
                    borderRadius: 14,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: `${lowPct}%`,
                    top: -4,
                    bottom: -4,
                    width: 3,
                    background: "var(--cream)",
                    opacity: 0.85,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 32,
          color: "var(--hot-pink)",
          textAlign: "center",
          transform: "rotate(-1.5deg)",
          marginTop: 26,
          maxWidth: 820,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.15,
          position: "relative",
          zIndex: 2,
        }}
      >
        {disclaimer}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
