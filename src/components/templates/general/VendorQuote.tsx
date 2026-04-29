import { TapeStrip } from "@/components/brand/TapeStrip";

export interface VendorQuoteProps {
  quote: string;
  attribution: string;
  tagline: string;
  seriesLabel?: string;
}

export function VendorQuote({
  quote,
  attribution,
  tagline,
  seriesLabel = "Things Your Vendor Wishes You Knew",
}: VendorQuoteProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--cream)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        position: "relative",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "72px 60px",
          width: 900,
          position: "relative",
          transform: "rotate(-1deg)",
          boxShadow: "4px 5px 12px rgba(75,21,40,0.08)",
          border: "1px dashed rgba(75,21,40,0.08)",
        }}
      >
        <TapeStrip top={-28} left={50} rotation={-6} width={180} />
        <TapeStrip top={-24} right={40} rotation={4} width={180} />

        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 64,
            color: "var(--hot-pink)",
            opacity: 0.25,
            lineHeight: 1,
            marginBottom: -16,
          }}
        >
          &ldquo;
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 52,
            color: "var(--wine)",
            lineHeight: 1.3,
            marginBottom: 28,
          }}
        >
          {quote}
        </div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 2,
            color: "var(--mauve)",
          }}
        >
          {attribution}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 34,
            color: "var(--pink)",
            marginTop: 20,
            transform: "rotate(-2deg)",
          }}
        >
          {tagline}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--wine)",
          padding: "28px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 36,
            color: "var(--hot-pink)",
            lineHeight: 1,
          }}
        >
          The <i style={{ fontStyle: "italic" }}>Marigold</i>
        </div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: 2,
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
          }}
        >
          {seriesLabel}
        </div>
      </div>
    </div>
  );
}
