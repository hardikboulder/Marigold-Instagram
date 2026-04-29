"use client";

/**
 * Ghost card shown for empty days. Computes a contextual suggestion based on
 * the surrounding ±7 days of items: which series is under-served, which mix
 * category (engagement/value/aesthetic/community) is missing, and which
 * grid colour would break up a stripe of the same hue.
 *
 * The math intentionally lives next to the visual — this is a UI hint, not a
 * generation step. Clicking the card opens AddPostDialog seeded with the
 * suggestion (the parent owns the dialog).
 */

import { useMemo, type CSSProperties } from "react";
import {
  getContentMixCategory,
  getGridColorProfile,
} from "@/lib/ai/content-strategy";
import { getSeriesBySlug } from "@/lib/db/data-loader";
import type {
  CalendarItem,
  ContentFormat,
  ContentMixCategory,
  GridColorProfile,
} from "@/lib/types";
import { seriesColor } from "./labels";
import {
  getActiveSeriesList,
  getActiveTemplatesForSeries,
  isoDate,
  parseIsoDate,
} from "./utils";

export interface EmptyDaySuggestion {
  seriesSlug: string;
  seriesName: string;
  templateSlug: string;
  templateName: string;
  format: ContentFormat;
  rationale: string;
  /** Tone for the dominant grid colour we're trying to introduce. */
  colorProfile: GridColorProfile;
  mixCategory: ContentMixCategory;
}

interface EmptyDayGhostProps {
  date: Date;
  surroundingItems: CalendarItem[];
  onAccept: (suggestion: EmptyDaySuggestion) => void;
  onAddManual: () => void;
  density?: "calendar" | "month";
}

export function EmptyDayGhost({
  date,
  surroundingItems,
  onAccept,
  onAddManual,
  density = "calendar",
}: EmptyDayGhostProps) {
  const suggestion = useMemo(
    () => suggestForEmptyDay(date, surroundingItems),
    [date, surroundingItems],
  );

  if (density === "month") {
    return (
      <button
        type="button"
        onClick={() =>
          suggestion ? onAccept(suggestion) : onAddManual()
        }
        title={
          suggestion
            ? `Suggested: ${suggestion.seriesName} · ${suggestion.format}`
            : "Add content"
        }
        style={monthGhostStyle(suggestion ? seriesColor(suggestion.seriesSlug) : "var(--mauve)")}
      >
        <span
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 11,
            color: "var(--mauve)",
            lineHeight: 1.1,
          }}
        >
          {suggestion ? suggestion.seriesName : "+ add"}
        </span>
      </button>
    );
  }

  if (!suggestion) {
    return (
      <button
        type="button"
        onClick={onAddManual}
        style={ghostCardStyle}
      >
        <span
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 18,
            color: "var(--pink)",
          }}
        >
          + add a post
        </span>
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 11,
            color: "var(--mauve)",
          }}
        >
          nothing scheduled
        </span>
      </button>
    );
  }

  return (
    <div style={ghostCardStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: seriesColor(suggestion.seriesSlug),
          }}
        />
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 9,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 1.4,
            color: "var(--mauve)",
          }}
        >
          AI suggestion
        </span>
      </div>
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 18,
          color: "var(--wine)",
          fontStyle: "italic",
          lineHeight: 1.2,
        }}
      >
        {suggestion.seriesName}
      </div>
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 14,
          color: "var(--pink)",
          lineHeight: 1.35,
        }}
      >
        {suggestion.rationale}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <button
          type="button"
          onClick={() => onAccept(suggestion)}
          style={primaryGhostBtn}
        >
          Use suggestion
        </button>
        <button
          type="button"
          onClick={onAddManual}
          style={secondaryGhostBtn}
        >
          Pick…
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Suggestion logic
// ---------------------------------------------------------------------------

const COLOR_DESCRIPTIONS: Record<GridColorProfile, string> = {
  pink: "soft pink to cool down",
  wine: "deeper wine for contrast",
  cream: "a cream breather",
  colorful: "an image-led mood-board",
};

const MIX_DESCRIPTIONS: Record<ContentMixCategory, string> = {
  engagement: "comment-bait energy",
  value: "something actionable",
  aesthetic: "an eye-candy break",
  community: "a community shoutout",
};

/**
 * Picks a single suggestion for an empty day, balancing the surrounding mix.
 * Returns null if there are no active series/templates to draw from.
 */
export function suggestForEmptyDay(
  date: Date,
  surroundingItems: CalendarItem[],
): EmptyDaySuggestion | null {
  const dateIso = isoDate(date);
  const recent = nearestNeighbours(surroundingItems, dateIso, 7);
  const activeSeries = getActiveSeriesList();
  if (activeSeries.length === 0) return null;

  // 1. What mix category is missing in the window?
  const mixCounts = new Map<ContentMixCategory, number>();
  for (const item of recent) {
    const mix = getContentMixCategory(item.series_slug, item.template_slug);
    mixCounts.set(mix, (mixCounts.get(mix) ?? 0) + 1);
  }
  const allMix: ContentMixCategory[] = [
    "engagement",
    "value",
    "aesthetic",
    "community",
  ];
  const targetMix =
    allMix.find((m) => (mixCounts.get(m) ?? 0) === 0) ??
    allMix.sort(
      (a, b) => (mixCounts.get(a) ?? 0) - (mixCounts.get(b) ?? 0),
    )[0];

  // 2. What grid colour is over-represented in the immediate row?
  const colorCounts = new Map<GridColorProfile, number>();
  for (const item of recent) {
    if (item.format !== "post") continue;
    const c = getGridColorProfile(item.series_slug, item.template_slug);
    colorCounts.set(c, (colorCounts.get(c) ?? 0) + 1);
  }
  const allColors: GridColorProfile[] = ["pink", "wine", "cream", "colorful"];
  const desiredColor =
    allColors.find((c) => (colorCounts.get(c) ?? 0) === 0) ??
    allColors.sort(
      (a, b) => (colorCounts.get(a) ?? 0) - (colorCounts.get(b) ?? 0),
    )[0];

  // 3. Pick a series matching target mix, preferring under-served slugs.
  const seriesUseCounts = new Map<string, number>();
  for (const item of recent) {
    seriesUseCounts.set(
      item.series_slug,
      (seriesUseCounts.get(item.series_slug) ?? 0) + 1,
    );
  }

  const seriesByMix = activeSeries
    .filter((s) => (s.content_mix_category ?? "value") === targetMix)
    .sort(
      (a, b) =>
        (seriesUseCounts.get(a.slug) ?? 0) -
        (seriesUseCounts.get(b.slug) ?? 0),
    );
  const seriesPool =
    seriesByMix.length > 0
      ? seriesByMix
      : [...activeSeries].sort(
          (a, b) =>
            (seriesUseCounts.get(a.slug) ?? 0) -
            (seriesUseCounts.get(b.slug) ?? 0),
        );

  // 4. Decide format. The brand cadence prefers posts on the grid, so default
  // to a post template; if the day already has a post in the same row, lean
  // story/reel for variety.
  const formatCounts = formatCountsByDate(surroundingItems, dateIso);
  let preferredFormat: ContentFormat = "post";
  if (formatCounts.post >= 2 && formatCounts.story === 0) preferredFormat = "story";
  else if (formatCounts.post >= 2 && formatCounts.reel === 0) preferredFormat = "reel";

  // 5. Find the first template in the chosen series that supports the
  // preferred format AND lands closest to the desired grid colour.
  for (const series of seriesPool) {
    const templates = getActiveTemplatesForSeries(series.slug);
    if (templates.length === 0) continue;

    const sameFormat = templates.filter((t) => t.format === preferredFormat);
    const candidatePool = sameFormat.length > 0 ? sameFormat : templates;

    const ranked = [...candidatePool].sort((a, b) => {
      const ca = getGridColorProfile(series.slug, a.slug) === desiredColor ? 0 : 1;
      const cb = getGridColorProfile(series.slug, b.slug) === desiredColor ? 0 : 1;
      if (ca !== cb) return ca - cb;
      return a.sort_order - b.sort_order;
    });
    const pick = ranked[0];
    if (!pick) continue;

    const realFormat = pick.format;
    const colorProfile = getGridColorProfile(series.slug, pick.slug);
    return {
      seriesSlug: series.slug,
      seriesName: getSeriesBySlug(series.slug)?.name ?? series.slug,
      templateSlug: pick.slug,
      templateName: pick.name,
      format: realFormat,
      colorProfile,
      mixCategory: targetMix,
      rationale: buildRationale({
        templateName: pick.name,
        targetMix,
        desiredColor: colorProfile,
      }),
    };
  }

  return null;
}

function buildRationale({
  templateName,
  targetMix,
  desiredColor,
}: {
  templateName: string;
  targetMix: ContentMixCategory;
  desiredColor: GridColorProfile;
}): string {
  return `Suggested: ${templateName} — ${MIX_DESCRIPTIONS[targetMix]}, ${COLOR_DESCRIPTIONS[desiredColor]}.`;
}

function nearestNeighbours(
  items: CalendarItem[],
  centerIso: string,
  windowDays: number,
): CalendarItem[] {
  const center = parseIsoDate(centerIso).getTime();
  const ms = windowDays * 24 * 60 * 60 * 1000;
  return items.filter((item) => {
    const t = parseIsoDate(item.scheduled_date).getTime();
    return Math.abs(t - center) <= ms;
  });
}

function formatCountsByDate(
  items: CalendarItem[],
  centerIso: string,
): Record<ContentFormat, number> {
  const center = parseIsoDate(centerIso).getTime();
  const window = 3 * 24 * 60 * 60 * 1000;
  const counts: Record<ContentFormat, number> = { story: 0, post: 0, reel: 0 };
  for (const item of items) {
    const t = parseIsoDate(item.scheduled_date).getTime();
    if (Math.abs(t - center) <= window) {
      counts[item.format] = (counts[item.format] ?? 0) + 1;
    }
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const ghostCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: "12px 12px 14px",
  background: "var(--blush)",
  border: "1px dashed rgba(75,21,40,0.3)",
  borderRadius: 12,
  cursor: "default",
  textAlign: "left",
  width: "100%",
};

const primaryGhostBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "7px 12px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};

const secondaryGhostBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "7px 12px",
  background: "transparent",
  color: "var(--wine)",
  border: "1px solid var(--wine)",
  borderRadius: 4,
  cursor: "pointer",
};

function monthGhostStyle(ringColor: string): CSSProperties {
  return {
    width: "100%",
    height: "100%",
    minHeight: 56,
    background: "transparent",
    border: `1px dashed ${ringColor}`,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    cursor: "pointer",
    opacity: 0.55,
  };
}
