import type { ReactNode } from "react";
import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";
import type { PlannerAdviceAccent } from "./PlannerAdvicePost";

export interface PlannerTip {
  headline: string;
  detail: string;
  annotation: string;
}

export interface PlannerTipsCarouselProps {
  plannerName: string;
  companyName: string;
  plannerHandle: string;
  tips: PlannerTip[];
  accentColor?: PlannerAdviceAccent;
  /** 1 = cover, 2..n = tip slides, last = close. Default 1. */
  slideIndex?: number;
}

const ACCENT_VARS: Record<PlannerAdviceAccent, string> = {
  gold: "var(--gold)",
  pink: "var(--hot-pink)",
  lavender: "var(--lavender)",
};

export function PlannerTipsCarousel({
  plannerName,
  companyName,
  plannerHandle,
  tips,
  accentColor = "gold",
  slideIndex = 1,
}: PlannerTipsCarouselProps) {
  const accent = ACCENT_VARS[accentColor];
  const tipCount = tips.length;
  const lastSlide = tipCount + 2;

  if (slideIndex <= 1) {
    return (
      <CoverSlide
        plannerName={plannerName}
        companyName={companyName}
        accent={accent}
      />
    );
  }
  if (slideIndex >= lastSlide) {
    return (
      <CloseSlide
        plannerHandle={plannerHandle}
        plannerName={plannerName}
        accent={accent}
      />
    );
  }

  const tipNumber = slideIndex - 1;
  const tip = tips[tipNumber - 1] ?? {
    headline: "Tip headline",
    detail: "",
    annotation: "",
  };
  return <TipSlide tipNumber={tipNumber} tip={tip} accent={accent} />;
}

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

function CoverSlide({
  plannerName,
  companyName,
  accent,
}: {
  plannerName: string;
  companyName: string;
  accent: string;
}) {
  return (
    <SlideFrame background="var(--pink)">
      <TapeStrip top={64} left={410} rotation={-4} width={260} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "180px 80px 220px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "white",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.6)",
            marginBottom: 32,
          }}
        >
          PLANNER TIPS
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 96,
            lineHeight: 1.0,
            color: "white",
            marginBottom: 20,
          }}
        >
          {plannerName}
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.75)",
            marginBottom: 24,
          }}
        >
          {companyName}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 48,
            color: accent,
            transform: "rotate(-2deg)",
          }}
        >
          straight from the planner
        </div>
      </div>
      <CTABar variant="overlay" handleText="SWIPE FOR TIPS →" />
    </SlideFrame>
  );
}

function TipSlide({
  tipNumber,
  tip,
  accent,
}: {
  tipNumber: number;
  tip: PlannerTip;
  accent: string;
}) {
  return (
    <SlideFrame background="var(--cream)">
      <PushPin variant="pink" top={68} right={88} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "140px 96px 200px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: "var(--wine)",
            color: "var(--cream)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Syne', sans-serif",
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: 1,
            marginBottom: 36,
            boxShadow: "0 6px 14px rgba(75,21,40,0.18)",
          }}
        >
          {String(tipNumber).padStart(2, "0")}
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 78,
            lineHeight: 1.05,
            color: "var(--wine)",
            marginBottom: 28,
          }}
        >
          {tip.headline}
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 26,
            lineHeight: 1.45,
            color: "var(--mauve)",
            marginBottom: 28,
            maxWidth: 820,
          }}
        >
          {tip.detail}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 38,
            color: accent,
            transform: "rotate(-2deg)",
          }}
        >
          {tip.annotation}
        </div>
      </div>
      <CTABar variant="overlay" handleText="PLANNER SPOTLIGHT" />
    </SlideFrame>
  );
}

function CloseSlide({
  plannerHandle,
  plannerName,
  accent,
}: {
  plannerHandle: string;
  plannerName: string;
  accent: string;
}) {
  return (
    <SlideFrame background="var(--wine)">
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
          color: "var(--cream)",
        }}
      >
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 44,
            color: "rgba(255,248,242,0.7)",
            marginBottom: 20,
            transform: "rotate(-1.5deg)",
          }}
        >
          more from {plannerName}?
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 84,
            lineHeight: 1.1,
            color: "var(--cream)",
            marginBottom: 32,
            maxWidth: 880,
          }}
        >
          Follow{" "}
          <span style={{ fontStyle: "italic", color: accent }}>
            {plannerHandle}
          </span>{" "}
          for more
        </div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "rgba(255,248,242,0.55)",
          }}
        >
          Powered by The Marigold
        </div>
      </div>
      <CTABar variant="light" />
    </SlideFrame>
  );
}
