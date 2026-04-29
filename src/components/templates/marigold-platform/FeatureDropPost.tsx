import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

export type FeatureLabel = "new" | "spotlight" | "coming-soon";

const FEATURE_LABEL_TEXT: Record<FeatureLabel, string> = {
  new: "NEW ON THE MARIGOLD",
  spotlight: "FEATURE SPOTLIGHT",
  "coming-soon": "COMING SOON",
};

export interface FeatureDropPostProps {
  featureLabel: FeatureLabel;
  featureName: string;
  benefits: string[];
  annotation: string;
  ctaText: string;
  mockupImageUrl?: string;
}

function GoldCheck() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      style={{ flexShrink: 0, marginTop: 2 }}
    >
      <circle cx="14" cy="14" r="13" fill="var(--gold-light)" stroke="var(--gold)" strokeWidth="2" />
      <path
        d="M8 14.5L12 18.5L20 10"
        stroke="var(--wine)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FeatureDropPost({
  featureLabel,
  featureName,
  benefits,
  annotation,
  ctaText,
  mockupImageUrl,
}: FeatureDropPostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background:
          "radial-gradient(circle at 50% 38%, #E47097 0%, var(--pink) 55%, #B84970 100%)",
        position: "relative",
        overflow: "hidden",
        padding: "100px 80px 140px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <PushPin variant="gold" top={40} left={50} />
      <PushPin variant="gold" top={40} right={50} />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 6,
          color: "var(--wine)",
          marginBottom: 18,
        }}
      >
        {FEATURE_LABEL_TEXT[featureLabel]}
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 88,
          color: "var(--cream)",
          lineHeight: 1,
          textAlign: "center",
          marginBottom: 36,
          letterSpacing: -1,
          maxWidth: 900,
        }}
      >
        {featureName}
      </div>

      <div
        style={{
          width: 360,
          height: 220,
          background: "var(--cream)",
          border: "3px solid var(--wine)",
          borderRadius: 18,
          marginBottom: 32,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 10px 24px rgba(75,21,40,0.25)",
          position: "relative",
        }}
      >
        <div
          style={{
            height: 26,
            background: "var(--wine)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            paddingLeft: 12,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--hot-pink)" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold-light)" }} />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: mockupImageUrl ? `url(${mockupImageUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {!mockupImageUrl && (
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "var(--mauve)",
              }}
            >
              UI preview
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginBottom: 28,
          alignSelf: "center",
        }}
      >
        {benefits.map((benefit, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22,
              fontWeight: 500,
              color: "var(--cream)",
              maxWidth: 720,
            }}
          >
            <GoldCheck />
            <div>{benefit}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 38,
          color: "var(--gold-light)",
          transform: "rotate(-2deg)",
          textAlign: "center",
          maxWidth: 720,
        }}
      >
        {annotation}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 110,
          left: "50%",
          transform: "translateX(-50%) rotate(-1deg)",
          background: "var(--cream)",
          color: "var(--deep-pink)",
          fontFamily: "'Syne', sans-serif",
          fontSize: 20,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 2,
          padding: "16px 36px",
          boxShadow: "4px 4px 0 var(--wine)",
        }}
      >
        {ctaText}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
