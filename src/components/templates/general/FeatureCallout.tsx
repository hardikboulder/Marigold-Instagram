import { Fragment, type ReactNode } from "react";
import { PushPin } from "@/components/brand/PushPin";

export interface FeatureCalloutProps {
  categoryLabel: string;
  /**
   * Headline string. Supports `\n` for line breaks and `*emphasis*` markers
   * for inline italic gold-light emphasis (a brand signature on this template).
   */
  headline: string;
  annotation: string;
  ctaText: string;
}

/**
 * Parse `*text*` into italic gold-light spans and `\n` into line breaks.
 */
function renderHeadline(headline: string): ReactNode {
  const lines = headline.split("\n");
  return lines.map((line, lineIndex) => {
    const parts = line.split(/(\*[^*]+\*)/g);
    return (
      <Fragment key={lineIndex}>
        {parts.map((part, partIndex) => {
          if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
            return (
              <i
                key={partIndex}
                style={{ color: "var(--gold-light)", fontStyle: "italic" }}
              >
                {part.slice(1, -1)}
              </i>
            );
          }
          return <Fragment key={partIndex}>{part}</Fragment>;
        })}
        {lineIndex < lines.length - 1 ? <br /> : null}
      </Fragment>
    );
  });
}

export function FeatureCallout({
  categoryLabel,
  headline,
  annotation,
  ctaText,
}: FeatureCalloutProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--pink)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 80,
        position: "relative",
      }}
    >
      <PushPin variant="gold" top={40} right={60} />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 24,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 4,
          color: "rgba(255,255,255,0.35)",
          marginBottom: 20,
        }}
      >
        {categoryLabel}
      </div>
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 80,
          color: "white",
          lineHeight: 1.05,
          marginBottom: 24,
        }}
      >
        {renderHeadline(headline)}
      </div>
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 40,
          color: "rgba(255,255,255,0.5)",
          transform: "rotate(-2deg)",
          marginBottom: 28,
        }}
      >
        {annotation}
      </div>
      <div
        style={{
          background: "white",
          color: "var(--deep-pink)",
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 2,
          padding: "20px 44px",
          boxShadow: "4px 4px 0 var(--wine)",
          transform: "rotate(-1deg)",
        }}
      >
        {ctaText}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(75,21,40,0.6)",
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
            color: "white",
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
          @themarigold
        </div>
      </div>
    </div>
  );
}
