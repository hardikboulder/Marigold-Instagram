/**
 * Claude-powered content generation.
 *
 * Each function here:
 *   1. Composes a 4-layer system prompt for the relevant series.
 *   2. Sends a structured user message asking for JSON only.
 *   3. Parses the response into our local CalendarItem / ContentData shapes.
 *
 * Server-side only — relies on ANTHROPIC_API_KEY from process.env. Importing
 * this module from a Client Component will throw. Use the /api/generate route.
 */

import Anthropic from "@anthropic-ai/sdk";

import {
  getSeriesBySlug,
  getTemplateBySlug,
  getTemplatesBySeries,
  loadBrandConfig,
  loadContentSeries,
  loadTemplateDefinitions,
} from "@/lib/db/data-loader";
import type {
  CalendarItem,
  ContentData,
  ContentFormat,
  EditableField,
  PillarSlug,
  TemplateDefinition,
} from "@/lib/types";

import {
  getContentMixCategory,
  getGridColorProfile,
  getNextSeriesInRotation,
  getOptimalPostingTime,
  sequenceGrid,
  type GridSlot,
} from "./content-strategy";
import { buildSystemPrompt } from "./system-prompt";

// ---------------------------------------------------------------------------
// Anthropic client
// ---------------------------------------------------------------------------

const MODEL_ID = "claude-sonnet-4-20250514";

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local before calling the AI engine.",
    );
  }
  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function describeEditableFields(fields: EditableField[]): string {
  return fields
    .map((f) => {
      const constraints: string[] = [`type=${f.type}`];
      if (f.maxLength) constraints.push(`maxLength=${f.maxLength}`);
      if (f.min !== undefined) constraints.push(`min=${f.min}`);
      if (f.max !== undefined) constraints.push(`max=${f.max}`);
      if (f.options?.length) {
        constraints.push(
          `options=[${f.options.map((o) => `"${o.value}"`).join(", ")}]`,
        );
      }
      if (f.required) constraints.push("required");
      const def = f.default !== undefined ? ` (default: ${JSON.stringify(f.default)})` : "";
      const help = f.helpText ? ` — ${f.helpText}` : "";
      return `- "${f.key}" — ${f.label} [${constraints.join(", ")}]${def}${help}`;
    })
    .join("\n");
}

function extractJsonFromResponse<T>(raw: string): T {
  let text = raw.trim();
  // Strip code fences if Claude adds them despite the contract.
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenced) text = fenced[1].trim();

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    // Recover the largest JSON object/array substring.
    const firstBrace = text.search(/[\[{]/);
    const lastBrace = Math.max(text.lastIndexOf("]"), text.lastIndexOf("}"));
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const slice = text.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(slice) as T;
      } catch {
        // fall through
      }
    }
    throw new Error(
      `Claude response was not valid JSON: ${(err as Error).message}\n---\n${raw}`,
    );
  }
}

async function callClaude(opts: {
  system: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<string> {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: opts.maxTokens ?? 2048,
    system: opts.system,
    messages: [{ role: "user", content: opts.userMessage }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Claude returned an empty response.");
  }
  return text;
}

function newItemId(): string {
  // Avoid Node-only randomUUID requirement — works in Node 19+ & edge runtimes.
  return `cal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function dayOfWeekName(date: Date): string {
  return [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][date.getDay()];
}

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function pickDefaultTemplateForSeries(
  seriesSlug: string,
  format?: ContentFormat,
): TemplateDefinition | null {
  const templates = getTemplatesBySeries(seriesSlug).filter((t) => t.is_active);
  if (templates.length === 0) return null;
  if (format) {
    const match = templates.find((t) => t.format === format);
    if (match) return match;
  }
  return templates[0];
}

// ---------------------------------------------------------------------------
// 1. generateCalendarWeek
// ---------------------------------------------------------------------------

interface PlannedSlot {
  day_offset: number; // 0..6 from startDate
  series_slug: string;
  template_slug: string;
  format: ContentFormat;
  rationale_seed: string;
}

interface RawWeekItem {
  day_offset: number;
  series_slug: string;
  template_slug: string;
  format: ContentFormat;
  content_data: ContentData;
  caption: string;
  hashtags: string[];
  rationale: string;
}

function planWeekSlots(): PlannedSlot[] {
  const config = loadBrandConfig();
  const cadence = config.content_strategy.config_value.posting_cadence;
  const totalPosts = cadence.reduce((sum, c) => sum + c.per_week, 0);
  const target = Math.min(Math.max(totalPosts, 4), 5);

  // Build the format pool from cadence (e.g. 3 stories, 2 posts, 1 reel).
  const formatPool: ContentFormat[] = [];
  for (const c of cadence) {
    for (let i = 0; i < c.per_week; i++) formatPool.push(c.format);
  }
  // Trim/extend to `target`.
  while (formatPool.length > target) formatPool.pop();
  while (formatPool.length < target) formatPool.push("story");

  // Distribute across days of the week — Mon, Tue, Wed, Thu, Fri are the
  // priority slots. Saturday and Sunday only get a slot if target > 5.
  const dayPriority = [1, 3, 5, 2, 4, 6, 0]; // Mon, Wed, Fri, Tue, Thu, Sat, Sun
  const slots: PlannedSlot[] = [];
  const fakeHistory: CalendarItem[] = [];

  for (let i = 0; i < formatPool.length; i++) {
    const format = formatPool[i];
    const dayOffset = dayPriority[i % dayPriority.length];

    const seriesSlug = getNextSeriesInRotation(fakeHistory);
    const supported = getSeriesBySlug(seriesSlug)?.supported_formats ?? [];
    const useFormat = supported.includes(format) ? format : supported[0] ?? "story";
    const template = pickDefaultTemplateForSeries(seriesSlug, useFormat);

    if (!template) continue;

    slots.push({
      day_offset: dayOffset,
      series_slug: seriesSlug,
      template_slug: template.slug,
      format: useFormat,
      rationale_seed: `Pillar rotation: ${getSeriesBySlug(seriesSlug)?.pillar ?? "engage"} → ${seriesSlug} balances mix targets.`,
    });

    fakeHistory.push({
      id: `seed_${i}`,
      scheduled_date: "",
      scheduled_time: null,
      series_slug: seriesSlug,
      pillar:
        (getSeriesBySlug(seriesSlug)?.pillar as PillarSlug) ?? "engage",
      template_slug: template.slug,
      format: useFormat,
      status: "suggested",
      content_data: {},
      caption: null,
      hashtags: [],
      ai_rationale: null,
      generation_prompt: null,
      sort_order: 0,
      created_at: "",
      updated_at: "",
    });
  }

  slots.sort((a, b) => a.day_offset - b.day_offset);
  return slots;
}

export interface GenerateWeekResult {
  /** All generated items (posts, stories, reels) merged together. */
  items: CalendarItem[];
  /** Grid posts in their recommended row-major order. */
  gridOrder: CalendarItem[];
  /** Story + reel schedule, ordered by date then time. */
  storyReelSchedule: CalendarItem[];
  /** Concise grid-reasoning summary surfaced in the UI. */
  gridReasoning: string;
}

/**
 * Generates 4–5 content items for the week starting at `startDate`.
 *
 * Grid-awareness:
 *   - The seed plan is post-processed by `sequenceGrid` so feed posts land in
 *     a row-major order that breaks up adjacent colour + series collisions.
 *   - Pass `previousWeekItems` so the sequencer can read the last row of the
 *     existing grid and avoid stacking the same colour vertically.
 *   - Story/reel slots are excluded from the grid — they're returned as a
 *     parallel schedule (`storyReelSchedule`) so the UI can plan them around
 *     the grid posts.
 *
 * Returns a `GenerateWeekResult` with the merged item list plus grid + aux
 * breakdowns. Items are not persisted — caller decides what to keep.
 */
export async function generateCalendarWeek(
  startDate: Date,
  previousWeekItems: CalendarItem[] = [],
): Promise<GenerateWeekResult> {
  const slots = planWeekSlots();
  const allTemplates = loadTemplateDefinitions();

  // Seed row = the most recent full row of feed posts in the prior history.
  // We reverse-sort by date so newest comes first, then take the top 3 posts.
  const seedRow: GridSlot[] = previousWeekItems
    .filter((item) => item.format === "post")
    .sort((a, b) => (a.scheduled_date < b.scheduled_date ? 1 : -1))
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      series_slug: item.series_slug,
      template_slug: item.template_slug,
    }));

  const slotsForPrompt = slots.map((s) => {
    const template = allTemplates.find((t) => t.slug === s.template_slug);
    return {
      day_offset: s.day_offset,
      day_of_week: dayOfWeekName(addDays(startDate, s.day_offset)),
      series_slug: s.series_slug,
      template_slug: s.template_slug,
      format: s.format,
      editable_fields: template?.editable_fields ?? [],
      template_name: template?.name ?? s.template_slug,
      grid_color_profile: getGridColorProfile(s.series_slug, s.template_slug),
      content_mix_category: getContentMixCategory(s.series_slug, s.template_slug),
    };
  });

  const seedRowForPrompt = seedRow.map((s) => ({
    series_slug: s.series_slug,
    template_slug: s.template_slug,
    grid_color_profile: getGridColorProfile(s.series_slug, s.template_slug),
  }));

  const system = buildSystemPrompt();
  const userMessage = [
    "Plan the next 7 days of content. Below are the pre-decided slots — series, template, format, and the schema each template expects. Fill in `content_data` for each slot, write a caption + hashtags, and explain the rationale.",
    "",
    `Week start: ${isoDate(startDate)} (${dayOfWeekName(startDate)})`,
    "",
    "**Grid awareness**: Feed posts (format=\"post\") render in 3-column rows on the Instagram grid. The slot list already includes each post's `grid_color_profile` (pink / wine / cream / colorful) and `content_mix_category` (engagement / value / aesthetic / community). When you reason about the week, use these to avoid adjacent colour / series / mix-category collisions.",
    "",
    "Last row of the existing grid (newest at left — your first new row sits directly below this):",
    "```json",
    JSON.stringify(seedRowForPrompt, null, 2),
    "```",
    "",
    "Slots:",
    "```json",
    JSON.stringify(slotsForPrompt, null, 2),
    "```",
    "",
    "Output a JSON array. Each item must match this shape exactly:",
    "```json",
    `[
  {
    "day_offset": 0,
    "series_slug": "...",
    "template_slug": "...",
    "format": "story|post|reel",
    "content_data": { ... matches the template's editable_fields ... },
    "caption": "Instagram caption — 3-6 short lines, ends with a question or CTA.",
    "hashtags": ["#TheMarigold", "#DesiWedding", "..."],
    "rationale": "Why this content for this slot — include one short sentence on how it fits the grid (colour balance, breather, alternation)."
  }
]`,
    "```",
    "",
    "Return only the array. No prose. No markdown fences.",
  ].join("\n");

  const raw = await callClaude({
    system,
    userMessage,
    maxTokens: 4096,
  });

  const rawItems = extractJsonFromResponse<RawWeekItem[]>(raw);

  const nowIso = new Date().toISOString();
  const items: CalendarItem[] = rawItems.map((item, idx) => {
    const date = addDays(startDate, item.day_offset ?? slots[idx]?.day_offset ?? 0);
    const slot = slots[idx];
    const template =
      getTemplateBySlug(item.template_slug)
      ?? getTemplateBySlug(slot?.template_slug ?? "");
    const format =
      item.format ?? slot?.format ?? template?.format ?? "story";

    const seriesSlug =
      item.series_slug ?? slot?.series_slug ?? "general-purpose";
    return {
      id: newItemId(),
      scheduled_date: isoDate(date),
      scheduled_time: getOptimalPostingTime(date.getDay()),
      day_of_week: dayOfWeekName(date),
      series_slug: seriesSlug,
      pillar:
        (getSeriesBySlug(seriesSlug)?.pillar as PillarSlug) ?? "engage",
      template_slug: item.template_slug ?? slot?.template_slug ?? "",
      format,
      status: "suggested",
      content_data: item.content_data ?? {},
      caption: item.caption ?? null,
      hashtags: item.hashtags ?? [],
      ai_rationale: item.rationale ?? null,
      generation_prompt: null,
      grid_position: null,
      sort_order: idx,
      created_at: nowIso,
      updated_at: nowIso,
    };
  });

  // Run the deterministic sequencer over the feed posts so the grid_position
  // recommendation is grounded in the same scoring logic as Grid Health.
  // Reels are auxiliary — their cover frame still appears on the grid, but
  // since we don't yet model the reel cover separately, we treat them as
  // off-grid for sequencing purposes.
  const feedPosts = items.filter((i) => i.format === "post");
  const auxiliary = items.filter((i) => i.format !== "post");

  const sequenced = sequenceGrid({
    candidates: feedPosts.map((p) => ({
      id: p.id,
      series_slug: p.series_slug,
      template_slug: p.template_slug,
    })),
    seedRow,
  });

  const positionById = new Map<string, { row: number; column: number }>();
  for (const slot of sequenced.ordered) {
    if (slot.id) {
      positionById.set(slot.id, { row: slot.row, column: slot.column });
    }
  }
  const gridOrder: CalendarItem[] = [];
  for (const item of feedPosts) {
    const pos = positionById.get(item.id);
    if (pos) {
      item.grid_position = pos;
      gridOrder.push(item);
    }
  }
  gridOrder.sort((a, b) => {
    const pa = a.grid_position!;
    const pb = b.grid_position!;
    return pa.row === pb.row ? pa.column - pb.column : pa.row - pb.row;
  });

  const storyReelSchedule = [...auxiliary].sort((a, b) => {
    if (a.scheduled_date !== b.scheduled_date) {
      return a.scheduled_date < b.scheduled_date ? -1 : 1;
    }
    return (a.scheduled_time ?? "").localeCompare(b.scheduled_time ?? "");
  });

  const gridReasoning = gridOrder.length === 0
    ? "No feed posts this week — everything is auxiliary (stories/reels)."
    : `Sequenced ${gridOrder.length} feed posts into ${Math.ceil(gridOrder.length / 3)} grid row(s); seedRow length=${seedRow.length}. Posts ordered to break up adjacent colour and series collisions.`;

  return {
    items,
    gridOrder,
    storyReelSchedule,
    gridReasoning,
  };
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// ---------------------------------------------------------------------------
// 2. generateSinglePost
// ---------------------------------------------------------------------------

interface RawSinglePost {
  content_data: ContentData;
  caption: string;
  hashtags: string[];
  rationale?: string;
}

/**
 * Generates the full content body for a single post — content_data, caption,
 * hashtags, plus an AI rationale.
 */
export async function generateSinglePost(
  seriesSlug: string,
  templateSlug: string,
  userPrompt?: string,
): Promise<CalendarItem> {
  const series = getSeriesBySlug(seriesSlug);
  const template = getTemplateBySlug(templateSlug);

  if (!series) throw new Error(`Unknown series slug: ${seriesSlug}`);
  if (!template) throw new Error(`Unknown template slug: ${templateSlug}`);
  if (template.series_slug !== series.slug) {
    throw new Error(
      `Template ${templateSlug} does not belong to series ${seriesSlug}.`,
    );
  }

  const system = buildSystemPrompt(seriesSlug, userPrompt);
  const userMessage = [
    `Generate one ${template.format} post for **${series.name}** using template "${template.slug}" (${template.name}).`,
    "",
    "Editable fields you must populate:",
    describeEditableFields(template.editable_fields),
    "",
    "Output a single JSON object:",
    "```json",
    `{
  "content_data": { /* one key per editable field above */ },
  "caption": "Instagram caption — 3-6 short lines, ends with a question or CTA.",
  "hashtags": ["#TheMarigold", "..."],
  "rationale": "One sentence on why this angle."
}`,
    "```",
    "",
    "Return only the object. No prose. No markdown fences.",
  ].join("\n");

  const raw = await callClaude({ system, userMessage, maxTokens: 1500 });
  const parsed = extractJsonFromResponse<RawSinglePost>(raw);

  const today = new Date();
  const nowIso = today.toISOString();
  return {
    id: newItemId(),
    scheduled_date: isoDate(today),
    scheduled_time: getOptimalPostingTime(today.getDay()),
    day_of_week: dayOfWeekName(today),
    series_slug: series.slug,
    pillar: (series.pillar as PillarSlug) ?? "engage",
    template_slug: template.slug,
    format: template.format,
    status: "suggested",
    content_data: parsed.content_data ?? {},
    caption: parsed.caption ?? null,
    hashtags: parsed.hashtags ?? [],
    ai_rationale: parsed.rationale ?? null,
    generation_prompt: userPrompt ?? null,
    sort_order: 0,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

// ---------------------------------------------------------------------------
// 3. generateCaption
// ---------------------------------------------------------------------------

export interface GeneratedCaption {
  caption: string;
  hashtags: string[];
}

/**
 * Generates an Instagram caption + hashtag block for an existing piece of
 * content. Used by the editor to refresh the caption when content_data changes.
 */
export async function generateCaption(
  contentData: ContentData,
  seriesSlug: string,
): Promise<GeneratedCaption> {
  const series = getSeriesBySlug(seriesSlug);
  if (!series) throw new Error(`Unknown series slug: ${seriesSlug}`);

  const system = buildSystemPrompt(seriesSlug);
  const userMessage = [
    `Write an Instagram caption + hashtag block for this **${series.name}** post.`,
    "",
    "Content data:",
    "```json",
    JSON.stringify(contentData, null, 2),
    "```",
    "",
    "Caption rules:",
    "- 3-6 short lines, broken with line returns for breathing room.",
    "- End with a question, prompt, or CTA.",
    "- 1-2 emojis max.",
    "- Never marketing-speak.",
    "",
    "Hashtag rules:",
    "- 6-9 total. Mix 2-3 brand tags (#TheMarigold etc.) with 4-6 broader desi-wedding tags.",
    "- Lowercase only when stylistic — most should be CamelCase.",
    "",
    "Output a single JSON object:",
    "```json",
    `{ "caption": "...", "hashtags": ["#TheMarigold", "..."] }`,
    "```",
    "Return only the object. No prose. No markdown fences.",
  ].join("\n");

  const raw = await callClaude({ system, userMessage, maxTokens: 800 });
  const parsed = extractJsonFromResponse<GeneratedCaption>(raw);
  return {
    caption: parsed.caption ?? "",
    hashtags: parsed.hashtags ?? [],
  };
}

// ---------------------------------------------------------------------------
// 4. generateVariations
// ---------------------------------------------------------------------------

/**
 * Generates `count` alternative versions of an existing piece of content.
 * Each variation is a new content_data object — same template, same series,
 * different angle/quote/phrasing.
 */
export async function generateVariations(
  contentData: ContentData,
  count: number,
  seriesSlug?: string,
): Promise<ContentData[]> {
  const safeCount = Math.max(1, Math.min(count, 5));

  // Best-effort series inference if caller didn't supply one.
  const inferredSeries =
    seriesSlug ?? loadContentSeries()[0]?.slug ?? "general-purpose";

  const system = buildSystemPrompt(inferredSeries);
  const userMessage = [
    `Generate ${safeCount} alternative versions of the following post. Same template, same series. Different angles, fresh quotes, rephrased text — but always in The Marigold's voice.`,
    "",
    "Original content_data:",
    "```json",
    JSON.stringify(contentData, null, 2),
    "```",
    "",
    `Output a JSON array of exactly ${safeCount} content_data objects. Each object must use the same keys as the original. No wrapping, no prose, no markdown fences.`,
  ].join("\n");

  const raw = await callClaude({ system, userMessage, maxTokens: 2000 });
  const parsed = extractJsonFromResponse<ContentData[]>(raw);
  return Array.isArray(parsed) ? parsed.slice(0, safeCount) : [];
}
