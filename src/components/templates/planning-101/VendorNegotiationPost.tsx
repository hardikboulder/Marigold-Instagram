import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

export interface NegotiationTip {
  headline: string;
  detail: string;
  aside: string;
}

export interface VendorNegotiationPostProps {
  vendorCategory: string;
  tips: NegotiationTip[];
  bottomLine: string;
}

const CARD_ROTATIONS = [-2, 1.5, -1, 2];
const ASIDE_COLORS = ["var(--deep-pink)", "var(--gold)", "var(--pink)", "var(--mauve)"];

export function VendorNegotiationPost({
  vendorCategory,
  tips,
  bottomLine,
}: VendorNegotiationPostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--blush)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PushPin variant="pink" top={56} left={80} />
      <PushPin variant="gold" top={56} right={80} />

      <div
        style={{
          padding: "120px 80px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "var(--deep-pink)",
          }}
        >
          How To Negotiate
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 56,
            color: "var(--wine)",
            lineHeight: 1.05,
            marginTop: 8,
          }}
        >
          {vendorCategory}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: "20px 70px 30px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {tips.map((tip, i) => (
          <div
            key={i}
            style={{
              background: "white",
              borderRadius: 10,
              padding: "20px 26px",
              boxShadow: "0 6px 14px rgba(75,21,40,0.12), 0 1px 0 rgba(212,168,83,0.18)",
              transform: `rotate(${CARD_ROTATIONS[i % CARD_ROTATIONS.length]}deg)`,
              transformOrigin: "center center",
              position: "relative",
            }}
          >
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: 6,
              }}
            >
              Tip {String(i + 1).padStart(2, "0")}
            </div>
            <div
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: 30,
                color: "var(--wine)",
                lineHeight: 1.1,
                marginBottom: 8,
              }}
            >
              {tip.headline}
            </div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 18,
                lineHeight: 1.4,
                color: "var(--mauve)",
                marginBottom: 6,
              }}
            >
              {tip.detail}
            </div>
            {tip.aside && (
              <div
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 24,
                  color: ASIDE_COLORS[i % ASIDE_COLORS.length],
                }}
              >
                {tip.aside}
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          padding: "0 80px 130px",
          fontFamily: "'Caveat', cursive",
          fontSize: 36,
          color: "var(--wine)",
          textAlign: "center",
          transform: "rotate(-1deg)",
        }}
      >
        {bottomLine}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
