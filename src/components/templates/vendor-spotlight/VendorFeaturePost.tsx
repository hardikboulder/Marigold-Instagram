import { CTABar } from "@/components/brand/CTABar";

export type VendorAccentColor = "gold" | "pink" | "lavender";

export interface VendorFeaturePostProps {
  vendorCategory: string;
  vendorName: string;
  vendorLocation: string;
  vendorQuote: string;
  imageUrl?: string;
  accentColor?: VendorAccentColor;
}

const ACCENT_VARS: Record<VendorAccentColor, string> = {
  gold: "var(--gold)",
  pink: "var(--hot-pink)",
  lavender: "var(--lavender)",
};

export function VendorFeaturePost({
  vendorCategory,
  vendorName,
  vendorLocation,
  vendorQuote,
  imageUrl,
  accentColor = "gold",
}: VendorFeaturePostProps) {
  const accent = ACCENT_VARS[accentColor];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--cream)",
        position: "relative",
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
          width: 6,
          background: accent,
          zIndex: 6,
        }}
      />

      <div
        style={{
          flex: "0 0 60%",
          background: "var(--blush)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={vendorName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 32,
              border: "3px dashed rgba(75,21,40,0.25)",
              borderRadius: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              color: "var(--mauve)",
              background: "var(--cream)",
            }}
          >
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: "uppercase",
                opacity: 0.7,
              }}
            >
              VENDOR PHOTO
            </div>
            <div
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 40,
                color: "var(--wine)",
                opacity: 0.55,
              }}
            >
              drag photo here
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          flex: "0 0 40%",
          background: "var(--wine)",
          padding: "60px 72px 0 72px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          color: "var(--cream)",
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: accent,
            marginBottom: 14,
          }}
        >
          {vendorCategory}
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 70,
            lineHeight: 1.05,
            color: "var(--cream)",
            marginBottom: 14,
          }}
        >
          {vendorName}
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: 1,
            color: "rgba(255,248,242,0.7)",
            marginBottom: 22,
          }}
        >
          {vendorLocation}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 38,
            color: accent,
            transform: "rotate(-1.5deg)",
            maxWidth: 760,
          }}
        >
          &ldquo;{vendorQuote}&rdquo;
        </div>
      </div>

      <CTABar variant="overlay" handleText="VENDOR SPOTLIGHT" />
    </div>
  );
}
