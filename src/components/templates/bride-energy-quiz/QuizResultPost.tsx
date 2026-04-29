import { CTABar } from "@/components/brand/CTABar";
import { QuizIcon, type QuizIconType } from "./QuizIcon";
import type { QuizBackgroundColor } from "./QuizTitleV2";

export interface QuizResultPostProps {
  resultType: string;
  resultLabel: string;
  resultEmoji?: string;
  resultQuote: string;
  resultDescription: string;
  productTieIn: string;
  backgroundColor?: QuizBackgroundColor;
  iconType?: QuizIconType;
}

interface BgPalette {
  background: string;
  text: string;
  accent: string;
  decorationOpacity: number;
}

const PALETTES: Record<QuizBackgroundColor, BgPalette> = {
  wine: {
    background: "var(--wine)",
    text: "var(--gold-light)",
    accent: "var(--hot-pink)",
    decorationOpacity: 0.13,
  },
  "deep-pink": {
    background: "var(--deep-pink)",
    text: "var(--gold-light)",
    accent: "var(--hot-pink)",
    decorationOpacity: 0.16,
  },
  mint: {
    background: "var(--mint)",
    text: "var(--wine)",
    accent: "var(--deep-pink)",
    decorationOpacity: 0.14,
  },
  "gold-light": {
    background: "var(--gold-light)",
    text: "var(--wine)",
    accent: "var(--deep-pink)",
    decorationOpacity: 0.14,
  },
  lavender: {
    background: "var(--lavender)",
    text: "var(--wine)",
    accent: "var(--deep-pink)",
    decorationOpacity: 0.14,
  },
  peach: {
    background: "var(--peach)",
    text: "var(--wine)",
    accent: "var(--deep-pink)",
    decorationOpacity: 0.14,
  },
  blush: {
    background: "var(--blush)",
    text: "var(--wine)",
    accent: "var(--deep-pink)",
    decorationOpacity: 0.13,
  },
  sky: {
    background: "var(--sky)",
    text: "var(--wine)",
    accent: "var(--pink)",
    decorationOpacity: 0.15,
  },
  cream: {
    background: "var(--cream)",
    text: "var(--wine)",
    accent: "var(--deep-pink)",
    decorationOpacity: 0.12,
  },
};

function splitLabel(label: string): { italic: string; rest: string } {
  const trimmed = label.trim();
  const idx = trimmed.indexOf(" ");
  if (idx === -1) return { italic: trimmed, rest: "" };
  return {
    italic: trimmed.slice(0, idx),
    rest: trimmed.slice(idx + 1),
  };
}

export function QuizResultPost({
  resultType: _resultType,
  resultLabel,
  resultEmoji,
  resultQuote: _resultQuote,
  resultDescription,
  productTieIn,
  backgroundColor = "mint",
  iconType,
}: QuizResultPostProps) {
  const palette = PALETTES[backgroundColor];
  const { italic, rest } = splitLabel(resultLabel);
  const labelFontSize = resultLabel.length > 16 ? 84 : 100;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: palette.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 70,
        paddingBottom: 130,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {iconType && (
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            opacity: palette.decorationOpacity,
            color: palette.text,
            pointerEvents: "none",
          }}
        >
          <QuizIcon type={iconType} size={460} color={palette.text} />
        </div>
      )}

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 6,
          color: palette.text,
          opacity: 0.5,
          marginBottom: 18,
          zIndex: 1,
        }}
      >
        YOUR RESULT
      </div>

      {resultEmoji ? (
        <div style={{ fontSize: 56, marginBottom: 8, lineHeight: 1, zIndex: 1 }}>
          {resultEmoji}
        </div>
      ) : iconType ? (
        <div style={{ color: palette.accent, marginBottom: 12, zIndex: 1 }}>
          <QuizIcon type={iconType} size={72} color={palette.accent} />
        </div>
      ) : null}

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: labelFontSize,
          color: palette.text,
          lineHeight: 1,
          marginBottom: 14,
          zIndex: 1,
        }}
      >
        <i>{italic}</i>
        {rest && (
          <>
            <br />
            {rest}
          </>
        )}
      </div>

      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 22,
          color: palette.text,
          opacity: 0.85,
          lineHeight: 1.5,
          maxWidth: 760,
          marginTop: 8,
          marginBottom: 16,
          zIndex: 1,
        }}
      >
        {resultDescription}
      </div>

      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 19,
          fontWeight: 500,
          color: palette.text,
          opacity: 0.95,
          lineHeight: 1.45,
          maxWidth: 760,
          padding: "16px 24px",
          borderTop: `1px solid ${palette.text}`,
          borderBottom: `1px solid ${palette.text}`,
          borderTopColor: palette.text,
          borderBottomColor: palette.text,
          borderImage: "none",
          zIndex: 1,
          position: "relative",
        }}
      >
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 3,
            color: palette.accent,
            display: "block",
            marginBottom: 6,
          }}
        >
          MARIGOLD MATCH
        </span>
        {productTieIn}
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 38,
          color: palette.accent,
          marginTop: 18,
          transform: "rotate(-2deg)",
          zIndex: 1,
        }}
      >
        share this if it&rsquo;s you →
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
