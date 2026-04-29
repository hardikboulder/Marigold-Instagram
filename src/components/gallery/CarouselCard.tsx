"use client";

import { useState, type ReactNode } from "react";
import { GalleryItem } from "./GalleryItem";
import type { TemplateFormat } from "@/components/brand/TemplateFrame";

export interface CarouselSlide {
  format: TemplateFormat;
  filename: string;
  label: string;
  node: ReactNode;
  templateSlug?: string;
}

interface CarouselCardProps {
  title: string;
  description?: string;
  slides: CarouselSlide[];
  seriesSlug: string;
  onUseTemplate: (info: {
    templateSlug?: string;
    seriesSlug?: string;
    templateName: string;
  }) => void;
}

export function CarouselCard({
  title,
  description,
  slides,
  seriesSlug,
  onUseTemplate,
}: CarouselCardProps) {
  const [index, setIndex] = useState(0);
  const total = slides.length;
  const safeIndex = Math.max(0, Math.min(index, total - 1));
  const current = slides[safeIndex];

  function prev() {
    setIndex((i) => (i - 1 + total) % total);
  }
  function next() {
    setIndex((i) => (i + 1) % total);
  }

  return (
    <div style={wrapperStyle}>
      <div style={headerStyle}>
        <div>
          <div style={kickerStyle}>Carousel · {total} slides</div>
          <h3 style={titleStyle}>{title}</h3>
          {description && <p style={descStyle}>{description}</p>}
        </div>
      </div>

      <div style={slideRowStyle}>
        <button
          type="button"
          onClick={prev}
          disabled={total <= 1}
          style={navBtnStyle(total <= 1)}
          aria-label="Previous slide"
        >
          ‹
        </button>

        <div style={{ flex: "0 0 auto" }}>
          <GalleryItem
            key={current.filename}
            format={current.format}
            filename={current.filename}
            label={current.label}
            kind="carousel"
            slideIndicator={`${safeIndex + 1}/${total}`}
            templateSlug={current.templateSlug}
            seriesSlug={seriesSlug}
            onUseTemplate={onUseTemplate}
          >
            {current.node}
          </GalleryItem>
        </div>

        <button
          type="button"
          onClick={next}
          disabled={total <= 1}
          style={navBtnStyle(total <= 1)}
          aria-label="Next slide"
        >
          ›
        </button>
      </div>

      <div style={dotsRowStyle}>
        {slides.map((s, i) => (
          <button
            key={s.filename}
            type="button"
            onClick={() => setIndex(i)}
            style={dotStyle(i === safeIndex)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 16,
  background: "rgba(255,255,255,0.5)",
  border: "1px dashed rgba(75,21,40,0.18)",
  borderRadius: 14,
  flex: "0 0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const kickerStyle: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--gold)",
  marginBottom: 6,
};

const titleStyle: React.CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 22,
  color: "var(--wine)",
  lineHeight: 1.1,
  margin: 0,
};

const descStyle: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
  lineHeight: 1.5,
  marginTop: 4,
  maxWidth: 360,
};

const slideRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

function navBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: 36,
    height: 36,
    borderRadius: 999,
    border: "1px solid var(--wine)",
    background: disabled ? "transparent" : "var(--cream)",
    color: "var(--wine)",
    fontSize: 22,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.3 : 1,
    flexShrink: 0,
    fontFamily: "'Syne', sans-serif",
    lineHeight: 1,
  };
}

const dotsRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  justifyContent: "center",
};

function dotStyle(active: boolean): React.CSSProperties {
  return {
    width: active ? 18 : 8,
    height: 8,
    borderRadius: 999,
    background: active ? "var(--wine)" : "rgba(75,21,40,0.2)",
    border: "none",
    cursor: "pointer",
    transition: "width 120ms ease",
  };
}
