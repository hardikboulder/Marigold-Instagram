import type { ReactNode } from "react";
import { CTABar } from "@/components/brand/CTABar";

export interface BrideConnectExplainerCarouselProps {
  coverHeadline: string;
  coverSubtitle: string;
  createProfileBody: string;
  matchedBody: string;
  connectBody: string;
  testimonialQuote: string;
  statsNumber: string;
  statsLabel: string;
  closeHeadline: string;
  /** 1 = cover, 2-5 = steps, 6 = close. */
  slideIndex?: number;
}

function SlideFrame({
  background,
  color = "var(--wine)",
  children,
}: {
  background: string;
  color?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background,
        color,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function SlideEyebrow({ children, color }: { children: ReactNode; color: string }) {
  return (
    <div
      style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 18,
        fontWeight: 800,
        letterSpacing: 8,
        textTransform: "uppercase",
        color,
        marginBottom: 24,
      }}
    >
      {children}
    </div>
  );
}

function StepNumber({ n, accent }: { n: number; accent: string }) {
  return (
    <div
      style={{
        width: 84,
        height: 84,
        borderRadius: "50%",
        background: accent,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Syne', sans-serif",
        fontSize: 32,
        fontWeight: 800,
        letterSpacing: 1,
        marginBottom: 28,
        boxShadow: "0 6px 14px rgba(75,21,40,0.18)",
      }}
    >
      {String(n).padStart(2, "0")}
    </div>
  );
}

function CoverSlide({
  headline,
  subtitle,
}: {
  headline: string;
  subtitle: string;
}) {
  return (
    <SlideFrame background="var(--blush)">
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "150px 80px 200px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <SlideEyebrow color="var(--pink)">BRIDE CONNECT</SlideEyebrow>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 92,
            color: "var(--wine)",
            lineHeight: 1.0,
            marginBottom: 32,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 36,
            color: "var(--mauve)",
            lineHeight: 1.3,
            maxWidth: 760,
            transform: "rotate(-1deg)",
          }}
        >
          {subtitle}
        </div>
      </div>
      <CTABar variant="overlay" handleText="SWIPE TO LEARN →" />
    </SlideFrame>
  );
}

function CreateProfileSlide({ body }: { body: string }) {
  return (
    <SlideFrame background="var(--cream)">
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "120px 80px 180px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <StepNumber n={1} accent="var(--pink)" />
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 72,
            color: "var(--wine)",
            lineHeight: 1.05,
            marginBottom: 24,
          }}
        >
          Create your profile
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 24,
            lineHeight: 1.45,
            color: "var(--mauve)",
            marginBottom: 32,
            maxWidth: 800,
          }}
        >
          {body}
        </div>

        {/* Mockup mini-card preview */}
        <div
          style={{
            background: "white",
            borderRadius: 24,
            padding: "20px 24px",
            boxShadow: "0 12px 28px rgba(75,21,40,0.12)",
            display: "flex",
            alignItems: "center",
            gap: 18,
            maxWidth: 520,
            border: "1px solid rgba(212,83,126,0.18)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--blush)",
              border: "3px solid var(--pink)",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                fontSize: 24,
                color: "var(--wine)",
              }}
            >
              Priya, 27
            </div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13,
                color: "var(--mauve)",
                letterSpacing: 1,
              }}
            >
              JAIPUR · DEC 2026
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {["Vendor Recs", "Lehenga Buddy"].map((t) => (
                <span
                  key={t}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: "var(--blush)",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--wine)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <CTABar variant="overlay" handleText="BRIDE CONNECT" />
    </SlideFrame>
  );
}

function MatchedSlide({ body }: { body: string }) {
  return (
    <SlideFrame background="var(--cream)">
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "120px 80px 180px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <StepNumber n={2} accent="var(--gold)" />
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 72,
            color: "var(--wine)",
            lineHeight: 1.05,
            marginBottom: 24,
          }}
        >
          Get matched
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 24,
            lineHeight: 1.45,
            color: "var(--mauve)",
            marginBottom: 36,
            maxWidth: 800,
          }}
        >
          {body}
        </div>

        {/* Two cards sliding together */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
          }}
        >
          {[
            { name: "Priya", city: "JAIPUR", offset: -16, rotate: -6, color: "var(--pink)" },
            { name: "Anika", city: "JAIPUR", offset: 16, rotate: 6, color: "var(--gold)" },
          ].map((c) => (
            <div
              key={c.name}
              style={{
                background: "white",
                borderRadius: 22,
                padding: "18px 22px",
                boxShadow: "0 16px 32px rgba(75,21,40,0.16)",
                transform: `translateX(${c.offset}px) rotate(${c.rotate}deg)`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: `2px solid ${c.color}`,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--blush)",
                  border: `3px solid ${c.color}`,
                }}
              />
              <div>
                <div
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontStyle: "italic",
                    fontSize: 22,
                    color: "var(--wine)",
                  }}
                >
                  {c.name}
                </div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 1.5,
                    color: "var(--mauve)",
                  }}
                >
                  {c.city} · DEC 2026
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <CTABar variant="overlay" handleText="BRIDE CONNECT" />
    </SlideFrame>
  );
}

function ConnectSlide({ body }: { body: string }) {
  const features: { icon: string; label: string }[] = [
    { icon: "💬", label: "Chat" },
    { icon: "💛", label: "Save" },
    { icon: "🛍️", label: "Shop together" },
    { icon: "📅", label: "Coordinate" },
  ];

  return (
    <SlideFrame background="var(--cream)">
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "120px 80px 180px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <StepNumber n={3} accent="var(--pink)" />
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 64,
            color: "var(--wine)",
            lineHeight: 1.05,
            marginBottom: 22,
          }}
        >
          Connect & plan together
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22,
            lineHeight: 1.45,
            color: "var(--mauve)",
            marginBottom: 36,
            maxWidth: 800,
          }}
        >
          {body}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
            maxWidth: 580,
          }}
        >
          {features.map((f) => (
            <div
              key={f.label}
              style={{
                background: "white",
                borderRadius: 18,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                border: "1px solid rgba(212,83,126,0.18)",
                boxShadow: "0 6px 14px rgba(75,21,40,0.08)",
              }}
            >
              <div style={{ fontSize: 32 }}>{f.icon}</div>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--wine)",
                }}
              >
                {f.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      <CTABar variant="overlay" handleText="BRIDE CONNECT" />
    </SlideFrame>
  );
}

function RealConnectionsSlide({
  testimonial,
  statsNumber,
  statsLabel,
}: {
  testimonial: string;
  statsNumber: string;
  statsLabel: string;
}) {
  return (
    <SlideFrame background="var(--blush)">
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "150px 80px 200px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <SlideEyebrow color="var(--pink)">BRIDE CONNECT</SlideEyebrow>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 6,
            color: "var(--wine)",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          REAL CONNECTIONS
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 50,
            color: "var(--wine)",
            lineHeight: 1.2,
            maxWidth: 860,
            marginBottom: 36,
          }}
        >
          “{testimonial}”
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            padding: "14px 28px",
            background: "white",
            borderRadius: 999,
            boxShadow: "0 8px 18px rgba(75,21,40,0.10)",
          }}
        >
          <div
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 56,
              color: "var(--pink)",
              lineHeight: 1,
            }}
          >
            {statsNumber}
          </div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 3,
              color: "var(--wine)",
              textTransform: "uppercase",
            }}
          >
            {statsLabel}
          </div>
        </div>
      </div>
      <CTABar variant="overlay" handleText="BRIDE CONNECT" />
    </SlideFrame>
  );
}

function CloseSlide({ headline }: { headline: string }) {
  return (
    <SlideFrame background="var(--wine)" color="var(--cream)">
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "160px 80px 220px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <SlideEyebrow color="rgba(255,248,242,0.55)">BRIDE CONNECT</SlideEyebrow>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 92,
            color: "var(--cream)",
            lineHeight: 1.05,
            marginBottom: 36,
            maxWidth: 880,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            padding: "20px 44px",
            borderRadius: 999,
            background: "var(--pink)",
            color: "white",
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 5,
            textTransform: "uppercase",
            boxShadow: "0 10px 24px rgba(212,83,126,0.35)",
          }}
        >
          Find your match
        </div>
      </div>
      <CTABar variant="light" />
    </SlideFrame>
  );
}

export function BrideConnectExplainerCarousel({
  coverHeadline,
  coverSubtitle,
  createProfileBody,
  matchedBody,
  connectBody,
  testimonialQuote,
  statsNumber,
  statsLabel,
  closeHeadline,
  slideIndex = 1,
}: BrideConnectExplainerCarouselProps) {
  const idx = Math.min(6, Math.max(1, slideIndex));

  if (idx === 1) {
    return <CoverSlide headline={coverHeadline} subtitle={coverSubtitle} />;
  }
  if (idx === 2) {
    return <CreateProfileSlide body={createProfileBody} />;
  }
  if (idx === 3) {
    return <MatchedSlide body={matchedBody} />;
  }
  if (idx === 4) {
    return <ConnectSlide body={connectBody} />;
  }
  if (idx === 5) {
    return (
      <RealConnectionsSlide
        testimonial={testimonialQuote}
        statsNumber={statsNumber}
        statsLabel={statsLabel}
      />
    );
  }
  return <CloseSlide headline={closeHeadline} />;
}
