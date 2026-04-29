import { CTABar } from "@/components/brand/CTABar";
import { PushPin, type PushPinVariant } from "@/components/brand/PushPin";

export type QuizResultType = "zen" | "typeA" | "creative" | "party";

export interface QuizResultProps {
  type: QuizResultType;
  /**
   * The result name. The first whitespace-separated word is rendered italic on
   * its own line; the remainder appears on the second line.
   * Example: "Zen Queen" → italic "Zen" / "Queen".
   */
  resultLabel: string;
  /** Caveat personality quote, displayed in quotes if not already wrapped. */
  resultQuote: string;
  /** Space Grotesk product tie-in description. */
  resultDescription: string;
}

interface VariantConfig {
  background: string;
  pin: PushPinVariant;
  labelFontSize: number;
  lined: boolean;
}

const VARIANTS: Record<QuizResultType, VariantConfig> = {
  zen: {
    background: "var(--mint)",
    pin: "blue",
    labelFontSize: 130,
    lined: false,
  },
  typeA: {
    background: "var(--gold-light)",
    pin: "red",
    labelFontSize: 110,
    lined: true,
  },
  creative: {
    background: "var(--lavender)",
    pin: "pink",
    labelFontSize: 105,
    lined: false,
  },
  party: {
    background: "var(--peach)",
    pin: "gold",
    labelFontSize: 120,
    lined: false,
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

export function QuizResult({
  type,
  resultLabel,
  resultQuote,
  resultDescription,
}: QuizResultProps) {
  const cfg = VARIANTS[type];
  const { italic, rest } = splitLabel(resultLabel);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: cfg.background,
        backgroundImage: cfg.lined ? LINED_PAPER : undefined,
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
        variant={cfg.pin}
        top={160}
        left="50%"
        style={{ transform: "translateX(-50%)" }}
      />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 28,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 5,
          color: "var(--wine)",
          opacity: 0.4,
          marginBottom: 16,
        }}
      >
        YOUR BRIDE ENERGY IS
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: cfg.labelFontSize,
          color: "var(--wine)",
          lineHeight: 1,
          marginBottom: 20,
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
          background: "var(--wine)",
          opacity: 0.15,
          margin: "12px auto 28px",
        }}
      />

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 48,
          color: "var(--wine)",
          opacity: 0.6,
          lineHeight: 1.4,
          maxWidth: 700,
          transform: "rotate(-1deg)",
        }}
      >
        {resultQuote}
      </div>

      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 28,
          color: "var(--mauve)",
          marginTop: 36,
          lineHeight: 1.6,
          maxWidth: 680,
        }}
      >
        {resultDescription}
      </div>

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 3,
          color: "var(--wine)",
          marginTop: 40,
          opacity: 0.35,
        }}
      >
        SHARE THIS TO YOUR STORY →
      </div>

      <CTABar />
    </div>
  );
}
