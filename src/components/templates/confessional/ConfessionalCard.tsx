import { CTABar } from "@/components/brand/CTABar";
import { StickyNote, type StickyNoteColor } from "@/components/brand/StickyNote";
import type { PushPinVariant } from "@/components/brand/PushPin";

export type ConfessionalVariant = StickyNoteColor;

export interface ConfessionalCardProps {
  confessionNumber: number;
  confessionText: string;
  attribution: string;
  variant: ConfessionalVariant;
}

interface VariantConfig {
  pin: PushPinVariant;
  rotation: number;
  labelColor: string;
  lined: boolean;
  noiseOpacity: number;
}

const VARIANTS: Record<ConfessionalVariant, VariantConfig> = {
  blush: {
    pin: "pink",
    rotation: -2,
    labelColor: "var(--pink)",
    lined: false,
    noiseOpacity: 0.5,
  },
  gold: {
    pin: "gold",
    rotation: 1.5,
    labelColor: "var(--gold)",
    lined: true,
    noiseOpacity: 0.3,
  },
  lavender: {
    pin: "blue",
    rotation: -1,
    labelColor: "var(--deep-pink)",
    lined: false,
    noiseOpacity: 0.3,
  },
};

const NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='c'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='60' height='60' filter='url(%23c)' opacity='0.02'/%3E%3C/svg%3E\")";

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function ConfessionalCard({
  confessionNumber,
  confessionText,
  attribution,
  variant,
}: ConfessionalCardProps) {
  const cfg = VARIANTS[variant];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--cream)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: NOISE_SVG,
          opacity: cfg.noiseOpacity,
        }}
      />

      <StickyNote
        color={variant}
        rotation={cfg.rotation}
        pinVariant={cfg.pin}
        lined={cfg.lined}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 4,
            color: cfg.labelColor,
            marginBottom: 24,
          }}
        >
          CONFESSION #{pad2(confessionNumber)}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 64,
            lineHeight: 1.3,
            color: "var(--wine)",
            fontWeight: 500,
          }}
        >
          {confessionText}
        </div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 24,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: "var(--mauve)",
            marginTop: 32,
          }}
        >
          {attribution}
        </div>
      </StickyNote>

      <CTABar />
    </div>
  );
}
