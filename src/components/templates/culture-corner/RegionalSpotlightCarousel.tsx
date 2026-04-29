import type { CSSProperties, ReactNode } from "react";
import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

import { CultureIcon, MandalaPattern } from "./CultureIcons";

export type RegionColor =
  | "wine"
  | "deep-pink"
  | "hot-pink"
  | "pink"
  | "gold"
  | "gold-light"
  | "mint"
  | "peach"
  | "lavender"
  | "sky"
  | "blush"
  | "cream";

export interface RegionalSlide {
  title: string;
  content: string;
  imageUrl?: string;
}

export interface RegionalSpotlightCarouselProps {
  regionName: string;
  regionSubtitle: string;
  regionColor?: RegionColor;
  /** 5 slides: ceremonies, fashion, food, music, details */
  slides: RegionalSlide[];
  /** 1 = cover, 2..6 = topic slides, 7 = CTA. Default 1. */
  slideIndex?: number;
  /** Override the default closing CTA copy. */
  ctaHeadline?: string;
  ctaSubtitle?: string;
}

const COLOR_VARS: Record<RegionColor, string> = {
  wine: "var(--wine)",
  "deep-pink": "var(--deep-pink)",
  "hot-pink": "var(--hot-pink)",
  pink: "var(--pink)",
  gold: "var(--gold)",
  "gold-light": "var(--gold-light)",
  mint: "var(--mint)",
  peach: "var(--peach)",
  lavender: "var(--lavender)",
  sky: "var(--sky)",
  blush: "var(--blush)",
  cream: "var(--cream)",
};

const LIGHT_COLORS: RegionColor[] = [
  "gold-light",
  "mint",
  "peach",
  "lavender",
  "sky",
  "blush",
  "cream",
];

function isLight(color: RegionColor) {
  return LIGHT_COLORS.includes(color);
}

const TOPIC_LABELS = [
  "THE CEREMONIES",
  "THE FASHION",
  "THE FOOD",
  "THE MUSIC",
  "THE DETAILS",
];

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
  regionName,
  regionSubtitle,
  color,
}: {
  regionName: string;
  regionSubtitle: string;
  color: RegionColor;
}) {
  const light = isLight(color);
  const headline = light ? "var(--wine)" : "var(--cream)";
  const eyebrow = light ? "var(--wine)" : "var(--gold)";
  const subtitle = light ? "var(--wine)" : "var(--gold-light)";

  return (
    <SlideFrame background={COLOR_VARS[color]}>
      <div
        style={{
          position: "absolute",
          top: 60,
          left: "50%",
          transform: "translateX(-50%)",
          pointerEvents: "none",
        }}
      >
        <MandalaPattern
          color={light ? "var(--wine)" : "var(--gold)"}
          opacity={0.07}
          size={960}
        />
      </div>

      <PushPin variant="gold" top={56} left={70} />
      <PushPin variant="pink" top={56} right={70} />
      <TapeStrip
        top={140}
        left={420}
        rotation={-3}
        width={240}
        height={50}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "200px 80px 220px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: eyebrow,
            marginBottom: 28,
          }}
        >
          Culture Corner
        </div>

        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 130,
            lineHeight: 0.96,
            color: headline,
            letterSpacing: -2,
            marginBottom: 28,
            maxWidth: 920,
          }}
        >
          {regionName}
        </div>

        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 52,
            color: subtitle,
            transform: "rotate(-2deg)",
            maxWidth: 820,
          }}
        >
          {regionSubtitle}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 130,
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: light ? "rgba(75,21,40,0.55)" : "rgba(255,248,242,0.55)",
          }}
        >
          Swipe →
        </div>
      </div>

      <CTABar variant="overlay" handleText="CULTURE CORNER" />
    </SlideFrame>
  );
}

function TopicSlide({
  topicLabel,
  slideNumber,
  total,
  slide,
  color,
}: {
  topicLabel: string;
  slideNumber: number;
  total: number;
  slide: RegionalSlide;
  color: RegionColor;
}) {
  const light = isLight(color);
  const accent = light ? "var(--wine)" : "var(--gold)";
  const text = light ? "var(--wine)" : "var(--cream)";
  const subdued = light
    ? "rgba(75,21,40,0.65)"
    : "rgba(255,248,242,0.78)";

  return (
    <SlideFrame background={COLOR_VARS[color]}>
      <PushPin
        variant="gold"
        top={56}
        left="50%"
        style={{ transform: "translateX(-50%)" }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "120px 90px 200px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: accent,
            }}
          >
            {topicLabel}
          </div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: subdued,
            }}
          >
            {slideNumber} / {total}
          </div>
        </div>

        <div
          style={{
            width: "100%",
            height: 1,
            background: accent,
            opacity: 0.4,
            marginBottom: 36,
          }}
        />

        {slide.imageUrl ? (
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 28,
              maxHeight: 360,
              boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
            }}
          >
            <img
              src={slide.imageUrl}
              alt={slide.title}
              style={{
                width: "100%",
                height: 360,
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        ) : null}

        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 64,
            lineHeight: 1.1,
            color: text,
            marginBottom: 24,
          }}
        >
          {slide.title}
        </div>

        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 26,
            lineHeight: 1.45,
            color: subdued,
            maxWidth: 820,
          }}
        >
          {slide.content}
        </div>
      </div>

      <CTABar variant="overlay" handleText="CULTURE CORNER" />
    </SlideFrame>
  );
}

function CTASlide({
  regionName,
  headline,
  subtitle,
  color,
}: {
  regionName: string;
  headline: string;
  subtitle: string;
  color: RegionColor;
}) {
  const light = isLight(color);

  const wineFallback: CSSProperties["background"] = light
    ? COLOR_VARS[color]
    : "var(--wine)";

  return (
    <SlideFrame background={wineFallback as string}>
      <div
        style={{
          position: "absolute",
          top: 60,
          left: "50%",
          transform: "translateX(-50%)",
          pointerEvents: "none",
        }}
      >
        <MandalaPattern
          color={light ? "var(--wine)" : "var(--gold)"}
          opacity={0.08}
          size={900}
        />
      </div>

      <PushPin variant="gold" top={56} left={70} />
      <PushPin variant="pink" top={56} right={70} />

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
          zIndex: 2,
        }}
      >
        <CultureIcon
          type="marigold-flower"
          size={88}
          color={light ? "var(--wine)" : "var(--gold)"}
        />

        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: light ? "var(--wine)" : "var(--gold)",
            marginTop: 28,
            marginBottom: 24,
          }}
        >
          {headline}
        </div>

        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 84,
            lineHeight: 1.05,
            color: light ? "var(--wine)" : "var(--cream)",
            marginBottom: 36,
            maxWidth: 880,
          }}
        >
          Plan Your{" "}
          <span style={{ fontStyle: "italic" }}>{regionName}</span>{" "}
          Wedding
        </div>

        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 48,
            color: light ? "var(--wine)" : "var(--gold-light)",
            transform: "rotate(-2deg)",
            maxWidth: 820,
            marginBottom: 32,
          }}
        >
          {subtitle}
        </div>

        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: light ? "rgba(75,21,40,0.55)" : "rgba(255,248,242,0.55)",
          }}
        >
          on The Marigold
        </div>
      </div>

      <CTABar variant={light ? "overlay" : "light"} />
    </SlideFrame>
  );
}

export function RegionalSpotlightCarousel({
  regionName,
  regionSubtitle,
  regionColor = "wine",
  slides,
  slideIndex = 1,
  ctaHeadline = "Build it on The Marigold",
  ctaSubtitle = "every ceremony, every vendor, every detail — in one place",
}: RegionalSpotlightCarouselProps) {
  const safeSlides = slides.slice(0, 5);
  const totalTopics = safeSlides.length;
  const lastSlide = totalTopics + 2; // cover + topics + cta

  const safeIndex = Math.max(1, Math.min(slideIndex, lastSlide));

  if (safeIndex === 1) {
    return (
      <CoverSlide
        regionName={regionName}
        regionSubtitle={regionSubtitle}
        color={regionColor}
      />
    );
  }
  if (safeIndex === lastSlide) {
    return (
      <CTASlide
        regionName={regionName}
        headline={ctaHeadline}
        subtitle={ctaSubtitle}
        color={regionColor}
      />
    );
  }

  const topicIdx = safeIndex - 2;
  const slide = safeSlides[topicIdx] ?? {
    title: "Coming soon",
    content: "",
  };
  const topicLabel = TOPIC_LABELS[topicIdx] ?? "THE DETAILS";

  return (
    <TopicSlide
      topicLabel={topicLabel}
      slideNumber={topicIdx + 1}
      total={totalTopics}
      slide={slide}
      color={regionColor}
    />
  );
}
