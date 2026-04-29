import { CTABar } from "@/components/brand/CTABar";
import { PushPin, type PushPinVariant } from "@/components/brand/PushPin";

export type CeremonyHeaderColor =
  | "mint"
  | "gold"
  | "pink"
  | "wine"
  | "gold-light"
  | "lavender"
  | "peach"
  | "blush";

export interface CeremonyGuidePostProps {
  ceremonyName: string;
  headerColor: CeremonyHeaderColor;
  whatItIs: string;
  keyTraditions: string[];
  typicalDuration: string;
  proTip: string;
}

interface HeaderTheme {
  background: string;
  ceremonyColor: string;
  labelColor: string;
  proTipColor: string;
  pin: PushPinVariant;
}

const HEADER_THEMES: Record<CeremonyHeaderColor, HeaderTheme> = {
  mint: {
    background: "var(--mint)",
    ceremonyColor: "var(--wine)",
    labelColor: "var(--deep-pink)",
    proTipColor: "var(--deep-pink)",
    pin: "gold",
  },
  gold: {
    background: "var(--gold)",
    ceremonyColor: "var(--wine)",
    labelColor: "var(--cream)",
    proTipColor: "var(--gold)",
    pin: "gold",
  },
  pink: {
    background: "var(--pink)",
    ceremonyColor: "var(--cream)",
    labelColor: "var(--gold-light)",
    proTipColor: "var(--hot-pink)",
    pin: "pink",
  },
  wine: {
    background: "var(--wine)",
    ceremonyColor: "var(--cream)",
    labelColor: "var(--gold)",
    proTipColor: "var(--hot-pink)",
    pin: "gold",
  },
  "gold-light": {
    background: "var(--gold-light)",
    ceremonyColor: "var(--wine)",
    labelColor: "var(--deep-pink)",
    proTipColor: "var(--gold)",
    pin: "gold",
  },
  lavender: {
    background: "var(--lavender)",
    ceremonyColor: "var(--wine)",
    labelColor: "var(--deep-pink)",
    proTipColor: "var(--deep-pink)",
    pin: "blue",
  },
  peach: {
    background: "var(--peach)",
    ceremonyColor: "var(--wine)",
    labelColor: "var(--deep-pink)",
    proTipColor: "var(--deep-pink)",
    pin: "pink",
  },
  blush: {
    background: "var(--blush)",
    ceremonyColor: "var(--wine)",
    labelColor: "var(--deep-pink)",
    proTipColor: "var(--pink)",
    pin: "pink",
  },
};

export function CeremonyGuidePost({
  ceremonyName,
  headerColor,
  whatItIs,
  keyTraditions,
  typicalDuration,
  proTip,
}: CeremonyGuidePostProps) {
  const theme = HEADER_THEMES[headerColor];

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
          height: "30%",
          background: theme.background,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 60px",
        }}
      >
        <PushPin variant={theme.pin} top={36} left="50%" style={{ transform: "translateX(-50%)" }} />

        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: theme.labelColor,
            marginBottom: 16,
          }}
        >
          Ceremony Decoded
        </div>

        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 140,
            lineHeight: 0.95,
            color: theme.ceremonyColor,
            textAlign: "center",
            letterSpacing: -2,
          }}
        >
          {ceremonyName}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: "56px 80px 140px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <Section label="What it is">
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 24,
              lineHeight: 1.45,
              color: "var(--wine)",
              fontWeight: 400,
            }}
          >
            {whatItIs}
          </div>
        </Section>

        <Section label="Key traditions">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {keyTraditions.map((tradition, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 22,
                  lineHeight: 1.4,
                  color: "var(--wine)",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: theme.background,
                    border: "1.5px solid var(--gold)",
                    marginTop: 12,
                    flexShrink: 0,
                  }}
                />
                <div>{tradition}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section label="Typical duration">
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--wine)",
            }}
          >
            {typicalDuration}
          </div>
        </Section>

        <div
          style={{
            marginTop: 4,
            fontFamily: "'Caveat', cursive",
            fontSize: 38,
            color: theme.proTipColor,
            transform: "rotate(-1.5deg)",
            lineHeight: 1.15,
          }}
        >
          pro tip — {proTip}
        </div>
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "var(--gold)",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
