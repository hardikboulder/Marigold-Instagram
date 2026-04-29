import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface GuestManagementTip {
  headline: string;
  detail: string;
  aside: string;
}

export interface GuestManagementPostProps {
  guideTitle: string;
  tips: GuestManagementTip[];
}

const ASIDE_COLORS = ["var(--deep-pink)", "var(--gold)", "var(--pink)", "var(--mauve)"];
const NUMBER_BACKGROUNDS = ["var(--blush)", "var(--gold-light)", "var(--lavender)", "var(--peach)"];

export function GuestManagementPost({
  guideTitle,
  tips,
}: GuestManagementPostProps) {
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
      <PushPin variant="gold" top={56} left={80} />
      <PushPin variant="pink" top={56} right={80} />
      <TapeStrip
        top={120}
        left="50%"
        rotation={-3}
        width={240}
        height={48}
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />

      <div
        style={{
          paddingTop: 200,
          textAlign: "center",
          fontFamily: "'Syne', sans-serif",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "var(--deep-pink)",
          lineHeight: 1.2,
          padding: "200px 80px 0",
        }}
      >
        {guideTitle}
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 36,
          color: "var(--gold)",
          textAlign: "center",
          transform: "rotate(-2deg)",
          marginTop: 14,
        }}
      >
        the most political task in planning
      </div>

      <div
        style={{
          flex: 1,
          padding: "44px 70px 130px",
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
              borderRadius: 14,
              padding: "20px 24px",
              boxShadow: "0 4px 12px rgba(75,21,40,0.08)",
              border: "1px solid rgba(212,168,83,0.18)",
              display: "flex",
              gap: 18,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: NUMBER_BACKGROUNDS[i % NUMBER_BACKGROUNDS.length],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                fontSize: 32,
                color: "var(--wine)",
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: 28,
                  fontWeight: 400,
                  color: "var(--wine)",
                  lineHeight: 1.15,
                  marginBottom: 6,
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
                    transform: "rotate(-1deg)",
                  }}
                >
                  {tip.aside}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
