/**
 * POST /api/generate-template-concept
 *
 * Sketches a new template concept from a user's freeform idea. Returns text
 * only — not code. Used by the gallery's "Have a new content idea?" card as
 * an ideation tool.
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

import { loadBrandConfig, loadContentSeries } from "@/lib/db/data-loader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL_ID = "claude-sonnet-4-20250514";

interface ConceptRequest {
  idea: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: ConceptRequest;
  try {
    body = (await request.json()) as ConceptRequest;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!body.idea || typeof body.idea !== "string") {
    return NextResponse.json(
      { ok: false, error: "`idea` is required." },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "ANTHROPIC_API_KEY is not set. Add it to .env.local first.",
      },
      { status: 500 },
    );
  }

  const brand = loadBrandConfig();
  const series = loadContentSeries()
    .filter((s) => s.is_active)
    .map((s) => `- ${s.name} (${s.purpose}): ${s.description}`)
    .join("\n");

  const system = [
    "You are the creative director for The Marigold, a South Asian wedding planning brand on Instagram.",
    "",
    "Brand voice (do):",
    brand.brand_voice.config_value.do.map((d) => `- ${d}`).join("\n"),
    "",
    "Brand voice (don't):",
    brand.brand_voice.config_value.dont.map((d) => `- ${d}`).join("\n"),
    "",
    "Existing series in the system:",
    series,
    "",
    "Brand fonts (the only ones allowed):",
    `- Display: ${brand.typography.config_value.display}`,
    `- UI: ${brand.typography.config_value.ui}`,
    `- Body: ${brand.typography.config_value.body}`,
    `- Handwritten: ${brand.typography.config_value.handwritten}`,
    "",
    "Your job: when given a content idea, sketch a template concept that fits the brand. Output a structured plain-text plan, not code.",
  ].join("\n");

  const userMessage = [
    "Sketch a template concept for this idea:",
    "",
    body.idea.trim(),
    "",
    "Return plain text with these sections (use these exact headers, no markdown fences):",
    "",
    "TEMPLATE NAME",
    "(short, evocative — 2-5 words)",
    "",
    "FORMAT",
    "(post / story / reel / carousel — and why this format suits the idea)",
    "",
    "FITS UNDER SERIES",
    "(name an existing series that this could live in, OR propose a new series with a one-line description)",
    "",
    "LAYOUT",
    "(describe the visual layout in 3-5 bullets — what's at the top, middle, bottom; which fonts where; what brand decorations like tape/pins/marigolds are used)",
    "",
    "EDITABLE FIELDS",
    "(list 3-7 fields the user would fill in — key name, type, character limit, what it's for)",
    "",
    "VOICE EXAMPLE",
    "(write one sample piece of content for the template, in the actual brand voice — to show what it would feel like in the wild)",
    "",
    "WHY IT WORKS",
    "(2-3 sentences on why this template earns engagement / value / shares)",
  ].join("\n");

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL_ID,
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "Claude returned an empty response." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, concept: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    console.error("[/api/generate-template-concept] failed:", err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
