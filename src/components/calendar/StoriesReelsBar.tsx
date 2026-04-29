"use client";

/**
 * Instagram-style horizontal strip of upcoming stories & reels — sits at the
 * top of the Grid view. Each circle shows a tiny preview with the series
 * colour as the ring border. A leading "+" circle adds new stories/reels.
 *
 * "Upcoming" = items dated today or later, sorted ascending. Falls back to
 * showing the most recent past stories/reels when there's nothing on the
 * horizon, so the strip never just vanishes.
 */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { TemplateFrame } from "@/components/brand/TemplateFrame";
import { getSeriesBySlug } from "@/lib/db/data-loader";
import type { CalendarItem } from "@/lib/types";
import { FORMAT_BADGES, seriesColor } from "./labels";
import { renderTemplate } from "./template-renderer";
import { isoDate, parseIsoDate } from "./utils";

const RING_SIZE = 76;

interface StoriesReelsBarProps {
  items: CalendarItem[];
  onAdd: () => void;
}

export function StoriesReelsBar({ items, onAdd }: StoriesReelsBarProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ordered = useMemo(() => {
    const auxiliaries = items.filter((i) => i.format !== "post");
    if (!mounted) return auxiliaries;

    const today = isoDate(new Date());
    const upcoming = auxiliaries
      .filter((i) => i.scheduled_date >= today)
      .sort((a, b) => (a.scheduled_date < b.scheduled_date ? -1 : 1));
    if (upcoming.length > 0) return upcoming;

    return [...auxiliaries].sort((a, b) =>
      a.scheduled_date < b.scheduled_date ? 1 : -1,
    );
  }, [items, mounted]);

  return (
    <section
      style={{
        background: "var(--cream)",
        border: "1px solid rgba(75,21,40,0.08)",
        borderRadius: 18,
        padding: "16px 18px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
      aria-label="Upcoming stories and reels"
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 22,
              color: "var(--wine)",
              fontStyle: "italic",
            }}
          >
            stories & reels
          </span>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 9,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1.6,
              color: "var(--mauve)",
            }}
          >
            {ordered.length} upcoming
          </span>
        </div>
        <span
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 16,
            color: "var(--pink)",
          }}
        >
          tap a circle to edit
        </span>
      </header>

      <div
        style={{
          display: "flex",
          gap: 14,
          overflowX: "auto",
          paddingBottom: 6,
          scrollSnapType: "x mandatory",
        }}
      >
        <AddCircle onClick={onAdd} />
        {ordered.length === 0 ? (
          <span
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 18,
              color: "var(--mauve)",
              alignSelf: "center",
              paddingLeft: 4,
            }}
          >
            no stories or reels lined up — tap + to add one
          </span>
        ) : (
          ordered.map((item) => (
            <StoryCircle
              key={item.id}
              item={item}
              onClick={() => router.push(`/editor/${item.id}`)}
              mounted={mounted}
            />
          ))
        )}
      </div>
    </section>
  );
}

function AddCircle({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: "0 0 auto",
        scrollSnapAlign: "start",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
      aria-label="Add story or reel"
    >
      <span
        style={{
          width: RING_SIZE,
          height: RING_SIZE,
          borderRadius: 999,
          background: "var(--blush)",
          border: "2px dashed rgba(75,21,40,0.35)",
          color: "var(--pink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Instrument Serif', serif",
          fontSize: 38,
          lineHeight: 1,
        }}
      >
        +
      </span>
      <span
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.4,
          color: "var(--mauve)",
        }}
      >
        Add
      </span>
    </button>
  );
}

interface StoryCircleProps {
  item: CalendarItem;
  onClick: () => void;
  mounted: boolean;
}

function StoryCircle({ item, onClick, mounted }: StoryCircleProps) {
  const ring = seriesColor(item.series_slug);
  const seriesName =
    getSeriesBySlug(item.series_slug)?.name ?? item.series_slug;
  const innerSize = RING_SIZE - 6;
  const scale = innerSize / 1080;
  const cropOffset = ((1920 - 1080) / 2) * scale;
  const label = mounted
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
        parseIsoDate(item.scheduled_date),
      )
    : item.scheduled_date.slice(5);

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${seriesName} · ${label}`}
      style={{
        flex: "0 0 auto",
        scrollSnapAlign: "start",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span
        style={{
          width: RING_SIZE,
          height: RING_SIZE,
          borderRadius: 999,
          padding: 3,
          background: ring,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 6px rgba(75,21,40,0.12)",
        }}
      >
        <span
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: 999,
            overflow: "hidden",
            background: "var(--cream)",
            position: "relative",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -cropOffset,
              left: 0,
            }}
          >
            <TemplateFrame
              format="story"
              scale={scale}
              style={{ boxShadow: "none", borderRadius: 0 }}
            >
              {renderTemplate(item.template_slug, item.content_data)}
            </TemplateFrame>
          </span>
          <span style={formatPip(item.format)}>
            {FORMAT_BADGES[item.format].label[0]}
          </span>
        </span>
      </span>
      <span
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.2,
          color: "var(--wine)",
          maxWidth: RING_SIZE + 8,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </button>
  );
}

function formatPip(format: CalendarItem["format"]): CSSProperties {
  const badge = FORMAT_BADGES[format];
  return {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 999,
    background: badge.bg,
    color: badge.fg,
    fontFamily: "'Syne', sans-serif",
    fontSize: 9,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1.5px solid var(--cream)",
  };
}
