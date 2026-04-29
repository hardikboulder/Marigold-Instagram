import type { CSSProperties } from "react";

export type CTABarVariant = "default" | "overlay" | "light";

interface CTABarProps {
  variant?: CTABarVariant;
  handleText?: string;
  logoColor?: string;
  handleColor?: string;
  style?: CSSProperties;
}

interface VariantStyle {
  background: string;
  padding: string;
  logoSize: number;
  handleSize: number;
  defaultLogoColor: string;
  defaultHandleColor: string;
}

const VARIANT_STYLES: Record<CTABarVariant, VariantStyle> = {
  // Story-size CTA bar (matches `.tpl-cta-bar` from the HTML reference).
  default: {
    background: "var(--wine)",
    padding: "48px 60px",
    logoSize: 44,
    handleSize: 26,
    defaultLogoColor: "var(--hot-pink)",
    defaultHandleColor: "rgba(255,255,255,0.4)",
  },
  // Post-size translucent overlay used on 1080×1080 templates.
  overlay: {
    background: "rgba(75,21,40,0.9)",
    padding: "28px 48px",
    logoSize: 36,
    handleSize: 18,
    defaultLogoColor: "var(--hot-pink)",
    defaultHandleColor: "rgba(255,255,255,0.3)",
  },
  // Light-on-wine palette used on the Confessional Submit slide.
  light: {
    background: "var(--wine)",
    padding: "48px 60px",
    logoSize: 44,
    handleSize: 26,
    defaultLogoColor: "var(--gold-light)",
    defaultHandleColor: "rgba(255,255,255,0.3)",
  },
};

export function CTABar({
  variant = "default",
  handleText = "@themarigold",
  logoColor,
  handleColor,
  style,
}: CTABarProps) {
  const v = VARIANT_STYLES[variant];
  const resolvedLogo = logoColor ?? v.defaultLogoColor;
  const resolvedHandle = handleColor ?? v.defaultHandleColor;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: v.background,
        padding: v.padding,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: v.logoSize,
          color: resolvedLogo,
          lineHeight: 1,
        }}
      >
        The <i style={{ fontStyle: "italic" }}>Marigold</i>
      </div>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: v.handleSize,
          fontWeight: 600,
          color: resolvedHandle,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {handleText}
      </div>
    </div>
  );
}
