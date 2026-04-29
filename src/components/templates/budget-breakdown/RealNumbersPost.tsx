import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

export interface RealNumbersLineItem {
  section: string;
  category: string;
  amount: string;
}

export interface RealNumbersPostProps {
  totalBudget: string;
  lineItems: RealNumbersLineItem[];
  annotation?: string;
}

function parseAmount(amount: string): number {
  const digits = amount.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function formatTotal(total: number): string {
  if (total <= 0) return "—";
  return `₹${total.toLocaleString("en-IN")}`;
}

export function RealNumbersPost({
  totalBudget,
  lineItems,
  annotation,
}: RealNumbersPostProps) {
  const items = (lineItems || []).filter(
    (it) => (it.category || "").trim() && (it.amount || "").trim(),
  );
  const total = items.reduce((sum, it) => sum + parseAmount(it.amount), 0);

  const grouped: { section: string; rows: RealNumbersLineItem[] }[] = [];
  for (const item of items) {
    const last = grouped[grouped.length - 1];
    if (last && last.section === item.section) {
      last.rows.push(item);
    } else {
      grouped.push({ section: item.section, rows: [item] });
    }
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--cream)",
        position: "relative",
        overflow: "hidden",
        padding: "70px 60px 140px",
        display: "flex",
        flexDirection: "column",
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent 0, transparent 39px, rgba(75,21,40,0.04) 39px, rgba(75,21,40,0.04) 40px)",
      }}
    >
      <PushPin variant="gold" top={32} left={120} />

      <div
        style={{
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: 12,
            textTransform: "uppercase",
            color: "var(--wine)",
            lineHeight: 1,
          }}
        >
          Real Numbers
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 32,
            color: "var(--mauve)",
            transform: "rotate(-1.5deg)",
            marginTop: 4,
          }}
        >
          {totalBudget}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          marginTop: 18,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {grouped.map((group, gi) => (
          <div key={gi} style={{ display: "flex", flexDirection: "column" }}>
            {group.section && group.section.trim() && (
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: 5,
                  textTransform: "uppercase",
                  color: "var(--deep-pink)",
                  marginBottom: 4,
                  marginTop: gi === 0 ? 0 : 8,
                }}
              >
                {group.section}
              </div>
            )}
            {group.rows.map((row, ri) => (
              <div
                key={ri}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 16,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 20,
                  fontWeight: 500,
                  color: "var(--wine)",
                  padding: "5px 0",
                  borderBottom: "1px dotted rgba(75,21,40,0.18)",
                }}
              >
                <span style={{ flex: 1 }}>{row.category}</span>
                <span
                  style={{
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 600,
                    letterSpacing: 0.5,
                  }}
                >
                  {row.amount}
                </span>
              </div>
            ))}
          </div>
        ))}

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 16,
            paddingTop: 14,
            borderTop: "2px solid var(--wine)",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            color: "var(--wine)",
          }}
        >
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            Total
          </span>
          <span
            style={{
              fontSize: 32,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: 0.5,
            }}
          >
            {formatTotal(total)}
          </span>
        </div>
      </div>

      {annotation && annotation.trim() && (
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 30,
            color: "var(--deep-pink)",
            transform: "rotate(-1.5deg)",
            marginTop: 18,
            lineHeight: 1.2,
            maxWidth: 760,
          }}
        >
          {annotation}
        </div>
      )}

      <CTABar variant="overlay" />
    </div>
  );
}
