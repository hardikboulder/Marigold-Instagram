/**
 * Color tokens + display strings for calendar UI.
 *
 * Pillars are the primary organizing color. Format and status are
 * secondary, surfaced as small icons / subtle borders rather than the
 * loud badges of the old design.
 */

import { getSeriesBySlug } from "@/lib/db/data-loader";
import type {
  CalendarStatus,
  ContentFormat,
  PillarSlug,
} from "@/lib/types";

export interface BadgeStyle {
  label: string;
  bg: string;
  fg: string;
}

export const FORMAT_BADGES: Record<ContentFormat, BadgeStyle> = {
  story: { label: "Story", bg: "var(--pink)", fg: "white" },
  post: { label: "Post", bg: "var(--wine)", fg: "var(--cream)" },
  reel: { label: "Reel", bg: "var(--gold)", fg: "var(--wine)" },
};

export const STATUS_BADGES: Record<CalendarStatus, BadgeStyle> = {
  suggested: { label: "Suggested", bg: "var(--mauve)", fg: "white" },
  approved: { label: "Approved", bg: "var(--mint)", fg: "var(--wine)" },
  editing: { label: "Editing", bg: "var(--peach)", fg: "var(--wine)" },
  exported: { label: "Exported", bg: "var(--gold)", fg: "var(--wine)" },
  posted: { label: "Posted", bg: "var(--wine)", fg: "var(--cream)" },
};

/**
 * Status colors used as a subtle bottom border on tiles instead of as a
 * full badge. The `var(--…)` tokens are deliberately the same family as
 * the badge bg, just applied at lower visual weight.
 */
export const STATUS_BORDER_COLOR: Record<CalendarStatus, string> = {
  suggested: "var(--mauve)",
  approved: "var(--mint)",
  editing: "var(--peach)",
  exported: "var(--gold)",
  posted: "var(--wine)",
};

export function statusBorderColor(status: CalendarStatus): string {
  return STATUS_BORDER_COLOR[status];
}

export const PILLAR_COLOR: Record<PillarSlug, string> = {
  engage: "var(--pillar-engage)",
  educate: "var(--pillar-educate)",
  inspire: "var(--pillar-inspire)",
  connect: "var(--pillar-connect)",
  convert: "var(--pillar-convert)",
};

export function pillarColor(slug: PillarSlug | string | undefined | null): string {
  if (!slug) return "var(--mauve)";
  return PILLAR_COLOR[slug as PillarSlug] ?? "var(--mauve)";
}

/**
 * Compact format icon shape descriptors. Tile renderers translate these
 * into SVG / Tailwind classes — kept as data so a future redesign can
 * swap the visual without touching every tile.
 *
 *   square      — Post (1:1)
 *   tall        — Story (9:16)
 *   triangle    — Reel (play glyph)
 *   layers      — Carousel (stacked squares; not yet a ContentFormat,
 *                 reserved for future use)
 */
export type FormatIconShape = "square" | "tall" | "triangle" | "layers";

export const FORMAT_ICON: Record<ContentFormat, FormatIconShape> = {
  post: "square",
  story: "tall",
  reel: "triangle",
};

export function formatIconShape(format: ContentFormat): FormatIconShape {
  return FORMAT_ICON[format];
}

/**
 * Legacy compatibility: callers that still ask for a "series color" are
 * resolved to the pillar color of the series. New code should use
 * `pillarColor()` directly.
 *
 * @deprecated use `pillarColor(item.pillar)` instead.
 */
export function seriesColor(slug: string): string {
  const series = getSeriesBySlug(slug);
  return pillarColor(series?.pillar);
}
