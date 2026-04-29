/**
 * GET/POST /api/venue/draft
 *
 * Token-backed drafts for the venue submission wizard at /submit/venue.
 *
 *   - POST { values, stepIndex, token? } → { ok, token }
 *     Stores the partial form data on disk. Returns the same token if one
 *     was provided (so save-twice-in-a-row updates in place); otherwise a
 *     fresh token is minted.
 *
 *   - GET  ?token=… → { ok, values, stepIndex }
 *     Returns the stored values for that token, if any.
 *
 * Drafts only contain text/select values — files are not persisted across
 * sessions. The venue contact will need to re-pick photos when they come
 * back, which matches how every other browser-based file picker behaves.
 *
 * ─── PRODUCTION SWAP (Supabase) ──────────────────────────────────────────
 *   Replace the file-system writes with a `venue_form_drafts` table and
 *   key the rows on `token`. Cleanup-by-TTL via a scheduled job.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DRAFT_ROOT = path.join(process.cwd(), "public", "submissions", "_venue-drafts");
const MAX_BODY_BYTES = 256 * 1024;
const TOKEN_RE = /^[a-zA-Z0-9_-]{8,80}$/;

function newToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

function draftPath(token: string): string {
  return path.join(DRAFT_ROOT, `${token}.json`);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Draft is too large." },
        { status: 413 },
      );
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "Invalid body." },
      { status: 400 },
    );
  }

  const { token: maybeToken, values, stepIndex } = body as {
    token?: unknown;
    values?: unknown;
    stepIndex?: unknown;
  };

  if (!values || typeof values !== "object" || Array.isArray(values)) {
    return NextResponse.json(
      { ok: false, error: "Missing values." },
      { status: 400 },
    );
  }

  let token: string;
  if (typeof maybeToken === "string" && TOKEN_RE.test(maybeToken)) {
    token = maybeToken;
  } else {
    token = newToken();
  }

  await ensureDir(DRAFT_ROOT);
  await fs.writeFile(
    draftPath(token),
    JSON.stringify(
      {
        token,
        values,
        stepIndex: typeof stepIndex === "number" ? stepIndex : 0,
        savedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  return NextResponse.json({ ok: true, token }, { status: 200 });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json(
      { ok: false, error: "Invalid token." },
      { status: 400 },
    );
  }
  try {
    const buf = await fs.readFile(draftPath(token), "utf8");
    const parsed = JSON.parse(buf);
    return NextResponse.json(
      { ok: true, values: parsed.values ?? {}, stepIndex: parsed.stepIndex ?? 0 },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Draft not found." },
      { status: 404 },
    );
  }
}
