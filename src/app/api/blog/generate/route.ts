/**
 * POST /api/blog/generate
 *
 * Takes the vendor's identity, chosen topic, and answered questions, then
 * calls Claude (claude-sonnet-4-20250514) to generate a polished blog post.
 *
 * Request body:
 *   {
 *     sessionToken: string,        // tracks generation count per session
 *     vendor: {
 *       name: string,
 *       businessName: string,
 *       categoryId: string,        // canonical id from the vendor schema
 *       categoryLabel: string,     // friendly display label
 *       city?: string,
 *       instagram?: string,
 *       bio?: string,
 *     },
 *     topic: {
 *       id: string,
 *       title: string,
 *       description: string,
 *       isCustom?: boolean,        // true when vendor pitched their own topic
 *       customPitch?: string,      // their description if isCustom
 *     },
 *     answers: Array<{ question: string; answer: string }>,
 *   }
 *
 * Response:
 *   { ok: true, html: string, markdown: string, headline: string,
 *     readingTimeMin: number, generationsUsed: number, generationsRemaining: number }
 *   { ok: false, error: string }
 *
 * Rate-limited to 3 generations per session token (per process). The
 * session token is generated client-side; production would back this with
 * Redis or a database row.
 */

import { NextRequest, NextResponse } from "next/server";

import { callNvidia, NVIDIA_MODELS } from "@/lib/ai/nvidia-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_GENERATIONS_PER_SESSION = 3;
const MAX_OUTPUT_TOKENS = 4000;

interface GenerateRequest {
  sessionToken?: string;
  vendor?: {
    name?: string;
    businessName?: string;
    categoryId?: string;
    categoryLabel?: string;
    city?: string;
    instagram?: string;
    bio?: string;
  };
  topic?: {
    id?: string;
    title?: string;
    description?: string;
    isCustom?: boolean;
    customPitch?: string;
  };
  answers?: Array<{ question?: string; answer?: string }>;
}

// In-memory session counters. Cleared whenever the dev server restarts —
// production would swap to Redis/Upstash.
const sessionCounts = new Map<string, { count: number; firstAt: number }>();
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

function bumpSessionCount(token: string): { count: number; allowed: boolean } {
  const now = Date.now();
  const existing = sessionCounts.get(token);
  if (!existing || now - existing.firstAt > SESSION_TTL_MS) {
    sessionCounts.set(token, { count: 1, firstAt: now });
    return { count: 1, allowed: true };
  }
  if (existing.count >= MAX_GENERATIONS_PER_SESSION) {
    return { count: existing.count, allowed: false };
  }
  existing.count += 1;
  return { count: existing.count, allowed: true };
}

const SYSTEM_PROMPT = `You are a blog writer for The Marigold, a wedding planning platform for South Asian weddings. Write in a warm, knowledgeable, and relatable tone — like a trusted friend who happens to be an expert. Use "you" to address the reader (couples). Include the vendor's real answers and stories naturally. The post should feel like it was written by the vendor with editorial polish, not like a generic SEO article. Format with clear headings, short paragraphs, and practical takeaways. Length: 800-1200 words.

Output rules:
- Return ONLY valid JSON, no prose around it.
- The JSON must match this exact shape:
  {
    "headline": "string — 8-14 words, NOT the same as the topic title",
    "markdown": "string — the full blog post in GitHub-flavored markdown, with # for the headline, ## for section headings, blockquotes (>) for any pull-quote moments, and a final ## section that's a 'Quick takeaways' bullet list",
    "html": "string — the same post as semantic HTML using <h1>, <h2>, <p>, <blockquote class=\\"pull-quote\\">, <ul>, <li> elements; do NOT include <html>/<body> wrappers or inline styles"
  }
- The first line of markdown must be the headline as an H1. Open with a hook paragraph (no preamble like 'In this post we'll cover…').
- Use 4-6 ## subheadings, each derived from the vendor's actual answers (do not invent facts).
- Weave in the vendor's stories and quotes naturally — when quoting them directly, use a blockquote.
- Avoid SEO filler, generic intros, or platitudes ("In conclusion…", "Without further ado…").
- The closing section should be a "Quick takeaways" bulleted list of 4-6 practical points distilled from the post.
- After the takeaways, add an italicized author bio paragraph: "*[VENDOR_NAME] is a [CATEGORY] [based in CITY,] follow their work at [INSTAGRAM_HANDLE].*" — use only the vendor data provided.
- Do not invent statistics, prices, or names that the vendor didn't supply.`;

function buildUserPrompt(body: GenerateRequest): string {
  const v = body.vendor ?? {};
  const t = body.topic ?? {};
  const answers = body.answers ?? [];

  const lines: string[] = [];
  lines.push(`# Brief`);
  lines.push("");
  lines.push(`**Vendor:** ${v.name ?? "Unknown"}`);
  if (v.businessName) lines.push(`**Business:** ${v.businessName}`);
  if (v.categoryLabel) lines.push(`**Category:** ${v.categoryLabel}`);
  if (v.city) lines.push(`**City / region:** ${v.city}`);
  if (v.instagram) lines.push(`**Instagram:** ${v.instagram}`);
  if (v.bio) lines.push(`**One-line bio:** ${v.bio}`);
  lines.push("");
  lines.push(`**Topic title:** ${t.title ?? "Untitled"}`);
  if (t.description) lines.push(`**Topic description:** ${t.description}`);
  if (t.isCustom && t.customPitch) {
    lines.push(`**Vendor's own pitch for this topic:** ${t.customPitch}`);
  }
  lines.push("");
  lines.push(`## Vendor's answers`);
  lines.push("");
  if (answers.length === 0) {
    lines.push("(No answers provided.)");
  } else {
    answers.forEach((a, idx) => {
      const q = (a.question ?? "").trim();
      const ans = (a.answer ?? "").trim();
      if (!q && !ans) return;
      lines.push(`**Q${idx + 1}: ${q}**`);
      lines.push(ans || "(skipped)");
      lines.push("");
    });
  }
  lines.push("");
  lines.push(
    `Write the blog post now. Return JSON with keys "headline", "markdown", "html" — nothing else.`,
  );
  return lines.join("\n");
}

interface ParsedPost {
  headline: string;
  markdown: string;
  html: string;
}

function sanitizeJsonControlChars(input: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inString) {
      if (escaped) { out += ch; escaped = false; continue; }
      if (ch === "\\") { out += ch; escaped = true; continue; }
      if (ch === '"') { out += ch; inString = false; continue; }
      if (ch === "\n") { out += "\\n"; continue; }
      if (ch === "\r") { out += "\\r"; continue; }
      if (ch === "\t") { out += "\\t"; continue; }
      if (ch.charCodeAt(0) < 0x20) continue;
      out += ch;
    } else {
      out += ch;
      if (ch === '"') inString = true;
    }
  }
  return out;
}

function parseModelOutput(raw: string): ParsedPost {
  let body = raw.trim();
  if (body.startsWith("```")) {
    body = body.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  }
  const firstBrace = body.indexOf("{");
  const lastBrace = body.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    body = body.slice(firstBrace, lastBrace + 1);
  }
  let parsed: Partial<ParsedPost>;
  try {
    parsed = JSON.parse(body) as Partial<ParsedPost>;
  } catch {
    parsed = JSON.parse(sanitizeJsonControlChars(body)) as Partial<ParsedPost>;
  }
  if (!parsed.headline || !parsed.markdown || !parsed.html) {
    throw new Error("Model response is missing required fields.");
  }
  return {
    headline: parsed.headline,
    markdown: parsed.markdown,
    html: parsed.html,
  };
}

function estimateReadingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(2, Math.round(words / 220));
}

function badRequest(error: string): NextResponse {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const sessionToken = (body.sessionToken ?? "").trim();
  if (!sessionToken || sessionToken.length < 8 || sessionToken.length > 80) {
    return badRequest("Missing or invalid sessionToken.");
  }
  if (!body.vendor?.name || !body.vendor?.businessName) {
    return badRequest("Vendor name and business name are required.");
  }
  if (!body.topic?.title) {
    return badRequest("Topic title is required.");
  }
  if (!Array.isArray(body.answers) || body.answers.length === 0) {
    return badRequest("At least one answered question is required.");
  }

  const counter = bumpSessionCount(sessionToken);
  if (!counter.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `You've used your ${MAX_GENERATIONS_PER_SESSION} regenerations for this session. Submit the post you have, or refresh and start over.`,
      },
      { status: 429 },
    );
  }

  let post: ParsedPost;
  try {
    const userPrompt = buildUserPrompt(body);
    const text = await callNvidia({
      system: SYSTEM_PROMPT,
      userMessage: userPrompt,
      model: NVIDIA_MODELS.reasoning,
      maxTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.6,
    });
    post = parseModelOutput(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    console.error("[/api/blog/generate] failed:", err);
    return NextResponse.json(
      { ok: false, error: `Generation failed: ${message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    headline: post.headline,
    markdown: post.markdown,
    html: post.html,
    readingTimeMin: estimateReadingTime(post.markdown),
    generationsUsed: counter.count,
    generationsRemaining: MAX_GENERATIONS_PER_SESSION - counter.count,
  });
}
