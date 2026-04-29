import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

export interface BudgetRealityCategory {
  name: string;
  planned: string;
  actual: string;
}

export interface BudgetRealityPostProps {
  categories?: BudgetRealityCategory[];
  annotation?: string;
  plannedTotal?: string;
  actualTotal?: string;
}

const DEFAULT_CATEGORIES: BudgetRealityCategory[] = [
  { name: "Venue", planned: "₹9.0 L", actual: "₹11.5 L" },
  { name: "Catering", planned: "₹7.5 L", actual: "₹9.2 L" },
  { name: "Decor", planned: "₹4.5 L", actual: "₹6.8 L" },
  { name: "Photography", planned: "₹3.0 L", actual: "₹3.4 L" },
  { name: "Outfits", planned: "₹2.4 L", actual: "₹4.1 L" },
  { name: "Miscellaneous", planned: "₹1.2 L", actual: "₹3.7 L" },
];

export function BudgetRealityPost({
  categories,
  annotation = "the 'miscellaneous' line is where dreams go to negotiate",
  plannedTotal = "₹27.6 L",
  actualTotal = "₹38.7 L",
}: BudgetRealityPostProps) {
  const rows =
    categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--cream)",
        position: "relative",
        overflow: "hidden",
        padding: "120px 90px 160px",
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent 0px, transparent 47px, rgba(75,21,40,0.08) 47px, rgba(75,21,40,0.08) 48px)",
      }}
    >
      <PushPin variant="gold" top={50} left="50%" style={{ transform: "translateX(-50%)" }} />

      <div
        style={{
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: 7,
            textTransform: "uppercase",
            color: "var(--gold)",
            lineHeight: 1.05,
          }}
        >
          Budget Reality Check
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 28,
            color: "var(--wine)",
            opacity: 0.7,
            marginTop: 6,
          }}
        >
          what you said vs. what the receipts said
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr",
          gap: 0,
          marginTop: 36,
          marginBottom: 18,
          paddingBottom: 12,
          borderBottom: "2px solid var(--wine)",
        }}
      >
        <div />
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 4,
            color: "var(--wine)",
            textAlign: "center",
          }}
        >
          THE PLAN
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 32,
            color: "var(--pink)",
            transform: "rotate(-3deg)",
            textAlign: "center",
          }}
        >
          the reality
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {rows.map((row) => (
          <div
            key={row.name}
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr",
              alignItems: "center",
              gap: 0,
            }}
          >
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 24,
                fontWeight: 600,
                color: "var(--wine)",
                letterSpacing: 0.5,
              }}
            >
              {row.name}
            </div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 26,
                fontWeight: 500,
                color: "var(--wine)",
                textAlign: "center",
                textDecoration: "line-through",
                textDecorationColor: "var(--pink)",
                textDecorationThickness: 2,
                opacity: 0.55,
              }}
            >
              {row.planned}
            </div>
            <div
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 44,
                color: "var(--pink)",
                textAlign: "center",
                transform: "rotate(-1.5deg)",
                lineHeight: 1,
              }}
            >
              {row.actual}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 40,
          paddingTop: 20,
          borderTop: "2px solid var(--wine)",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 4,
            color: "var(--wine)",
            textTransform: "uppercase",
          }}
        >
          Total
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 38,
            color: "var(--wine)",
            textAlign: "center",
            textDecoration: "line-through",
            textDecorationColor: "var(--pink)",
            opacity: 0.6,
          }}
        >
          {plannedTotal}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 60,
            color: "var(--hot-pink)",
            fontWeight: 700,
            textAlign: "center",
            transform: "rotate(-2deg)",
            lineHeight: 1,
          }}
        >
          {actualTotal}
        </div>
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 36,
          color: "var(--deep-pink)",
          textAlign: "center",
          marginTop: 28,
          transform: "rotate(-1.5deg)",
          maxWidth: 820,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.1,
        }}
      >
        {annotation}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
