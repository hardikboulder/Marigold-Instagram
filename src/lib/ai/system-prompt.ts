/**
 * Four-layer system prompt builder for the Marigold AI engine.
 *
 *   Layer 1 — Brand Identity   (always present)
 *   Layer 2 — Content Strategy (always present)
 *   Layer 3 — Series-Specific  (optional, loaded from content-series.json)
 *   Layer 4 — User Prompt      (optional override)
 *
 * Pulls Layer 1 + 2 from the local JSON seed files via the data-loader.
 * No Supabase. No DB calls. Pure string composition.
 */

import {
  getBrandKnowledgeByCategory,
  getSeriesBySlug,
  loadBrandConfig,
  loadContentPillars,
  loadContentSeries,
} from "@/lib/db/data-loader";
import type {
  BrandKnowledgeCategory,
  BrandKnowledgeEntry,
} from "@/lib/types";

function bullets(items: string[]): string {
  return items.map((s) => `- ${s}`).join("\n");
}

function knowledgeBlock(
  label: string,
  category: BrandKnowledgeCategory,
): string {
  const entries = getBrandKnowledgeByCategory(category);
  if (entries.length === 0) return "";
  const lines = entries.map(
    (e: BrandKnowledgeEntry) => `- **${e.title}** — ${e.content}`,
  );
  return `### ${label}\n${lines.join("\n")}`;
}

function buildLayer1BrandIdentity(): string {
  const config = loadBrandConfig();
  const voice = config.brand_voice.config_value;
  const palette = config.color_palette.config_value;
  const typography = config.typography.config_value;

  const colorList = Object.entries(palette)
    .map(([token, hex]) => `${token} (${hex})`)
    .join(", ");

  return [
    "## LAYER 1 — BRAND IDENTITY",
    "",
    "You are the in-house content strategist for **The Marigold** — a South Asian wedding planning platform for desi brides navigating multi-event weddings (sangeet, mehndi, haldi, ceremony, reception).",
    "",
    "### Voice",
    `Tone descriptors: ${voice.tone.join(", ")}.`,
    "",
    "**Pillars:**",
    bullets(voice.pillars),
    "",
    "**Do:**",
    bullets(voice.do),
    "",
    "**Don't:**",
    bullets(voice.dont),
    "",
    "**Example phrases (in-voice reference):**",
    bullets(voice.example_phrases.map((p) => `"${p}"`)),
    "",
    "### Visual identity (for context — you don't render visuals, but content must fit the system)",
    `Fonts: display=${typography.display}, ui=${typography.ui}, body=${typography.body}, handwritten=${typography.handwritten}.`,
    `Color tokens: ${colorList}.`,
    "",
    knowledgeBlock("Product knowledge", "product_features"),
    "",
    knowledgeBlock("Audience", "audience"),
    "",
    knowledgeBlock("Cultural & tone notes", "tone"),
    "",
    knowledgeBlock("Stats (use real numbers from this list — never invent)", "stats"),
    "",
    knowledgeBlock("Competitive context", "competitors"),
  ].join("\n");
}

function buildLayer2ContentStrategy(): string {
  const config = loadBrandConfig();
  const strategy = config.content_strategy.config_value;
  const series = loadContentSeries().filter((s) => s.is_active);
  const pillars = loadContentPillars();

  const cadence = strategy.posting_cadence
    .map((c) => `${c.per_week}× ${c.format}`)
    .join(", ");

  const pillarMix =
    strategy.pillar_mix && strategy.pillar_mix.length > 0
      ? strategy.pillar_mix
      : pillars.map((p) => ({ pillar_slug: p.slug, share: p.default_share }));

  const mix = pillarMix
    .map((m) => `${m.pillar_slug} (${Math.round(m.share * 100)}%)`)
    .join(", ");

  const pillarCatalog = pillars
    .map((p) => {
      const inPillar = series
        .filter((s) => s.pillar === p.slug)
        .map((s) => s.slug)
        .join(", ");
      return `- **${p.slug.toUpperCase()}** — ${p.description}\n  Series in this pillar: ${inPillar || "(none)"}`;
    })
    .join("\n");

  const seriesCatalog = series
    .map(
      (s) =>
        `- **${s.slug}** (${s.pillar}) — ${s.name}. Purpose: ${s.purpose}. Formats: ${s.supported_formats.join("/")}.`,
    )
    .join("\n");

  return [
    "## LAYER 2 — CONTENT STRATEGY",
    "",
    `**Posting cadence (per week):** ${cadence}. Aim for 4–5 posts per week total.`,
    "",
    `**Pillar mix targets:** ${mix}.`,
    "",
    "**Content Pillars (the primary organizing principle — every post serves one strategic purpose):**",
    pillarCatalog,
    "",
    "**Active series catalog (grouped by pillar):**",
    seriesCatalog,
    "",
    "**Strategy notes:**",
    bullets(strategy.notes),
    "",
    "**Rotation rules:**",
    bullets([
      "Rotate PILLARS across the week so the feed doesn't read as three of the same purpose in a stripe — alternate pillars day-to-day.",
      "Within a chosen pillar, pick a series the calendar hasn't shown recently to keep templates feeling varied.",
      "Confessional ships as a Story sequence on a single day (title → 3 cards → submit CTA).",
      "Quiz title slide is required when posting a quiz result card the same week.",
      "Reels are anchor moments — schedule one per week, usually Wed/Thu/Fri evening.",
      "Posts (1080×1080) are higher-effort; cap at 2/week. Stories carry the daily rhythm.",
      "Avoid topic overlap with anything posted in the previous 14 days.",
    ]),
    "",
    "**Pillar mix guidance (qualitative):**",
    bullets([
      "ENGAGE ~30% — comment-bait, polls, hot takes, quizzes (BvM, Confessional, Hot Takes, This or That, Discover Your).",
      "EDUCATE ~25% — saveable how-tos, planning, budget, culture (Planning 101, Countdown, Budget, Culture Corner).",
      "INSPIRE ~20% — aesthetic breathing room, mood, venues, edit (Mood Board, Venue Spotlight, Marigold Edit, In Season).",
      "CONNECT ~15% — community, real brides, UGC, belonging (Real Bride Diaries, Bride Life, Bride Connect, Community).",
      "CONVERT ~10% — product, signups, vendor/planner spotlights (Marigold Platform, Vendor Spotlight, Planner Spotlight).",
    ]),
  ].join("\n");
}

function buildLayer3SeriesSpecific(seriesSlug: string): string {
  const series = getSeriesBySlug(seriesSlug);
  if (!series) {
    return [
      "## LAYER 3 — SERIES-SPECIFIC",
      "",
      `(Unknown series slug "${seriesSlug}" — falling back to general brand voice.)`,
    ].join("\n");
  }

  const seedJson = series.episode_seed_data
    ? JSON.stringify(series.episode_seed_data, null, 2)
    : "(none)";

  return [
    "## LAYER 3 — SERIES-SPECIFIC",
    "",
    `**Series:** ${series.name} (${series.slug})`,
    `**Purpose:** ${series.purpose}`,
    `**Supported formats:** ${series.supported_formats.join(", ")}`,
    "",
    `**Description:** ${series.description}`,
    "",
    "**Generation prompt:**",
    series.ai_generation_prompt,
    "",
    "**Seed data (topic banks, archetypes, scenarios — use these to ground content):**",
    "```json",
    seedJson,
    "```",
  ].join("\n");
}

function buildLayer4UserPrompt(userPrompt: string): string {
  return [
    "## LAYER 4 — USER OVERRIDE",
    "",
    "The user has provided a specific prompt. This takes priority over generic series guidance — but the brand voice, guardrails, and JSON output contract from Layers 1–3 still apply.",
    "",
    `> ${userPrompt.trim().split("\n").join("\n> ")}`,
  ].join("\n");
}

const OUTPUT_CONTRACT = [
  "## OUTPUT CONTRACT",
  "",
  "Always respond with **valid JSON only** — no prose, no markdown fences, no commentary outside the JSON object.",
  "Match the schema requested by the caller. If the caller asks for an array, return a top-level array. If a single object, return a single object.",
  "Every string field stays under the maxLength specified by the template's editable_fields. Never invent fields not in the schema.",
  "Stats and product claims must reference items from the brand-knowledge product_features / stats blocks above. Never make up a number.",
].join("\n");

const GUARDRAILS = [
  "## GUARDRAILS",
  "",
  bullets([
    "Tie content back to The Marigold's product or brand — never generic 'wedding content'.",
    "Humor is self-deprecating and observational. Punch up at the chaos, not at people, families, or cultures.",
    "Confessions must feel real — specific details, named ceremonies/vendors/people, slightly embarrassing.",
    "If you're generating content that could overlap closely with a recent post, flag it in an `overlap_warning` field on the response.",
    "Never use generic phrases ('your big day', 'walking down the aisle'). Replace with desi-specific references.",
    "1–2 emojis max per caption. Hashtag block is line-break-separated from the body.",
  ]),
].join("\n");

/**
 * Compose the full system prompt.
 *
 * @param seriesSlug Optional. When supplied, Layer 3 loads the series-specific
 *                   ai_generation_prompt and seed data.
 * @param userPrompt Optional. Freeform override added as Layer 4.
 */
export function buildSystemPrompt(
  seriesSlug?: string,
  userPrompt?: string,
): string {
  const sections: string[] = [
    buildLayer1BrandIdentity(),
    buildLayer2ContentStrategy(),
  ];

  if (seriesSlug) {
    sections.push(buildLayer3SeriesSpecific(seriesSlug));
  }

  if (userPrompt && userPrompt.trim().length > 0) {
    sections.push(buildLayer4UserPrompt(userPrompt));
  }

  sections.push(GUARDRAILS, OUTPUT_CONTRACT);

  return sections.join("\n\n---\n\n");
}
