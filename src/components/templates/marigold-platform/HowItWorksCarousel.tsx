import type { ReactNode } from "react";
import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface HowItWorksStep {
  number: number;
  title: string;
  description: string;
  mockupImageUrl?: string;
}

export interface HowItWorksCarouselProps {
  steps: HowItWorksStep[];
  /** 0 = cover, 1..N = step slides, N+1 = close. */
  slideIndex?: number;
  ctaText?: string;
}

const DOT_GRID =
  "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.2' fill='%23D4A853' opacity='0.18'/%3E%3C/svg%3E\")";

function SlideFrame({
  background,
  children,
}: {
  background: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function MockupFrame({ imageUrl }: { imageUrl?: string }) {
  return (
    <div
      style={{
        width: 480,
        height: 300,
        background: "white",
        border: "3px solid var(--wine)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(75,21,40,0.18)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 28,
          background: "var(--wine)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          paddingLeft: 12,
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--hot-pink)" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--gold)" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--gold-light)" }} />
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          background: imageUrl ? undefined : "var(--cream)",
        }}
      >
        {!imageUrl && (
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 22,
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
  );
}

function CoverSlide({ stepCount }: { stepCount: number }) {
  return (
    <SlideFrame background="var(--pink)">
      <PushPin variant="gold" top={60} left={70} />
      <PushPin variant="gold" top={60} right={70} />
      <TapeStrip
        top={140}
        left="50%"
        rotation={-3}
        width={260}
        height={48}
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "200px 80px 160px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "var(--gold-light)",
            marginBottom: 32,
          }}
        >
          The Marigold
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 110,
            color: "var(--cream)",
            lineHeight: 1,
            marginBottom: 24,
            letterSpacing: -2,
          }}
        >
          how it <i style={{ fontStyle: "italic", color: "var(--gold-light)" }}>works</i>
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 52,
            color: "var(--gold-light)",
            transform: "rotate(-2deg)",
          }}
        >
          in {stepCount} steps
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
            color: "var(--gold-light)",
            opacity: 0.7,
          }}
        >
          Swipe →
        </div>
      </div>
      <CTABar variant="overlay" />
    </SlideFrame>
  );
}

function StepSlide({ step, total }: { step: HowItWorksStep; total: number }) {
  return (
    <SlideFrame background="var(--cream)">
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: DOT_GRID,
          opacity: 0.5,
        }}
      />
      <PushPin variant="pink" top={60} left={70} />

      <div
        style={{
          position: "absolute",
          top: 80,
          right: 70,
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "var(--mauve)",
          zIndex: 4,
        }}
      >
        Step {step.number} / {total}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "150px 80px 160px",
          display: "flex",
          flexDirection: "column",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 220,
            color: "var(--pink)",
            lineHeight: 0.85,
            marginBottom: 20,
            letterSpacing: -6,
          }}
        >
          {String(step.number).padStart(2, "0")}
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 56,
            color: "var(--wine)",
            lineHeight: 1.05,
            marginBottom: 18,
            maxWidth: 880,
          }}
        >
          {step.title}
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 24,
            lineHeight: 1.4,
            color: "var(--mauve)",
            marginBottom: 28,
            maxWidth: 880,
          }}
        >
          {step.description}
        </div>
        <MockupFrame imageUrl={step.mockupImageUrl} />
      </div>
      <CTABar variant="overlay" />
    </SlideFrame>
  );
}

function CloseSlide({ ctaText }: { ctaText: string }) {
  return (
    <SlideFrame background="var(--wine)">
      <PushPin variant="gold" top={60} left="50%" style={{ transform: "translateX(-50%)" }} />
      <TapeStrip top={140} left={140} rotation={-6} width={200} height={48} />
      <TapeStrip top={140} right={140} rotation={6} width={200} height={48} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "180px 80px 200px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "var(--hot-pink)",
            marginBottom: 28,
          }}
        >
          Ready when you are
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 92,
            color: "var(--cream)",
            lineHeight: 1.05,
            marginBottom: 24,
            letterSpacing: -1,
            maxWidth: 880,
          }}
        >
          Start planning in{" "}
          <i style={{ fontStyle: "italic", color: "var(--gold-light)" }}>2 minutes.</i>
        </div>
        <div
          style={{
            background: "var(--cream)",
            color: "var(--deep-pink)",
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 2,
            padding: "20px 44px",
            boxShadow: "4px 4px 0 var(--gold)",
            transform: "rotate(-1deg)",
            marginTop: 24,
          }}
        >
          {ctaText}
        </div>
      </div>
      <CTABar variant="light" />
    </SlideFrame>
  );
}

export function HowItWorksCarousel({
  steps,
  slideIndex = 0,
  ctaText = "Get started free",
}: HowItWorksCarouselProps) {
  const totalSteps = steps.length;
  const totalSlides = totalSteps + 2;
  const safeIndex = Math.max(0, Math.min(slideIndex, totalSlides - 1));

  if (safeIndex === 0) {
    return <CoverSlide stepCount={totalSteps} />;
  }
  if (safeIndex === totalSlides - 1) {
    return <CloseSlide ctaText={ctaText} />;
  }
  const step = steps[safeIndex - 1];
  if (!step) {
    return <CoverSlide stepCount={totalSteps} />;
  }
  return <StepSlide step={step} total={totalSteps} />;
}
