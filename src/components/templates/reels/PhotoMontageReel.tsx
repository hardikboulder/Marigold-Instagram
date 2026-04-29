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

export type KenBurnsDirection =
  | "zoom-in"
  | "zoom-out"
  | "pan-left"
  | "pan-right";

export type PhotoMontageOverlay =
  | "bottom-strip"
  | "center-card"
  | "full-overlay";

export interface PhotoMontageSlide {
  imageUrl: string;
  caption: string;
  kenBurnsDirection: KenBurnsDirection;
}

export interface PhotoMontageReelProps {
  slides: PhotoMontageSlide[];
  ctaText: string;
  overlayStyle?: PhotoMontageOverlay;
  progressMs?: number;
  playing?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  onTick?: (ms: number, totalMs: number) => void;
  onComplete?: () => void;
}

export type PhotoMontageReelHandle = ReelHandle;

const SLIDE_MS = 3500;
const CROSSFADE_MS = 500;
const CTA_MS = 2400;

export const PhotoMontageReel = forwardRef<
  PhotoMontageReelHandle,
  PhotoMontageReelProps
>(function PhotoMontageReel(props, ref) {
  const {
    slides,
    ctaText,
    overlayStyle = "bottom-strip",
    progressMs,
    playing,
    loop = false,
    autoPlay = false,
    onTick,
    onComplete,
  } = props;

  const totalMs = slides.length * SLIDE_MS + CTA_MS;

  const { currentMs } = useReelPlayhead(
    { totalMs, progressMs, playing, loop, autoPlay, onTick, onComplete },
    ref,
  );

  return (
    <PhotoMontageStage
      slides={slides}
      ctaText={ctaText}
      overlayStyle={overlayStyle}
      currentMs={currentMs}
    />
  );
});

interface StageProps {
  slides: PhotoMontageSlide[];
  ctaText: string;
  overlayStyle: PhotoMontageOverlay;
  currentMs: number;
}

export function PhotoMontageStage({
  slides,
  ctaText,
  overlayStyle,
  currentMs,
}: StageProps) {
  const ctaStart = slides.length * SLIDE_MS;
  const onCta = currentMs >= ctaStart;

  return (
    <ReelFrame background="var(--wine)">
      {/* Layer all slides; only the active(s) are visible via opacity. */}
      {slides.map((slide, i) => {
        const slideStart = i * SLIDE_MS;
        const slideEnd = slideStart + SLIDE_MS;
        const inFade = clamp01((currentMs - slideStart) / CROSSFADE_MS);
        const outFade = clamp01(
          (slideEnd - currentMs) / CROSSFADE_MS,
        );
        const opacity = currentMs < slideStart || currentMs > slideEnd
          ? 0
          : Math.min(inFade, outFade);
        if (opacity <= 0) return null;
        const localT = clamp01((currentMs - slideStart) / SLIDE_MS);
        return (
          <PhotoSlide
            key={i}
            slide={slide}
            opacity={opacity}
            localT={localT}
            overlayStyle={overlayStyle}
          />
        );
      })}

      {onCta ? (
        <CtaSlide ctaText={ctaText} progressMs={currentMs - ctaStart} />
      ) : null}
    </ReelFrame>
  );
}

function PhotoSlide({
  slide,
  opacity,
  localT,
  overlayStyle,
}: {
  slide: PhotoMontageSlide;
  opacity: number;
  localT: number;
  overlayStyle: PhotoMontageOverlay;
}) {
  const transform = kenBurnsTransform(slide.kenBurnsDirection, localT);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: slide.imageUrl
            ? `url("${slide.imageUrl}") center/cover no-repeat`
            : "linear-gradient(135deg, var(--wine), var(--deep-pink))",
          transform,
          transformOrigin: "center",
          transition: "transform 200ms linear",
        }}
      />

      <CaptionOverlay caption={slide.caption} overlayStyle={overlayStyle} />
    </div>
  );
}

function kenBurnsTransform(
  direction: KenBurnsDirection,
  t: number,
): string {
  switch (direction) {
    case "zoom-in":
      return `scale(${1 + t * 0.12})`;
    case "zoom-out":
      return `scale(${1.12 - t * 0.12})`;
    case "pan-left":
      return `scale(1.1) translateX(${t * 5}%)`;
    case "pan-right":
      return `scale(1.1) translateX(${-t * 5}%)`;
    default:
      return "scale(1)";
  }
}

function CaptionOverlay({
  caption,
  overlayStyle,
}: {
  caption: string;
  overlayStyle: PhotoMontageOverlay;
}) {
  if (!caption) return null;
  if (overlayStyle === "bottom-strip") {
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 200,
          padding: "32px 80px",
          background: "rgba(75,21,40,0.78)",
          color: "var(--cream)",
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 56,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {caption}
      </div>
    );
  }
  if (overlayStyle === "center-card") {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
        }}
      >
        <div
          style={{
            background: "rgba(255,248,242,0.92)",
            color: "var(--wine)",
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 64,
            padding: "48px 64px",
            textAlign: "center",
            boxShadow: "0 16px 40px rgba(75,21,40,0.3)",
            maxWidth: 800,
            lineHeight: 1.2,
          }}
        >
          {caption}
        </div>
      </div>
    );
  }
  // full-overlay: a darker scrim with text dead-center.
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, rgba(75,21,40,0.4) 0%, rgba(75,21,40,0.7) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 80,
          color: "var(--cream)",
          lineHeight: 1.15,
          textShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}
      >
        {caption}
      </div>
    </div>
  );
}

function CtaSlide({
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
        background: "var(--wine)",
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
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: "var(--gold-light)",
          marginBottom: 28,
          opacity: eased,
        }}
      >
        The Marigold
      </div>
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 84,
          lineHeight: 1.15,
          opacity: eased,
          transform: `translateY(${(1 - eased) * 24}px)`,
          maxWidth: 880,
        }}
      >
        {ctaText}
      </div>
      <CTABar variant="light" />
    </div>
  );
}

export interface PhotoMontageReelStaticPreviewProps
  extends Omit<
    PhotoMontageReelProps,
    "progressMs" | "playing" | "autoPlay" | "loop"
  > {
  freezeAt?: number;
}

export function PhotoMontageReelStaticPreview({
  freezeAt = 0.3,
  ...rest
}: PhotoMontageReelStaticPreviewProps) {
  const totalMs = rest.slides.length * SLIDE_MS + CTA_MS;
  return <PhotoMontageReel {...rest} progressMs={totalMs * clamp01(freezeAt)} />;
}
