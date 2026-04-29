/**
 * GET/POST /api/vendor/draft
 *
 * Token-backed drafts for the vendor intake form at /submit/vendor.
 *
 *   - POST { values, token? } → { ok, token }
 *     Stores partial form values on disk. Returns the same token if one was
 *     supplied (so save-twice updates in place); otherwise mints a fresh
 *     token.
 *
 *   - GET ?token=… → { ok, values }
 *     Returns the stored values for that token, if any.
 *
 * Drafts only contain text/select values — files are never persisted across
 * sessions. Vendors will need to re-pick photos when they come back.
 *
 * ─── PRODUCTION SWAP (Supabase) ──────────────────────────────────────────
 *   Swap fs writes for a `vendor_form_drafts` table keyed on `token` with
 *   a TTL cleanup job. Mirror what the venue draft route does.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DRAFT_ROOT = path.join(process.cwd(), "public", "submissions", "_vendor-drafts");
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

  const { token: maybeToken, values } = body as {
    token?: unknown;
    values?: unknown;
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
      { ok: true, values: parsed.values ?? {} },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Draft not found." },
      { status: 404 },
    );
  }
}
