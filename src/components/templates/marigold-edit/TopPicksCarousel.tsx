import type { ReactNode } from "react";
import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";
import {
  EDIT_CATEGORY_LABELS,
  type EditCategory,
} from "./ProductPickPost";

export interface TopPick {
  productName: string;
  category: EditCategory;
  price?: string;
  oneLiner: string;
  imageUrl?: string;
}

export interface TopPicksCarouselProps {
  monthName: string;
  subtitle: string;
  picks: TopPick[];
  /** 1 = cover, 2..picks.length+1 = pick slides, picks.length+2 = close. Default 1. */
  slideIndex?: number;
}

export function TopPicksCarousel({
  monthName,
  subtitle,
  picks,
  slideIndex = 1,
}: TopPicksCarouselProps) {
  const pickCount = picks.length;
  const lastSlide = pickCount + 2;

  if (slideIndex <= 1) {
    return <CoverSlide monthName={monthName} subtitle={subtitle} />;
  }
  if (slideIndex >= lastSlide) {
    return <CloseSlide />;
  }

  const pickNumber = slideIndex - 1;
  const pick = picks[pickNumber - 1] ?? {
    productName: "Pick name",
    category: "bridal-jewelry" as EditCategory,
    oneLiner: "",
  };
  return <PickSlide pickNumber={pickNumber} pick={pick} />;
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
  monthName,
  subtitle,
}: {
  monthName: string;
  subtitle: string;
}) {
  return (
    <SlideFrame background="var(--gold-light)">
      <TapeStrip top={88} left={120} rotation={-10} width={220} height={56} />
      <TapeStrip top={104} right={140} rotation={6} width={200} height={50} />
      <TapeStrip bottom={260} left={180} rotation={-4} width={180} height={44} />

      <PushPin variant="pink" top={68} right={88} size={44} />
      <PushPin variant="gold" bottom={300} right={130} size={40} />
      <PushPin variant="blue" bottom={360} left={120} size={36} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "180px 100px 240px",
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
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "var(--hot-pink)",
            marginBottom: 32,
          }}
        >
          THE MARIGOLD EDIT
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 128,
            lineHeight: 1.0,
            color: "var(--wine)",
            marginBottom: 28,
          }}
        >
          {monthName}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 44,
            color: "var(--deep-pink)",
            transform: "rotate(-1.5deg)",
            maxWidth: 760,
          }}
        >
          {subtitle}
        </div>
      </div>
      <CTABar variant="overlay" handleText="SWIPE FOR PICKS →" />
    </SlideFrame>
  );
}

function PickSlide({
  pickNumber,
  pick,
}: {
  pickNumber: number;
  pick: TopPick;
}) {
  const categoryLabel =
    EDIT_CATEGORY_LABELS[pick.category] ?? pick.category.toUpperCase();

  return (
    <SlideFrame background="var(--cream)">
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "55%",
          overflow: "hidden",
          background: "var(--blush)",
        }}
      >
        {pick.imageUrl ? (
          <img
            src={pick.imageUrl}
            alt={pick.productName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 32,
              border: "3px dashed rgba(75,21,40,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Caveat', cursive",
              fontSize: 36,
              color: "var(--mauve)",
              opacity: 0.7,
            }}
          >
            product photo
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          top: 60,
          left: 60,
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: "var(--hot-pink)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Syne', sans-serif",
          fontSize: 40,
          fontWeight: 800,
          boxShadow: "0 8px 18px rgba(75,21,40,0.25)",
          zIndex: 4,
        }}
      >
        {pickNumber}
      </div>

      <div
        style={{
          position: "absolute",
          top: "55%",
          left: 0,
          right: 0,
          height: 4,
          background: "var(--gold)",
          zIndex: 4,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: "calc(55% + 32px)",
          bottom: 120,
          background: "var(--cream)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: "12px 0",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            background: "var(--blush)",
            color: "var(--deep-pink)",
            padding: "8px 16px",
            borderRadius: 999,
            fontFamily: "'Syne', sans-serif",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {categoryLabel}
        </div>

        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 60,
            lineHeight: 1.05,
            color: "var(--wine)",
          }}
        >
          {pick.productName}
        </div>

        {pick.price && (
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 1,
              color: "var(--deep-pink)",
            }}
          >
            {pick.price}
          </div>
        )}

        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 36,
            lineHeight: 1.2,
            color: "var(--mauve)",
            transform: "rotate(-1deg)",
            marginTop: 4,
          }}
        >
          {pick.oneLiner}
        </div>
      </div>

      <CTABar variant="overlay" handleText="THE MARIGOLD EDIT" />
    </SlideFrame>
  );
}

function CloseSlide() {
  return (
    <SlideFrame background="var(--wine)">
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "180px 100px 240px",
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
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 96,
            lineHeight: 1.05,
            color: "var(--cream)",
            marginBottom: 40,
            maxWidth: 880,
          }}
        >
          Save this for later 📌
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: 2,
            color: "rgba(255,248,242,0.75)",
            maxWidth: 720,
            lineHeight: 1.4,
          }}
        >
          Follow{" "}
          <span style={{ color: "var(--gold)", fontWeight: 700 }}>
            @themarigold
          </span>{" "}
          for weekly picks
        </div>
      </div>
      <CTABar variant="light" />
    </SlideFrame>
  );
}
