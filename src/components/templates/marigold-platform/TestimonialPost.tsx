import { CTABar } from "@/components/brand/CTABar";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface TestimonialPostProps {
  testimonialText: string;
  rating: number;
  attribution: string;
  isVerified?: boolean;
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L14.85 8.6L22 9.27L16.5 14.14L18.18 21.02L12 17.27L5.82 21.02L7.5 14.14L2 9.27L9.15 8.6L12 2Z"
        fill={filled ? "var(--gold)" : "transparent"}
        stroke="var(--gold)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VerifiedBadge() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 130,
        right: 60,
        width: 130,
        height: 130,
        border: "2px dashed var(--wine)",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontFamily: "'Syne', sans-serif",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: "var(--wine)",
        lineHeight: 1.3,
        padding: 14,
        transform: "rotate(-12deg)",
        background: "rgba(255,248,242,0.6)",
        zIndex: 5,
      }}
    >
      Verified<br />Marigold<br />User
    </div>
  );
}

export function TestimonialPost({
  testimonialText,
  rating,
  attribution,
  isVerified = true,
}: TestimonialPostProps) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--blush)",
        position: "relative",
        padding: "100px 90px 140px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <TapeStrip
        top={50}
        left="50%"
        rotation={-3}
        width={260}
        height={56}
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />

      <div
        style={{
          position: "absolute",
          top: 110,
          left: 60,
          fontFamily: "'Instrument Serif', serif",
          fontSize: 320,
          color: "var(--hot-pink)",
          opacity: 0.25,
          lineHeight: 0.7,
          fontStyle: "italic",
          zIndex: 1,
        }}
      >
        &ldquo;
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          marginTop: 20,
        }}
      >
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} filled={i < safeRating} />
          ))}
        </div>

        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 44,
            lineHeight: 1.3,
            color: "var(--wine)",
            marginBottom: 36,
            maxWidth: 820,
          }}
        >
          {testimonialText}
        </div>

        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "var(--mauve)",
          }}
        >
          {attribution}
        </div>
      </div>

      {isVerified && <VerifiedBadge />}

      <CTABar variant="overlay" />
    </div>
  );
}
