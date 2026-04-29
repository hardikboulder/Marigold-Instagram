import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

export interface ComparisonRow {
  oldWay: string;
  newWay: string;
}

export interface MarigoldVsOldWayPostProps {
  comparisons: ComparisonRow[];
  tagline: string;
}

function RedX() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      style={{ flexShrink: 0, marginTop: 3 }}
    >
      <circle cx="11" cy="11" r="10" fill="rgba(192,57,43,0.12)" stroke="#C0392B" strokeWidth="1.8" />
      <path
        d="M7 7L15 15M15 7L7 15"
        stroke="#C0392B"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GoldCheck() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      style={{ flexShrink: 0, marginTop: 3 }}
    >
      <circle cx="11" cy="11" r="10" fill="var(--gold)" />
      <path
        d="M6.5 11.5L9.5 14.5L15.5 8"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MarigoldVsOldWayPost({
  comparisons,
  tagline,
}: MarigoldVsOldWayPostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--cream)",
        position: "relative",
        padding: "80px 60px 140px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PushPin variant="pink" top={40} left={50} />
      <PushPin variant="gold" top={40} right={50} />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "var(--mauve)",
          textAlign: "center",
          marginBottom: 14,
        }}
      >
        Then vs. Now
      </div>
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 56,
          color: "var(--wine)",
          lineHeight: 1,
          textAlign: "center",
          marginBottom: 34,
        }}
      >
        the spreadsheet era is over.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "white",
          border: "2px solid var(--wine)",
          boxShadow: "6px 6px 0 var(--blush)",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            background: "var(--wine)",
            color: "var(--cream)",
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 4,
            textTransform: "uppercase",
            textAlign: "center",
            borderRight: "2px solid var(--gold)",
          }}
        >
          The Old Way
        </div>
        <div
          style={{
            padding: "20px 24px",
            background: "var(--pink)",
            color: "var(--cream)",
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 4,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          The Marigold Way
        </div>

        {comparisons.map((row, i) => (
          <div
            key={`row-${i}`}
            style={{
              display: "contents",
            }}
          >
            <div
              style={{
                padding: "16px 22px",
                borderTop: i === 0 ? undefined : "1px dashed rgba(75,21,40,0.15)",
                borderRight: "2px solid var(--gold)",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 19,
                color: "var(--mauve)",
                textDecoration: "line-through",
                textDecorationColor: "rgba(192,57,43,0.5)",
                background: i % 2 === 0 ? "white" : "rgba(251,234,240,0.4)",
              }}
            >
              <RedX />
              <div>{row.oldWay}</div>
            </div>
            <div
              style={{
                padding: "16px 22px",
                borderTop: i === 0 ? undefined : "1px dashed rgba(75,21,40,0.15)",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 19,
                fontWeight: 500,
                color: "var(--wine)",
                background: i % 2 === 0 ? "white" : "rgba(251,234,240,0.4)",
              }}
            >
              <GoldCheck />
              <div>{row.newWay}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 28,
          fontFamily: "'Caveat', cursive",
          fontSize: 42,
          color: "var(--pink)",
          textAlign: "center",
          transform: "rotate(-2deg)",
        }}
      >
        {tagline}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
