import { MarigoldFlowerGlyph } from "./BrideLifeIcons";

export type AffirmationGradient =
  | "blush-cream"
  | "lavender-cream"
  | "gold-cream"
  | "mint-cream";

export interface AffirmationStoryProps {
  affirmation: string;
  gradientColors?: AffirmationGradient;
}

interface GradientPalette {
  background: string;
  flowerColor: string;
  textColor: string;
  handleColor: string;
}

const GRADIENT_PALETTES: Record<AffirmationGradient, GradientPalette> = {
  "blush-cream": {
    background:
      "linear-gradient(180deg, var(--blush) 0%, #FBE0EC 35%, var(--cream) 100%)",
    flowerColor: "var(--gold)",
    textColor: "var(--wine)",
    handleColor: "rgba(75,21,40,0.45)",
  },
  "lavender-cream": {
    background:
      "linear-gradient(180deg, var(--lavender) 0%, #ECE0F5 40%, var(--cream) 100%)",
    flowerColor: "var(--gold)",
    textColor: "var(--wine)",
    handleColor: "rgba(75,21,40,0.45)",
  },
  "gold-cream": {
    background:
      "linear-gradient(180deg, var(--gold-light) 0%, #FAEFD8 40%, var(--cream) 100%)",
    flowerColor: "var(--wine)",
    textColor: "var(--wine)",
    handleColor: "rgba(75,21,40,0.45)",
  },
  "mint-cream": {
    background:
      "linear-gradient(180deg, var(--mint) 0%, #DDF2E5 40%, var(--cream) 100%)",
    flowerColor: "var(--gold)",
    textColor: "var(--wine)",
    handleColor: "rgba(75,21,40,0.45)",
  },
};

export function AffirmationStory({
  affirmation,
  gradientColors = "blush-cream",
}: AffirmationStoryProps) {
  const palette = GRADIENT_PALETTES[gradientColors];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: palette.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "200px 100px 140px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.35), transparent 55%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 880,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 84,
            lineHeight: 1.18,
            color: palette.textColor,
            textAlign: "center",
          }}
        >
          {affirmation}
        </div>

        <div style={{ marginTop: 80 }}>
          <MarigoldFlowerGlyph size={120} color={palette.flowerColor} />
        </div>
      </div>

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: palette.handleColor,
          marginTop: 40,
          position: "relative",
          zIndex: 2,
        }}
      >
        The Marigold
      </div>
    </div>
  );
}
