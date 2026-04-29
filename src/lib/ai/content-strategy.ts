/**
 * Content strategy logic — pure functions, no DB / no AI calls.
 *
 * The functions here decide *what shape* a week of content should take:
 *   - which series rotates in next based on mix targets,
 *   - what time of day is optimal for a given weekday,
 *   - whether a proposed post overlaps too closely with recent posts.
 *
 * Consumed by generate-content.ts to constrain prompts and seed defaults.
 */

import {
  getSeriesBySlug,
  loadBrandConfig,
  loadContentPillars,
  loadContentSeries,
} from "@/lib/db/data-loader";
import type {
  CalendarItem,
  ContentMixCategory,
  GridColorProfile,
  PillarSlug,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Grid awareness — color profiles, content mix, sequencing, health score
// ---------------------------------------------------------------------------

/**
 * Per-template overrides for the dominant grid colour. Use this to override a
 * series default when a specific template skews differently — e.g. a BvM
 * episode is mostly blush/pink, but the Confessional Title slide is wine.
 *
 * If a template_slug isn't here we fall back to the series' grid_color_profile.
 */
const TEMPLATE_COLOR_OVERRIDES: Record<string, GridColorProfile> = {
  // Bridezilla vs. Momzilla — bride side leads pink, mom side leans wine.
  "bvm-story": "pink",
  "bvm-post": "pink",
  "bvm-reel": "pink",

  // Confessional — title is wine; cards are cream sticky-notes.
  "confessional-title": "wine",
  "confessional-card": "cream",
  "confessional-cta": "cream",
  "confessional-reel": "wine",

  // Hot Takes — story slide is pink, post + reel land wine.
  "hot-take-reel": "wine",

  // Vendor templates — quote reel is wine, feature/portfolio are image-led.
  "vendor-quote": "cream",
  "vendor-quote-reel": "wine",
  "feature-callout": "pink",
  "vendor-feature-post": "colorful",
  "vendor-tip-carousel": "cream",
  "vendor-portfolio-reel": "colorful",

  // Stat Callout — wine background, cream type.
  "stat-callout": "wine",

  // Real Bride Diaries — diary entries are cream-on-cream.
  "diary-snippet-reel": "cream",

  // Discover Your... — title slide carries the quiz colour, results vary.
  "quiz-result-post": "colorful",
  "quiz-title-v2": "colorful",
  "quiz-result-v2": "colorful",

  // Color Palette and Mood Board are explicitly multi-colour grid breathers.
  "mood-board-reel": "colorful",
};

/**
 * Per-template overrides for content mix category. Mostly mirrors the series
 * default; use this when a single template plays a different role (e.g. a
 * value carousel inside a community series).
 */
const TEMPLATE_MIX_OVERRIDES: Record<string, ContentMixCategory> = {
  "vendor-tip-carousel": "value",
  "planner-tips-carousel": "value",
  "budget-tips-carousel": "value",
  "submission-cta-story": "community",
  "user-story-reel": "community",
};

const DEFAULT_COLOR_PROFILE: GridColorProfile = "cream";
const DEFAULT_MIX_CATEGORY: ContentMixCategory = "value";

const COLUMNS_PER_ROW = 3;

/**
 * Looks up the dominant grid colour for a given series + template combo.
 * Template overrides win; series default is the fallback.
 */
export function getGridColorProfile(
  seriesSlug: string,
  templateSlug?: string,
): GridColorProfile {
  if (templateSlug && TEMPLATE_COLOR_OVERRIDES[templateSlug]) {
    return TEMPLATE_COLOR_OVERRIDES[templateSlug];
  }
  const series = loadContentSeries().find((s) => s.slug === seriesSlug);
  return series?.grid_color_profile ?? DEFAULT_COLOR_PROFILE;
}

/**
 * Looks up the strategic content-mix category for a series + template combo.
 */
export function getContentMixCategory(
  seriesSlug: string,
  templateSlug?: string,
): ContentMixCategory {
  if (templateSlug && TEMPLATE_MIX_OVERRIDES[templateSlug]) {
    return TEMPLATE_MIX_OVERRIDES[templateSlug];
  }
  const series = loadContentSeries().find((s) => s.slug === seriesSlug);
  return series?.content_mix_category ?? DEFAULT_MIX_CATEGORY;
}

/**
 * Tags an item with its color profile + mix category. Pure helper used by the
 * sequencer and the grid health scorer so they don't keep recomputing it.
 */
interface GridTag {
  color: GridColorProfile;
  mix: ContentMixCategory;
}

function tagItem(item: CalendarItem): GridTag {
  return {
    color: getGridColorProfile(item.series_slug, item.template_slug),
    mix: getContentMixCategory(item.series_slug, item.template_slug),
  };
}

// ---------------------------------------------------------------------------
// Pillar rotation
// ---------------------------------------------------------------------------

interface PillarShare {
  pillar_slug: PillarSlug;
  target: number; // 0..1
  actual: number; // 0..1 within the recent window
  delta: number;  // target - actual (positive = under-served)
}

/**
 * Returns the pillar slug that should come next, based on:
 *   1. The pillar_mix targets in brand-config (defaults to the data file).
 *   2. How under-served each pillar is in the supplied recent posts.
 *
 * Recency window: the caller decides what to pass in. The strategy treats the
 * full input as the relevant window — usually the last ~14 days or one week.
 */
export function getNextPillarInRotation(
  recentPosts: CalendarItem[],
): PillarSlug {
  const config = loadBrandConfig();
  const strategy = config.content_strategy.config_value;
  const allPillars = loadContentPillars();
  const fallback: { pillar_slug: PillarSlug; share: number }[] = allPillars.map(
    (p) => ({ pillar_slug: p.slug, share: p.default_share }),
  );
  const targets = strategy.pillar_mix && strategy.pillar_mix.length > 0
    ? strategy.pillar_mix
    : fallback;

  if (recentPosts.length === 0) {
    const ranked = [...targets].sort((a, b) => b.share - a.share);
    return ranked[0]?.pillar_slug ?? "engage";
  }

  const total = recentPosts.length;
  const counts = new Map<PillarSlug, number>();
  for (const post of recentPosts) {
    counts.set(post.pillar, (counts.get(post.pillar) ?? 0) + 1);
  }

  const shares: PillarShare[] = targets.map((t) => {
    const actual = (counts.get(t.pillar_slug) ?? 0) / total;
    return {
      pillar_slug: t.pillar_slug,
      target: t.share,
      actual,
      delta: t.share - actual,
    };
  });

  const last = recentPosts[recentPosts.length - 1];
  const lastSlug = last?.pillar;

  shares.sort((a, b) => {
    if (a.pillar_slug === lastSlug && b.pillar_slug !== lastSlug) return 1;
    if (b.pillar_slug === lastSlug && a.pillar_slug !== lastSlug) return -1;
    return b.delta - a.delta; // most under-served first
  });

  return shares[0]?.pillar_slug ?? "engage";
}

/**
 * Returns the series slug that should come next. Picks a pillar by mix
 * targets, then chooses the least-recently-used active series inside that
 * pillar so creators see variety across templates within a pillar.
 */
export function getNextSeriesInRotation(recentPosts: CalendarItem[]): string {
  const pillar = getNextPillarInRotation(recentPosts);
  const seriesInPillar = loadContentSeries()
    .filter((s) => s.is_active && s.pillar === pillar)
    .map((s) => s.slug);
  if (seriesInPillar.length === 0) return "general-purpose";

  // Score by recency: lower count = more eligible. Tie-break by sort_order.
  const counts = new Map<string, number>();
  for (const post of recentPosts) {
    counts.set(post.series_slug, (counts.get(post.series_slug) ?? 0) + 1);
  }
  const lastSlug =
    recentPosts.length > 0
      ? recentPosts[recentPosts.length - 1].series_slug
      : null;

  return [...seriesInPillar].sort((a, b) => {
    if (a === lastSlug && b !== lastSlug) return 1;
    if (b === lastSlug && a !== lastSlug) return -1;
    const ca = counts.get(a) ?? 0;
    const cb = counts.get(b) ?? 0;
    return ca - cb;
  })[0];
}

// ---------------------------------------------------------------------------
// Posting time
// ---------------------------------------------------------------------------

/**
 * Suggests a posting time (HH:MM, 24h) for a given JS day-of-week (0=Sunday).
 *
 * Heuristic — based on common Instagram engagement windows for a US/UK desi
 * audience. Evening anchor 18:30–20:30 most days; weekends shift earlier.
 */
export function getOptimalPostingTime(dayOfWeek: number): string {
  switch (dayOfWeek) {
    case 0: // Sunday
      return "11:30";
    case 1: // Monday
      return "19:00";
    case 2: // Tuesday
      return "19:30";
    case 3: // Wednesday — Reels anchor
      return "20:00";
    case 4: // Thursday
      return "19:30";
    case 5: // Friday — high engagement
      return "18:30";
    case 6: // Saturday
      return "10:30";
    default:
      return "19:00";
  }
}

// ---------------------------------------------------------------------------
// Overlap detection
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for",
  "with", "is", "are", "was", "were", "be", "been", "being", "i", "you", "he",
  "she", "it", "we", "they", "this", "that", "these", "those", "my", "your",
  "her", "his", "our", "their", "as", "if", "so", "do", "did", "does", "have",
  "has", "had", "not", "no", "yes", "from", "by", "about", "into", "out",
]);

function tokenize(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function contentSignature(post: CalendarItem): Set<string> {
  const tokens: string[] = [];
  for (const value of Object.values(post.content_data)) {
    tokens.push(...tokenize(value));
  }
  if (post.caption) tokens.push(...tokenize(post.caption));
  return new Set(tokens);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface OverlapResult {
  overlaps: boolean;
  /** Highest similarity score against any recent post (0..1). */
  similarity: number;
  /** ID of the most similar recent post, if any. */
  conflictingPostId: string | null;
  /** Threshold that triggered the warning. */
  threshold: number;
}

/**
 * Returns whether a proposed post is too similar to anything in `recentPosts`.
 * Uses topic-token Jaccard similarity. Threshold of 0.35 catches obvious
 * repeats (same topic + overlapping vocabulary) without false-positiving on
 * shared brand vocab like "mandap" or "lehenga".
 */
export function shouldAvoidOverlap(
  proposedContent: CalendarItem,
  recentPosts: CalendarItem[],
  threshold = 0.35,
): OverlapResult {
  const target = contentSignature(proposedContent);

  let best = 0;
  let conflictId: string | null = null;
  for (const post of recentPosts) {
    if (post.id === proposedContent.id) continue;
    const score = jaccard(target, contentSignature(post));
    if (score > best) {
      best = score;
      conflictId = post.id;
    }
  }

  return {
    overlaps: best >= threshold,
    similarity: best,
    conflictingPostId: best > 0 ? conflictId : null,
    threshold,
  };
}

// ---------------------------------------------------------------------------
// Grid sequencing
// ---------------------------------------------------------------------------

/** A planned slot the sequencer knows about — only the fields it cares about. */
export interface GridSlot {
  series_slug: string;
  template_slug: string;
  /** Optional stable id so callers can map back to their source items. */
  id?: string;
}

export interface GridSequencerInput {
  /** Posts to sequence into the new rows (typically: feed posts only). */
  candidates: GridSlot[];
  /**
   * The last full row of the existing grid (newest at top). Used to seed
   * vertical-neighbour color and series checks for the first row of new
   * content. Pass [] when starting from an empty grid.
   */
  seedRow?: GridSlot[];
  /**
   * Hard cap on how many rows to plan. The sequencer stops once it runs out
   * of candidates or hits this cap (default: ceil(candidates / 3)).
   */
  maxRows?: number;
}

export interface GridSequencerResult {
  /** Ordered candidate slots, grid-position stamped. */
  ordered: (GridSlot & { row: number; column: number })[];
  /** Slots that couldn't be placed cleanly (rare — only with bad input). */
  unplaced: GridSlot[];
}

/**
 * Re-orders candidate posts into 3-column rows with the following preferences,
 * applied as a weighted score per (slot, position) pairing:
 *
 *   1. Avoid two adjacent cells (left/right or up/down) sharing the same
 *      dominant grid colour.
 *   2. Avoid two adjacent cells sharing the same series slug.
 *   3. Avoid three cells in a row sharing the same content mix category.
 *   4. Prefer at least one "visual breathing" post (mood-board, color-palette,
 *      or vendor-feature with image — i.e. colorful profile) per 2 rows.
 *
 * Greedy by row+column. Not optimal, but deterministic and good enough for
 * planning a week (typically 2 grid posts) plus rebalancing existing grids.
 */
export function sequenceGrid(input: GridSequencerInput): GridSequencerResult {
  const remaining = input.candidates.map((c) => ({
    slot: c,
    tag: tagItem({
      ...emptyCalendarItem(),
      series_slug: c.series_slug,
      template_slug: c.template_slug,
    }),
  }));

  const totalRows =
    input.maxRows ?? Math.ceil(remaining.length / COLUMNS_PER_ROW);

  // Build the grid as a 2D array of GridTag-or-null. Pre-fill row -1 with the
  // seed row so the first new row "sees" the prior row above it.
  const placed: ({ slot: GridSlot; tag: GridTag } | null)[][] = [];
  if (input.seedRow && input.seedRow.length > 0) {
    placed.push(
      input.seedRow
        .slice(0, COLUMNS_PER_ROW)
        .map((s) => ({
          slot: s,
          tag: tagItem({
            ...emptyCalendarItem(),
            series_slug: s.series_slug,
            template_slug: s.template_slug,
          }),
        })),
    );
  }
  const seedOffset = placed.length; // 0 or 1

  for (let row = 0; row < totalRows; row++) {
    const newRow: ({ slot: GridSlot; tag: GridTag } | null)[] = [
      null,
      null,
      null,
    ];
    placed.push(newRow);

    for (let col = 0; col < COLUMNS_PER_ROW; col++) {
      if (remaining.length === 0) break;

      // Score every remaining candidate against this position.
      let bestIdx = -1;
      let bestScore = -Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const score = scorePlacement(
          placed,
          row + seedOffset,
          col,
          remaining[i].tag,
          remaining[i].slot,
        );
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      if (bestIdx >= 0) {
        const [picked] = remaining.splice(bestIdx, 1);
        newRow[col] = picked;
      }
    }

    // After every 2 new rows, if neither contained a "colorful" breather and
    // there's still a colorful candidate left, swap it in for the weakest cell.
    if (row > 0 && row % 2 === 1) {
      ensureBreather(placed, row + seedOffset - 1, row + seedOffset, remaining);
    }

    if (remaining.length === 0) break;
  }

  // Flatten the placements (excluding the seed row) into the result.
  const ordered: (GridSlot & { row: number; column: number })[] = [];
  for (let r = seedOffset; r < placed.length; r++) {
    for (let c = 0; c < COLUMNS_PER_ROW; c++) {
      const cell = placed[r][c];
      if (cell) {
        ordered.push({
          ...cell.slot,
          row: r - seedOffset,
          column: c,
        });
      }
    }
  }

  return {
    ordered,
    unplaced: remaining.map((r) => r.slot),
  };
}

function emptyCalendarItem(): CalendarItem {
  return {
    id: "",
    scheduled_date: "",
    scheduled_time: null,
    series_slug: "",
    pillar: "engage",
    template_slug: "",
    format: "post",
    status: "suggested",
    content_data: {},
    caption: null,
    hashtags: [],
    ai_rationale: null,
    generation_prompt: null,
    sort_order: 0,
    created_at: "",
    updated_at: "",
  };
}

function scorePlacement(
  grid: ({ slot: GridSlot; tag: GridTag } | null)[][],
  row: number,
  col: number,
  tag: GridTag,
  slot: GridSlot,
): number {
  let score = 100;

  const left = col > 0 ? grid[row]?.[col - 1] : null;
  const above = row > 0 ? grid[row - 1]?.[col] : null;

  // Adjacent same colour — heavy penalty.
  if (left && left.tag.color === tag.color) score -= 40;
  if (above && above.tag.color === tag.color) score -= 40;

  // Adjacent same series — equally heavy.
  if (left && left.slot.series_slug === slot.series_slug) score -= 35;
  if (above && above.slot.series_slug === slot.series_slug) score -= 35;

  // Adjacent same pillar — visual rhythm penalty (alternate strategic
  // purposes across the row so the grid doesn't read as a stripe of one
  // pillar). Slightly lighter than the series penalty because there are
  // only 5 pillars vs 21 series.
  const slotPillar = getSeriesBySlug(slot.series_slug)?.pillar;
  if (slotPillar) {
    const leftPillar = left
      ? getSeriesBySlug(left.slot.series_slug)?.pillar
      : null;
    const abovePillar = above
      ? getSeriesBySlug(above.slot.series_slug)?.pillar
      : null;
    if (leftPillar && leftPillar === slotPillar) score -= 22;
    if (abovePillar && abovePillar === slotPillar) score -= 22;

    // Three same-pillar in a row → harder penalty.
    if (col === 2) {
      const c0 = grid[row][0];
      const c1 = grid[row][1];
      const c0Pillar = c0 ? getSeriesBySlug(c0.slot.series_slug)?.pillar : null;
      const c1Pillar = c1 ? getSeriesBySlug(c1.slot.series_slug)?.pillar : null;
      if (
        c0Pillar &&
        c1Pillar &&
        c0Pillar === slotPillar &&
        c1Pillar === slotPillar
      ) {
        score -= 30;
      }
    }
  }

  // Same mix category as both prior cells in the row → penalty.
  if (col === 2) {
    const c0 = grid[row][0];
    const c1 = grid[row][1];
    if (c0 && c1 && c0.tag.mix === tag.mix && c1.tag.mix === tag.mix) {
      score -= 25;
    }
  }

  // Three text-heavy in a row → penalty (text-heavy ≈ pink/wine/cream).
  if (col === 2) {
    const c0 = grid[row][0];
    const c1 = grid[row][1];
    if (
      c0 &&
      c1 &&
      c0.tag.color !== "colorful" &&
      c1.tag.color !== "colorful" &&
      tag.color !== "colorful"
    ) {
      score -= 18;
    }
  }

  // Tiny tie-breaker: mild preference for alternating mix categories left→right.
  if (left && left.tag.mix !== tag.mix) score += 5;

  return score;
}

function ensureBreather(
  grid: ({ slot: GridSlot; tag: GridTag } | null)[][],
  rowA: number,
  rowB: number,
  remaining: { slot: GridSlot; tag: GridTag }[],
): void {
  const window = [grid[rowA] ?? [], grid[rowB] ?? []].flat();
  const hasBreather = window.some((c) => c?.tag.color === "colorful");
  if (hasBreather) return;

  const breatherIdx = remaining.findIndex((r) => r.tag.color === "colorful");
  if (breatherIdx < 0) return;

  // Find the lowest-variety cell in the window to swap out — a non-colorful
  // cell that shares its colour with at least one neighbour in the window.
  let swapTarget: { row: number; col: number } | null = null;
  for (const r of [rowA, rowB]) {
    for (let c = 0; c < COLUMNS_PER_ROW; c++) {
      const cell = grid[r]?.[c];
      if (!cell || cell.tag.color === "colorful") continue;
      const sameColorNeighbours = window.filter(
        (n) => n && n !== cell && n.tag.color === cell.tag.color,
      ).length;
      if (sameColorNeighbours > 0) {
        swapTarget = { row: r, col: c };
        break;
      }
    }
    if (swapTarget) break;
  }
  if (!swapTarget) return;

  const evicted = grid[swapTarget.row][swapTarget.col]!;
  const [breather] = remaining.splice(breatherIdx, 1);
  grid[swapTarget.row][swapTarget.col] = breather;
  remaining.push(evicted);
}

// ---------------------------------------------------------------------------
// Grid Health Score
// ---------------------------------------------------------------------------

export interface GridHealthIssue {
  severity: "warn" | "info";
  /** Zero-indexed row this issue refers to (or null if grid-wide). */
  row: number | null;
  message: string;
}

export interface GridHealthScore {
  /** Posts inspected (placeholders/auxiliary excluded). */
  postsAnalyzed: number;
  /** 0–100 — penalty for repeated dominant colours adjacent to each other. */
  colorVariety: number;
  /** 0–100 — penalty for same pillar clusters / same pillar 3-in-a-row. */
  pillarMix: number;
  /**
   * Legacy alias for `pillarMix` — kept so older UI code keeps compiling
   * during the rollout.
   * @deprecated use `pillarMix`
   */
  seriesMix: number;
  /** 0–100 — penalty for missing breathers + same mix-category stripes. */
  visualRhythm: number;
  /**
   * Weighted average — color variety 40%, pillar mix 30%, rhythm 30%.
   */
  overall: number;
  /** Human-readable issues to surface in the UI. */
  issues: GridHealthIssue[];
}

/**
 * Scores a sequence of feed posts (rendered top-left → bottom-right by date)
 * on three axes: color variety, series mix, visual rhythm. Returns a
 * structured score that the grid view can render as a card.
 */
export function computeGridHealthScore(posts: CalendarItem[]): GridHealthScore {
  const tagged = posts.map((p) => ({ post: p, tag: tagItem(p) }));
  const issues: GridHealthIssue[] = [];

  if (tagged.length === 0) {
    return {
      postsAnalyzed: 0,
      colorVariety: 100,
      pillarMix: 100,
      seriesMix: 100,
      visualRhythm: 100,
      overall: 100,
      issues: [],
    };
  }

  // Build a row view (3 columns).
  const rows: { post: CalendarItem; tag: GridTag }[][] = [];
  for (let i = 0; i < tagged.length; i += COLUMNS_PER_ROW) {
    rows.push(tagged.slice(i, i + COLUMNS_PER_ROW));
  }

  // ---- Color variety ----
  let colorPenalty = 0;
  let colorChecks = 0;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    // Horizontal neighbour collisions.
    for (let c = 1; c < row.length; c++) {
      colorChecks++;
      if (row[c].tag.color === row[c - 1].tag.color) {
        colorPenalty++;
      }
    }
    // Vertical neighbour collisions (with the previous row).
    if (r > 0) {
      const prev = rows[r - 1];
      for (let c = 0; c < row.length; c++) {
        if (!prev[c]) continue;
        colorChecks++;
        if (row[c].tag.color === prev[c].tag.color) {
          colorPenalty++;
        }
      }
    }
    // Three-in-a-row of the same dominant colour — call it out explicitly.
    if (row.length === COLUMNS_PER_ROW) {
      const colors = row.map((cell) => cell.tag.color);
      if (colors.every((c) => c === colors[0])) {
        const dominant = colors[0];
        const replacement = recommendReplacement(dominant);
        issues.push({
          severity: "warn",
          row: r,
          message: `Row ${r + 1} has three ${prettyColor(dominant)}-dominant posts — consider swapping one for a ${replacement}.`,
        });
      }
    }
  }
  const colorVariety =
    colorChecks === 0
      ? 100
      : Math.max(0, Math.round(100 - (colorPenalty / colorChecks) * 100));

  // ---- Pillar mix (replaces the old series-only mix score) ----
  let pillarPenalty = 0;
  let pillarChecks = 0;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 1; c < row.length; c++) {
      pillarChecks++;
      if (row[c].post.pillar === row[c - 1].post.pillar) {
        pillarPenalty++;
      }
    }
    if (row.length === COLUMNS_PER_ROW) {
      const pillars = row.map((cell) => cell.post.pillar);
      if (pillars.every((p) => p === pillars[0])) {
        const stripe = pillars[0].toUpperCase();
        const swap = recommendPillarSwap(pillars[0]);
        issues.push({
          severity: "warn",
          row: r,
          message: `Row ${r + 1} is three ${stripe} posts in a row — add ${swap} for visual variety.`,
        });
      }
    }
    // Vertical pillar repetition — penalize same-pillar columns 2-deep.
    if (r > 0) {
      const prev = rows[r - 1];
      for (let c = 0; c < row.length; c++) {
        if (!prev[c]) continue;
        pillarChecks++;
        if (row[c].post.pillar === prev[c].post.pillar) {
          pillarPenalty++;
        }
      }
    }
  }
  const pillarMix =
    pillarChecks === 0
      ? 100
      : Math.max(0, Math.round(100 - (pillarPenalty / pillarChecks) * 100));
  const seriesMix = pillarMix;

  // ---- Visual rhythm: breathers + mix alternation ----
  let rhythmPenalty = 0;
  let rhythmChecks = 0;
  // Every two rows should include at least one "colorful" breather.
  for (let r = 0; r < rows.length; r += 2) {
    const window = rows.slice(r, r + 2).flat();
    if (window.length < COLUMNS_PER_ROW) break; // partial window — skip
    rhythmChecks++;
    const hasBreather = window.some((cell) => cell.tag.color === "colorful");
    if (!hasBreather) {
      rhythmPenalty++;
      issues.push({
        severity: "info",
        row: r,
        message: `Rows ${r + 1}–${r + 2} have no visual breather — add a Mood Board, Color Palette, or Vendor Feature.`,
      });
    }
  }
  // 3-in-a-row of the same mix category counts as a stripe.
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === COLUMNS_PER_ROW) {
      rhythmChecks++;
      const cats = row.map((cell) => cell.tag.mix);
      if (cats.every((c) => c === cats[0])) {
        rhythmPenalty++;
        issues.push({
          severity: "warn",
          row: r,
          message: `Row ${r + 1} is three ${cats[0]} posts in a row — alternate with a different content type.`,
        });
      }
    }
  }
  const visualRhythm =
    rhythmChecks === 0
      ? 100
      : Math.max(0, Math.round(100 - (rhythmPenalty / rhythmChecks) * 100));

  // Weighted: color 40%, pillar 30%, rhythm 30%.
  const overall = Math.round(
    colorVariety * 0.4 + pillarMix * 0.3 + visualRhythm * 0.3,
  );

  return {
    postsAnalyzed: tagged.length,
    colorVariety,
    pillarMix,
    seriesMix,
    visualRhythm,
    overall,
    issues,
  };
}

function recommendPillarSwap(p: PillarSlug): string {
  switch (p) {
    case "engage":
      return "an INSPIRE or EDUCATE post";
    case "educate":
      return "an INSPIRE or CONNECT post";
    case "inspire":
      return "an ENGAGE or CONNECT post";
    case "connect":
      return "an ENGAGE or EDUCATE post";
    case "convert":
      return "an INSPIRE or ENGAGE post";
  }
}

function prettyColor(c: GridColorProfile): string {
  switch (c) {
    case "pink":
      return "pink";
    case "wine":
      return "wine";
    case "cream":
      return "cream";
    case "colorful":
      return "image-led";
  }
}

function recommendReplacement(c: GridColorProfile): string {
  switch (c) {
    case "wine":
      return "Mood Board or Vendor Feature";
    case "pink":
      return "Confessional card or Diary Entry (cream)";
    case "cream":
      return "Hot Take Post or Stat Callout (wine)";
    case "colorful":
      return "Hot Take Post or Confessional card";
  }
}

// ---------------------------------------------------------------------------
// Suggest Fix — propose a reorder for the current grid
// ---------------------------------------------------------------------------

export interface GridFixSuggestion {
  /** Newly suggested order (post ids in row-major order). */
  newOrder: string[];
  /** Concise human-readable summary of what changed. */
  rationale: string;
  /** Predicted health score after applying the suggestion. */
  predictedScore: GridHealthScore;
}

/**
 * Given a current run of feed posts, returns a re-ordering that the sequencer
 * predicts will improve the grid health score. Returns null when the current
 * order is already optimal (or close enough that we don't recommend churn).
 */
export function suggestGridFix(
  posts: CalendarItem[],
): GridFixSuggestion | null {
  if (posts.length < COLUMNS_PER_ROW) return null;

  const before = computeGridHealthScore(posts);
  if (before.overall >= 92) return null; // already healthy — don't suggest churn

  const slots: GridSlot[] = posts.map((p) => ({
    id: p.id,
    series_slug: p.series_slug,
    template_slug: p.template_slug,
  }));

  const sequenced = sequenceGrid({ candidates: slots });

  const idToPost = new Map(posts.map((p) => [p.id, p]));
  const newOrder = sequenced.ordered
    .map((s) => s.id)
    .filter((id): id is string => Boolean(id));
  const reorderedPosts = newOrder
    .map((id) => idToPost.get(id))
    .filter((p): p is CalendarItem => Boolean(p));

  const after = computeGridHealthScore(reorderedPosts);
  if (after.overall <= before.overall) return null;

  return {
    newOrder,
    rationale: `Improves grid health from ${before.overall} → ${after.overall} by breaking up colour and series clusters.`,
    predictedScore: after,
  };
}
