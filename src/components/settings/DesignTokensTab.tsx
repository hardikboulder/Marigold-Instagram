"use client";

/**
 * Design Tokens tab — read-only render of every brand color (with swatches)
 * and font (with size ladder). Pure showcase: design tokens are immutable.
 */

import type { CSSProperties } from "react";
import {
  marigoldColors,
  marigoldFonts,
  type MarigoldColor,
} from "@/lib/theme";
import { cardHeader, cardStyle, eyebrow, sectionHeader, sectionLead } from "./styles";

const COLOR_LABELS: Record<MarigoldColor, string> = {
  pink: "Pink — Primary brand",
  hotPink: "Hot Pink — Accent / italic logo",
  deepPink: "Deep Pink — Emphasis",
  blush: "Blush — Confession card",
  cream: "Cream — Default light",
  wine: "Wine — Dark, CTA bars, text",
  mauve: "Mauve — Secondary text",
  gold: "Gold — Dividers, vs.",
  goldLight: "Gold-light — Cards, tape",
  lavender: "Lavender — Confession card",
  mint: "Mint — Quiz: Zen Queen",
  peach: "Peach — Quiz: Party Starter",
  sky: "Sky — Reserved",
};

const COLOR_TOKENS: Record<MarigoldColor, string> = {
  pink: "--pink",
  hotPink: "--hot-pink",
  deepPink: "--deep-pink",
  blush: "--blush",
  cream: "--cream",
  wine: "--wine",
  mauve: "--mauve",
  gold: "--gold",
  goldLight: "--gold-light",
  lavender: "--lavender",
  mint: "--mint",
  peach: "--peach",
  sky: "--sky",
};

const FONT_ROLES: Array<{
  key: keyof typeof marigoldFonts;
  label: string;
  role: string;
  sample: string;
}> = [
  {
    key: "display",
    label: "Instrument Serif",
    role: "Display / Logo",
    sample: "The Marigold",
  },
  {
    key: "ui",
    label: "Syne",
    role: "UI / Labels",
    sample: "ANONYMOUS BRIDE, 2026",
  },
  {
    key: "body",
    label: "Space Grotesk",
    role: "Body",
    sample:
      "Every desi wedding, every detail, tracked across 13 planning phases.",
  },
  {
    key: "handwritten",
    label: "Caveat",
    role: "Handwritten / Editorial",
    sample: "she said, confidently",
  },
];

export function DesignTokensTab() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={eyebrow}>Design tokens</div>
        <h2 style={sectionHeader}>Locked. On purpose.</h2>
        <p style={sectionLead}>
          The four-font system and the color palette are the brand. Every
          template references these tokens through CSS variables — never
          hardcodes — so a change here ripples everywhere. (And yes, this tab is
          intentionally read-only.)
        </p>
      </div>

      <section style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={cardHeader}>Color palette</div>
        <div style={swatchGrid}>
          {(Object.keys(marigoldColors) as MarigoldColor[]).map((key) => (
            <Swatch
              key={key}
              colorKey={key}
              hex={marigoldColors[key]}
              label={COLOR_LABELS[key]}
              token={COLOR_TOKENS[key]}
            />
          ))}
        </div>
      </section>

      <section style={cardStyle}>
        <div style={cardHeader}>Type system</div>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13,
            color: "var(--mauve)",
            marginBottom: 16,
          }}
        >
          Four fonts, one role each. Don&rsquo;t cross the streams.
        </p>
        <div style={fontStack}>
          {FONT_ROLES.map((font) => (
            <FontPreview
              key={font.key}
              fontFamily={marigoldFonts[font.key]}
              label={font.label}
              role={font.role}
              sample={font.sample}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

interface SwatchProps {
  colorKey: MarigoldColor;
  hex: string;
  label: string;
  token: string;
}

function Swatch({ hex, label, token }: SwatchProps) {
  const isLight = isLightColor(hex);
  return (
    <div style={swatchCard}>
      <div
        style={{
          ...swatchBlock,
          background: hex,
          color: isLight ? "var(--wine)" : "var(--cream)",
          borderColor: isLight ? "rgba(75,21,40,0.15)" : "transparent",
        }}
      >
        <span style={swatchHex}>{hex.toUpperCase()}</span>
      </div>
      <div style={swatchTextBlock}>
        <div style={swatchLabel}>{label}</div>
        <code style={swatchToken}>var({token})</code>
      </div>
    </div>
  );
}

function FontPreview({
  fontFamily,
  label,
  role,
  sample,
}: {
  fontFamily: string;
  label: string;
  role: string;
  sample: string;
}) {
  return (
    <div style={fontRow}>
      <div style={fontMeta}>
        <div style={fontLabel}>{label}</div>
        <div style={fontRole}>{role}</div>
      </div>
      <div style={fontSamples}>
        <div style={{ fontFamily, fontSize: 56, lineHeight: 1.05 }}>
          {sample}
        </div>
        <div style={{ fontFamily, fontSize: 32, lineHeight: 1.15 }}>
          {sample}
        </div>
        <div style={{ fontFamily, fontSize: 18, lineHeight: 1.4 }}>
          {sample}
        </div>
        <div style={{ fontFamily, fontSize: 12, lineHeight: 1.4 }}>
          {sample}
        </div>
      </div>
    </div>
  );
}

function isLightColor(hex: string): boolean {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}

const swatchGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const swatchCard: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const swatchBlock: CSSProperties = {
  height: 96,
  borderRadius: 8,
  border: "1px solid transparent",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "flex-start",
  padding: 12,
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1.4,
};

const swatchHex: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 0.6,
};

const swatchTextBlock: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const swatchLabel: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--wine)",
  fontWeight: 500,
};

const swatchToken: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  color: "var(--mauve)",
};

const fontStack: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 28,
};

const fontRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "200px 1fr",
  gap: 24,
  alignItems: "flex-start",
  paddingBottom: 24,
  borderBottom: "1px dashed rgba(75,21,40,0.12)",
};

const fontMeta: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const fontLabel: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 24,
  color: "var(--wine)",
};

const fontRole: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--pink)",
};

const fontSamples: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  color: "var(--wine)",
};
