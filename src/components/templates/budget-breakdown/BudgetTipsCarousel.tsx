import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

export interface BudgetTip {
  title: string;
  detail: string;
}

export interface BudgetTipsCarouselProps {
  tips: BudgetTip[];
  /**
   * 0 = cover, 1..5 = tip pairs (2 tips per slide), 6 = close.
   * Defaults to 0.
   */
  slideIndex?: number;
  coverTitle?: string;
  coverSubtitle?: string;
  closeHeadline?: string;
  closeSubtitle?: string;
}

const TIP_ICONS = ["✦", "₹", "✕", "✓", "♥", "*", "→", "~", "·", "+"];

function CoverSlide({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--wine)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 80px 160px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 12%, rgba(212,168,83,0.22), transparent 55%), radial-gradient(circle at 82% 88%, rgba(237,147,177,0.16), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <PushPin variant="gold" top={60} left={70} />
      <PushPin variant="pink" top={60} right={70} />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: 10,
          textTransform: "uppercase",
          color: "var(--hot-pink)",
          position: "relative",
          zIndex: 2,
          marginBottom: 18,
        }}
      >
        Budget Breakdown
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 220,
          lineHeight: 0.9,
          color: "var(--gold)",
          letterSpacing: -4,
          position: "relative",
          zIndex: 2,
        }}
      >
        10
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 76,
          lineHeight: 1.05,
          color: "var(--cream)",
          textAlign: "center",
          maxWidth: 880,
          position: "relative",
          zIndex: 2,
          marginTop: 10,
          marginBottom: 28,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 50,
          color: "var(--hot-pink)",
          transform: "rotate(-2deg)",
          textAlign: "center",
          maxWidth: 820,
          position: "relative",
          zIndex: 2,
        }}
      >
        {subtitle}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 110,
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 6,
          color: "rgba(245,230,200,0.5)",
        }}
      >
        Swipe →
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}

function TipPairSlide({
  pairIndex,
  totalPairs,
  tipA,
  tipB,
}: {
  pairIndex: number;
  totalPairs: number;
  tipA: BudgetTip | undefined;
  tipB: BudgetTip | undefined;
}) {
  const numA = pairIndex * 2 + 1;
  const numB = pairIndex * 2 + 2;

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
        padding: "90px 90px 160px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "var(--wine)",
          }}
        >
          Budget Tips
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "var(--mauve)",
          }}
        >
          {pairIndex + 1} / {totalPairs}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 30,
        }}
      >
        {[
          { tip: tipA, num: numA, accent: "var(--pink)", bg: "var(--blush)" },
          { tip: tipB, num: numB, accent: "var(--gold)", bg: "var(--gold-light)" },
        ].map(({ tip, num, accent, bg }) =>
          tip ? (
            <div
              key={num}
              style={{
                display: "flex",
                gap: 28,
                alignItems: "stretch",
                background: bg,
                padding: "28px 32px",
                borderRadius: 18,
                border: `2px solid ${accent}`,
                boxShadow: "0 4px 16px rgba(75,21,40,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    background: accent,
                    color: "var(--cream)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Instrument Serif', serif",
                    fontStyle: "italic",
                    fontSize: 56,
                    lineHeight: 1,
                    fontWeight: 400,
                  }}
                >
                  {num}
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontStyle: "italic",
                    fontSize: 38,
                    color: "var(--wine)",
                    lineHeight: 1.1,
                  }}
                >
                  {tip.title}
                </div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 20,
                    fontWeight: 400,
                    color: "var(--wine)",
                    lineHeight: 1.35,
                    opacity: 0.85,
                  }}
                >
                  {tip.detail}
                </div>
              </div>
              <div
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 60,
                  color: accent,
                  alignSelf: "flex-start",
                  lineHeight: 1,
                }}
              >
                {TIP_ICONS[(num - 1) % TIP_ICONS.length]}
              </div>
            </div>
          ) : (
            <div key={num} />
          ),
        )}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}

function CloseSlide({
  headline,
  subtitle,
}: {
  headline: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--hot-pink)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 80px 180px",
      }}
    >
      <PushPin variant="gold" top={60} left={70} />
      <PushPin variant="pink" top={60} right={70} />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: "var(--wine)",
          marginBottom: 28,
        }}
      >
        Coming Soon
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 96,
          lineHeight: 1.0,
          color: "var(--cream)",
          textAlign: "center",
          maxWidth: 880,
          marginBottom: 22,
        }}
      >
        {headline}
      </div>

      <div
        style={{
          width: 80,
          height: 2,
          background: "var(--wine)",
          opacity: 0.6,
          marginBottom: 28,
        }}
      />

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 52,
          color: "var(--wine)",
          transform: "rotate(-2deg)",
          textAlign: "center",
          maxWidth: 820,
          marginBottom: 36,
        }}
      >
        {subtitle}
      </div>

      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "var(--cream)",
          background: "var(--wine)",
          padding: "16px 36px",
          borderRadius: 999,
        }}
      >
        Get Notified →
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}

export function BudgetTipsCarousel({
  tips,
  slideIndex = 0,
  coverTitle = "Ways to Save Without Sacrificing",
  coverSubtitle = "the tips your planner will actually back",
  closeHeadline = "The Marigold Budget Tracker",
  closeSubtitle = "coming soon to the app — get on the list",
}: BudgetTipsCarouselProps) {
  const totalPairs = 5;
  const closeIndex = totalPairs + 1;
  const safeIndex = Math.max(0, Math.min(slideIndex, closeIndex));

  if (safeIndex === 0) {
    return <CoverSlide title={coverTitle} subtitle={coverSubtitle} />;
  }
  if (safeIndex === closeIndex) {
    return <CloseSlide headline={closeHeadline} subtitle={closeSubtitle} />;
  }
  const pairIdx = safeIndex - 1;
  return (
    <TipPairSlide
      pairIndex={pairIdx}
      totalPairs={totalPairs}
      tipA={tips[pairIdx * 2]}
      tipB={tips[pairIdx * 2 + 1]}
    />
  );
}
