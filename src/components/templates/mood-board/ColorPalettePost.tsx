import { CTABar } from "@/components/brand/CTABar";

export interface PaletteColor {
  hex: string;
  name: string;
}

export interface ColorPalettePostProps {
  paletteName: string;
  seasonNote: string;
  /** 5 entries — additional entries are ignored, fewer renders narrower bars. */
  colors: PaletteColor[];
}

const TAGLINE = "THE MARIGOLD";

export function ColorPalettePost({
  paletteName,
  seasonNote,
  colors,
}: ColorPalettePostProps) {
  const swatches = colors.slice(0, 5);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--cream)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: "0 0 70%",
          display: "flex",
          width: "100%",
        }}
      >
        {swatches.map((swatch, i) => (
          <Swatch key={`${swatch.hex}-${i}`} swatch={swatch} />
        ))}
      </div>

      <div
        style={{
          flex: 1,
          background: "var(--cream)",
          padding: "36px 60px 110px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 16,
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "var(--mauve)",
          }}
        >
          {TAGLINE} · COLOR STORY
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 88,
            color: "var(--wine)",
            lineHeight: 1.0,
          }}
        >
          {paletteName}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 40,
            color: "var(--pink)",
            transform: "rotate(-2deg)",
            marginTop: 4,
          }}
        >
          {seasonNote}
        </div>
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}

function Swatch({ swatch }: { swatch: PaletteColor }) {
  const labelColor = isLight(swatch.hex) ? "rgba(75,21,40,0.85)" : "rgba(255,248,242,0.92)";
  return (
    <div
      style={{
        flex: 1,
        background: swatch.hex,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: 22,
      }}
    >
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: labelColor,
          lineHeight: 1.2,
        }}
      >
        {swatch.name}
      </div>
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13,
          fontWeight: 400,
          letterSpacing: 2,
          color: labelColor,
          opacity: 0.7,
          marginTop: 4,
          textTransform: "uppercase",
        }}
      >
        {swatch.hex}
      </div>
    </div>
  );
}

function isLight(hex: string): boolean {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return false;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  // Perceived luminance (Rec. 601). >150 reads as a light surface for our wine text.
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 150;
}
