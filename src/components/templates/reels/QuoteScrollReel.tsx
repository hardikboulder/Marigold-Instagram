"use client";

import { forwardRef } from "react";

import { CTABar } from "@/components/brand/CTABar";
import {
  ReelFrame,
  clamp01,
  easeOutCubic,
  ramp,
  useReelPlayhead,
  type ReelHandle,
} from "./_shared";

export interface ScrollQuote {
  text: string;
  attribution: string;
}

export interface QuoteScrollReelProps {
  quotes: ScrollQuote[];
  headerLabel: string;
  ctaText: string;
  progressMs?: number;
  playing?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  onTick?: (ms: number, totalMs: number) => void;
  onComplete?: () => void;
}

export type QuoteScrollReelHandle = ReelHandle;

const QUOTE_MS = 4000;
const CTA_MS = 2400;
/** Vertical distance (px) one quote travels in `QUOTE_MS`. Quotes are tall so
 *  this needs to be larger than typical content — 600px keeps the active
 *  quote pinned near the centre of the 1920px frame. */
const QUOTE_TRAVEL = 600;

export const QuoteScrollReel = forwardRef<
  QuoteScrollReelHandle,
  QuoteScrollReelProps
>(function QuoteScrollReel(props, ref) {
  const {
    quotes,
    headerLabel,
    ctaText,
    progressMs,
    playing,
    loop = false,
    autoPlay = false,
    onTick,
    onComplete,
  } = props;

  const totalMs = quotes.length * QUOTE_MS + CTA_MS;

  const { currentMs } = useReelPlayhead(
    { totalMs, progressMs, playing, loop, autoPlay, onTick, onComplete },
    ref,
  );

  return (
    <QuoteScrollStage
      quotes={quotes}
      headerLabel={headerLabel}
      ctaText={ctaText}
      currentMs={currentMs}
    />
  );
});

interface StageProps {
  quotes: ScrollQuote[];
  headerLabel: string;
  ctaText: string;
  currentMs: number;
}

export function QuoteScrollStage({
  quotes,
  headerLabel,
  ctaText,
  currentMs,
}: StageProps) {
  const ctaStart = quotes.length * QUOTE_MS;
  const onCta = currentMs >= ctaStart;

  // Continuous scroll position — `scrollMs` runs through the quote section.
  const scrollMs = clamp01(currentMs / Math.max(ctaStart, 1)) * ctaStart;
  const activeIdx = Math.min(
    quotes.length - 1,
    Math.floor(scrollMs / QUOTE_MS),
  );

  return (
    <ReelFrame background="var(--wine)">
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 30%, rgba(212,168,83,0.18), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <header
        style={{
          position: "absolute",
          top: 120,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 3,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "var(--gold-light)",
          }}
        >
          {headerLabel}
        </div>
      </header>

      {!onCta ? (
        <ScrollingQuotes
          quotes={quotes}
          scrollMs={scrollMs}
          activeIdx={activeIdx}
        />
      ) : (
        <CtaFrame ctaText={ctaText} progressMs={currentMs - ctaStart} />
      )}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <CTABar variant="light" />
      </div>
    </ReelFrame>
  );
}

function ScrollingQuotes({
  quotes,
  scrollMs,
  activeIdx,
}: {
  quotes: ScrollQuote[];
  scrollMs: number;
  activeIdx: number;
}) {
  const translateY = -(scrollMs / QUOTE_MS) * QUOTE_TRAVEL;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: "50%",
        transform: "translateY(-50%)",
        height: 1100,
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 400,
          left: 0,
          right: 0,
          transform: `translateY(${translateY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        {quotes.map((q, i) => {
          const distance = i - activeIdx;
          const opacity =
            distance === 0 ? 1 : distance === -1 || distance === 1 ? 0.45 : 0.18;
          return (
            <div
              key={i}
              style={{
                width: 920,
                textAlign: "center",
                opacity,
                transition: "opacity 400ms ease-out",
              }}
            >
              <div
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: "italic",
                  fontSize: 56,
                  lineHeight: 1.25,
                  color: "var(--cream)",
                }}
              >
                “{q.text}”
              </div>
              <div
                style={{
                  marginTop: 24,
                  fontFamily: "'Caveat', cursive",
                  fontSize: 44,
                  color: "var(--gold-light)",
                }}
              >
                — {q.attribution}
              </div>
              <div
                style={{
                  margin: "32px auto 0",
                  width: 120,
                  height: 2,
                  background: "var(--gold)",
                  opacity: 0.5,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CtaFrame({
  ctaText,
  progressMs,
}: {
  ctaText: string;
  progressMs: number;
}) {
  const opacity = ramp(progressMs, 0, 500);
  const eased = easeOutCubic(opacity);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
        textAlign: "center",
        color: "var(--cream)",
      }}
    >
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 56,
          color: "var(--gold-light)",
          marginBottom: 24,
          opacity: eased,
        }}
      >
        Heard from the community
      </div>
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 80,
          lineHeight: 1.15,
          opacity: eased,
          transform: `translateY(${(1 - eased) * 24}px)`,
          maxWidth: 880,
        }}
      >
        {ctaText}
      </div>
    </div>
  );
}

export interface QuoteScrollReelStaticPreviewProps
  extends Omit<
    QuoteScrollReelProps,
    "progressMs" | "playing" | "autoPlay" | "loop"
  > {
  freezeAt?: number;
}

export function QuoteScrollReelStaticPreview({
  freezeAt = 0.45,
  ...rest
}: QuoteScrollReelStaticPreviewProps) {
  const totalMs = rest.quotes.length * QUOTE_MS + CTA_MS;
  return <QuoteScrollReel {...rest} progressMs={totalMs * clamp01(freezeAt)} />;
}
