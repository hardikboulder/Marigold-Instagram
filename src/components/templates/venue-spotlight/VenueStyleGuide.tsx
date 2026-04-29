import type { ReactNode } from "react";
import { CTABar } from "@/components/brand/CTABar";

export type VenueStyleBackground =
  | "mint"
  | "wine"
  | "peach"
  | "gold-light"
  | "blush"
  | "lavender";

export interface VenueStyleSlide {
  title: string;
  body: string;
  annotation?: string;
  imageUrl?: string;
}

export interface VenueStyleGuideProps {
  venueStyle: string;
  styleSubtitle: string;
  slides: VenueStyleSlide[];
  coverBackground?: VenueStyleBackground;
  /** 1 = cover, 2-5 = detail slides, 6 = close. Default 1. */
  slideIndex?: number;
}

const COVER_BG_TOKENS: Record<VenueStyleBackground, string> = {
  mint: "var(--mint)",
  wine: "var(--wine)",
  peach: "var(--peach)",
  "gold-light": "var(--gold-light)",
  blush: "var(--blush)",
  lavender: "var(--lavender)",
};

const COVER_TEXT_COLOR: Record<VenueStyleBackground, string> = {
  mint: "var(--wine)",
  wine: "var(--cream)",
  peach: "var(--wine)",
  "gold-light": "var(--wine)",
  blush: "var(--wine)",
  lavender: "var(--wine)",
};

const COVER_ACCENT_COLOR: Record<VenueStyleBackground, string> = {
  mint: "var(--deep-pink)",
  wine: "var(--gold)",
  peach: "var(--deep-pink)",
  "gold-light": "var(--deep-pink)",
  blush: "var(--deep-pink)",
  lavender: "var(--deep-pink)",
};

export function VenueStyleGuide({
  venueStyle,
  styleSubtitle,
  slides,
  coverBackground = "mint",
  slideIndex = 1,
}: VenueStyleGuideProps) {
  if (slideIndex <= 1) {
    return (
      <CoverSlide
        venueStyle={venueStyle}
        styleSubtitle={styleSubtitle}
        background={coverBackground}
      />
    );
  }
  if (slideIndex >= 6) {
    return <CloseSlide venueStyle={venueStyle} />;
  }

  const detailIndex = slideIndex - 2;
  const slide = slides[detailIndex] ?? {
    title: "DETAIL",
    body: "",
    annotation: "",
  };
  return <DetailSlide slide={slide} index={slideIndex} />;
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
  venueStyle,
  styleSubtitle,
  background,
}: {
  venueStyle: string;
  styleSubtitle: string;
  background: VenueStyleBackground;
}) {
  const bg = COVER_BG_TOKENS[background];
  const textColor = COVER_TEXT_COLOR[background];
  const accentColor = COVER_ACCENT_COLOR[background];

  return (
    <SlideFrame background={bg}>
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
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: accentColor,
            opacity: 0.85,
            marginBottom: 36,
          }}
        >
          VENUE STYLE GUIDE
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 130,
            lineHeight: 0.95,
            color: textColor,
            marginBottom: 32,
            maxWidth: 880,
          }}
        >
          {venueStyle}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 50,
            color: accentColor,
            transform: "rotate(-1.5deg)",
            maxWidth: 760,
            lineHeight: 1.1,
          }}
        >
          {styleSubtitle}
        </div>
      </div>
      <CTABar variant="overlay" handleText="SWIPE TO EXPLORE →" />
    </SlideFrame>
  );
}

function DetailSlide({
  slide,
  index,
}: {
  slide: VenueStyleSlide;
  index: number;
}) {
  return (
    <SlideFrame background="var(--cream)">
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 80,
          fontFamily: "'Syne', sans-serif",
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "var(--mauve)",
          opacity: 0.65,
        }}
      >
        {String(index - 1).padStart(2, "0")} · STYLE GUIDE
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "150px 80px 200px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "var(--hot-pink)",
            marginBottom: 24,
          }}
        >
          {slide.title}
        </div>

        {slide.imageUrl && (
          <div
            style={{
              width: "100%",
              height: 320,
              background: "var(--blush)",
              borderRadius: 4,
              overflow: "hidden",
              marginBottom: 28,
            }}
          >
            <img
              src={slide.imageUrl}
              alt={slide.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        )}

        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 28,
            lineHeight: 1.45,
            color: "var(--wine)",
            marginBottom: 28,
            maxWidth: 880,
          }}
        >
          {slide.body}
        </div>

        {slide.annotation && (
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 38,
              color: "var(--hot-pink)",
              transform: "rotate(-1.5deg)",
              alignSelf: "flex-start",
            }}
          >
            {slide.annotation}
          </div>
        )}
      </div>

      <CTABar variant="overlay" handleText="VENUE SPOTLIGHT" />
    </SlideFrame>
  );
}

function CloseSlide({ venueStyle }: { venueStyle: string }) {
  return (
    <SlideFrame background="var(--wine)">
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
          color: "var(--cream)",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "var(--gold)",
            marginBottom: 36,
          }}
        >
          KEEP EXPLORING
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 80,
            lineHeight: 1.05,
            color: "var(--cream)",
            marginBottom: 32,
            maxWidth: 880,
          }}
        >
          Explore{" "}
          <span style={{ fontStyle: "italic", color: "var(--gold)" }}>
            {venueStyle.toLowerCase().replace(/^the\s+/i, "")}
          </span>{" "}
          venues on
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 100,
            color: "var(--gold-light)",
            lineHeight: 1,
          }}
        >
          The <i style={{ fontStyle: "italic" }}>Marigold</i>
        </div>
      </div>
      <CTABar variant="light" handleText="START YOUR SEARCH →" />
    </SlideFrame>
  );
}
