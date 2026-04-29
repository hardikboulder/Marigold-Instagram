import { CTABar } from "@/components/brand/CTABar";
import { PushPin, type PushPinVariant } from "@/components/brand/PushPin";
import { QuizIcon, type QuizIconType } from "./QuizIcon";
import type { QuizBackgroundColor } from "./QuizTitleV2";

export interface QuizResultV2Props {
  /** Free-form result type identifier (e.g. "classic-elegance"). */
  resultType: string;
  /** Result name. First whitespace-separated word renders italic on its own line. */
  resultLabel: string;
  /** Optional emoji rendered above the label. */
  resultEmoji?: string;
  /** Caveat personality quote. */
  resultQuote: string;
  /** Space Grotesk personality description. */
  resultDescription: string;
  /** Prominent product tie-in callout (Space Grotesk). */
  productTieIn: string;
  /** Background color from the brand palette. */
  backgroundColor?: QuizBackgroundColor;
  /** Optional decorative SVG icon. */
  iconType?: QuizIconType;
}

interface BgPalette {
  background: string;
  text: string;
  accent: string;
  divider: string;
  pin: PushPinVariant;
  lined: boolean;
  productBg: string;
  productBorder: string;
}

const PALETTES: Record<QuizBackgroundColor, BgPalette> = {
  wine: {
    background: "var(--wine)",
    text: "var(--gold-light)",
    accent: "var(--hot-pink)",
    divider: "rgba(245,230,200,0.25)",
    pin: "gold",
    lined: false,
    productBg: "rgba(245,230,200,0.08)",
    productBorder: "1px solid rgba(245,230,200,0.2)",
  },
  "deep-pink": {
    background: "var(--deep-pink)",
    text: "var(--gold-light)",
    accent: "var(--hot-pink)",
    divider: "rgba(245,230,200,0.3)",
    pin: "gold",
    lined: false,
    productBg: "rgba(245,230,200,0.1)",
    productBorder: "1px solid rgba(245,230,200,0.25)",
  },
  mint: {
    background: "var(--mint)",
    text: "var(--wine)",
    accent: "var(--deep-pink)",
    divider: "rgba(75,21,40,0.18)",
    pin: "blue",
    lined: false,
    productBg: "rgba(75,21,40,0.05)",
    productBorder: "1px solid rgba(75,21,40,0.15)",
  },
  "gold-light": {
    background: "var(--gold-light)",
    text: "var(--wine)",
    accent: "var(--deep-pink)",
    divider: "rgba(75,21,40,0.18)",
    pin: "red",
    lined: true,
    productBg: "rgba(75,21,40,0.05)",
    productBorder: "1px solid rgba(75,21,40,0.15)",
  },
  lavender: {
    background: "var(--lavender)",
    text: "var(--wine)",
    accent: "var(--deep-pink)",
    divider: "rgba(75,21,40,0.18)",
    pin: "pink",
    lined: false,
    productBg: "rgba(75,21,40,0.05)",
    productBorder: "1px solid rgba(75,21,40,0.15)",
  },
  peach: {
    background: "var(--peach)",
    text: "var(--wine)",
    accent: "var(--deep-pink)",
    divider: "rgba(75,21,40,0.18)",
    pin: "gold",
    lined: false,
    productBg: "rgba(75,21,40,0.05)",
    productBorder: "1px solid rgba(75,21,40,0.15)",
  },
  blush: {
    background: "var(--blush)",
    text: "var(--wine)",
    accent: "var(--deep-pink)",
    divider: "rgba(75,21,40,0.16)",
    pin: "pink",
    lined: false,
    productBg: "rgba(75,21,40,0.04)",
    productBorder: "1px solid rgba(75,21,40,0.13)",
  },
  sky: {
    background: "var(--sky)",
    text: "var(--wine)",
    accent: "var(--pink)",
    divider: "rgba(75,21,40,0.18)",
    pin: "blue",
    lined: false,
    productBg: "rgba(75,21,40,0.05)",
    productBorder: "1px solid rgba(75,21,40,0.15)",
  },
  cream: {
    background: "var(--cream)",
    text: "var(--wine)",
    accent: "var(--deep-pink)",
    divider: "rgba(75,21,40,0.16)",
    pin: "pink",
    lined: false,
    productBg: "rgba(75,21,40,0.04)",
    productBorder: "1px solid rgba(75,21,40,0.13)",
  },
};

const LINED_PAPER =
  "repeating-linear-gradient(transparent, transparent 74px, rgba(212,83,126,0.05) 74px, rgba(212,83,126,0.05) 76px)";

function splitLabel(label: string): { italic: string; rest: string } {
  const trimmed = label.trim();
  const idx = trimmed.indexOf(" ");
  if (idx === -1) return { italic: trimmed, rest: "" };
  return {
    italic: trimmed.slice(0, idx),
    rest: trimmed.slice(idx + 1),
  };
}

export function QuizResultV2({
  resultType: _resultType,
  resultLabel,
  resultEmoji,
  resultQuote,
  resultDescription,
  productTieIn,
  backgroundColor = "mint",
  iconType,
}: QuizResultV2Props) {
  const palette = PALETTES[backgroundColor];
  const { italic, rest } = splitLabel(resultLabel);
  const labelFontSize = resultLabel.length > 16 ? 96 : 116;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: palette.background,
        backgroundImage: palette.lined ? LINED_PAPER : undefined,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 80,
        position: "relative",
      }}
    >
      <PushPin
        variant={palette.pin}
        top={160}
        left="50%"
        style={{ transform: "translateX(-50%)" }}
      />

      {iconType && (
        <div
          style={{
            position: "absolute",
            top: "18%",
            right: 70,
            opacity: 0.12,
            color: palette.text,
            pointerEvents: "none",
          }}
        >
          <QuizIcon type={iconType} size={260} color={palette.text} />
        </div>
      )}

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 26,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 5,
          color: palette.text,
          opacity: 0.55,
          marginBottom: 14,
        }}
      >
        YOUR RESULT IS
      </div>

      {resultEmoji && (
        <div style={{ fontSize: 64, marginBottom: 12, lineHeight: 1 }}>
          {resultEmoji}
        </div>
      )}

      {iconType && !resultEmoji && (
        <div
          style={{
            color: palette.accent,
            marginBottom: 14,
          }}
        >
          <QuizIcon type={iconType} size={88} color={palette.accent} />
        </div>
      )}

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: labelFontSize,
          color: palette.text,
          lineHeight: 1,
          marginBottom: 18,
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
          width: 120,
          height: 3,
          background: palette.divider,
          margin: "8px auto 24px",
        }}
      />

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 46,
          color: palette.text,
          opacity: 0.7,
          lineHeight: 1.4,
          maxWidth: 720,
          transform: "rotate(-1deg)",
          marginBottom: 24,
        }}
      >
        {resultQuote}
      </div>

      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 26,
          color: palette.text,
          opacity: 0.85,
          lineHeight: 1.5,
          maxWidth: 720,
          marginBottom: 28,
        }}
      >
        {resultDescription}
      </div>

      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 24,
          fontWeight: 500,
          color: palette.text,
          background: palette.productBg,
          border: palette.productBorder,
          padding: "22px 32px",
          maxWidth: 740,
          lineHeight: 1.5,
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: palette.accent,
            marginBottom: 8,
          }}
        >
          MARIGOLD MATCH
        </div>
        {productTieIn}
      </div>

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 20,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 3,
          color: palette.text,
          marginTop: 28,
          opacity: 0.4,
        }}
      >
        SHARE THIS TO YOUR STORY →
      </div>

      <CTABar />
    </div>
  );
}
