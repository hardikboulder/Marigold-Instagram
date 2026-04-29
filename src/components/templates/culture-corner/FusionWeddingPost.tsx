import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

import { CultureIcon } from "./CultureIcons";
import type { RegionColor } from "./RegionalSpotlightCarousel";

const COLOR_VARS: Record<RegionColor, string> = {
  wine: "var(--wine)",
  "deep-pink": "var(--deep-pink)",
  "hot-pink": "var(--hot-pink)",
  pink: "var(--pink)",
  gold: "var(--gold)",
  "gold-light": "var(--gold-light)",
  mint: "var(--mint)",
  peach: "var(--peach)",
  lavender: "var(--lavender)",
  sky: "var(--sky)",
  blush: "var(--blush)",
  cream: "var(--cream)",
};

const LIGHT_COLORS: RegionColor[] = [
  "gold-light",
  "mint",
  "peach",
  "lavender",
  "sky",
  "blush",
  "cream",
];

function isLight(color: RegionColor) {
  return LIGHT_COLORS.includes(color);
}

export interface FusionWeddingPostProps {
  tradition1: string;
  tradition2: string;
  color1?: RegionColor;
  color2?: RegionColor;
  blendingTips: string[];
  annotation?: string;
}

export function FusionWeddingPost({
  tradition1,
  tradition2,
  color1 = "wine",
  color2 = "deep-pink",
  blendingTips,
  annotation = "two families, two traditions, one (very long) ceremony",
}: FusionWeddingPostProps) {
  const tips = blendingTips.slice(0, 4);

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
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "50%",
          background: COLOR_VARS[color1],
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "50%",
          background: COLOR_VARS[color2],
          clipPath: "polygon(8% 0, 100% 0, 100% 100%, 0 100%)",
        }}
      />

      <PushPin variant="gold" top={56} left={70} />
      <PushPin variant="gold" top={56} right={70} />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "120px 80px 0",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 18,
            background: "rgba(75,21,40,0.78)",
            padding: "14px 32px",
            borderRadius: 999,
            border: "1px solid rgba(212,168,83,0.55)",
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "var(--gold)",
            }}
          >
            Fusion Wedding Guide
          </div>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px 70px 200px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            marginBottom: 36,
            position: "relative",
          }}
        >
          <span
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              fontSize: 96,
              lineHeight: 1.0,
              color: isLight(color1) ? "var(--wine)" : "var(--cream)",
              textShadow: isLight(color1)
                ? "none"
                : "0 2px 8px rgba(0,0,0,0.18)",
            }}
          >
            {tradition1}
          </span>

          <div
            style={{
              width: 86,
              height: 86,
              borderRadius: "50%",
              background: "var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Instrument Serif', serif",
              fontSize: 72,
              color: "var(--wine)",
              boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
              border: "3px solid var(--cream)",
            }}
          >
            +
          </div>

          <span
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              fontSize: 96,
              lineHeight: 1.0,
              color: isLight(color2) ? "var(--wine)" : "var(--cream)",
              textShadow: isLight(color2)
                ? "none"
                : "0 2px 8px rgba(0,0,0,0.18)",
            }}
          >
            {tradition2}
          </span>
        </div>

        <div
          style={{
            background: "var(--cream)",
            border: "1px solid rgba(212,168,83,0.55)",
            borderRadius: 16,
            padding: "32px 40px",
            width: "100%",
            maxWidth: 880,
            boxShadow: "0 14px 32px rgba(75,21,40,0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 22,
            }}
          >
            <CultureIcon type="paisley" size={28} color="var(--gold)" />
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "var(--wine)",
              }}
            >
              How to blend
            </div>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "var(--gold)",
                opacity: 0.5,
              }}
            />
          </div>

          <ol
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {tips.map((tip, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    flex: "0 0 36px",
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--wine)",
                    color: "var(--gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: 16,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 22,
                    fontWeight: 500,
                    lineHeight: 1.35,
                    color: "var(--wine)",
                  }}
                >
                  {tip}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 40,
            color: "var(--gold)",
            transform: "rotate(-2deg)",
            marginTop: 28,
            textAlign: "center",
            maxWidth: 860,
            textShadow: "0 2px 8px rgba(0,0,0,0.18)",
          }}
        >
          {annotation}
        </div>
      </div>

      <CTABar variant="overlay" handleText="CULTURE CORNER" />
    </div>
  );
}
