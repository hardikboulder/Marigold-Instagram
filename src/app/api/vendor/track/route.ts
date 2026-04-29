/**
 * POST /api/vendor/track
 *
 * Best-effort funnel tracking for the post-submission onboarding screen.
 * Flips one of three boolean flags on a vendor submission record:
 *   - accountCreated     (vendor created a self-service account)
 *   - blogPostStarted    (vendor clicked through to /submit/blog)
 *   - blogPostSubmitted  (vendor finished a blog submission)
 *
 * Called from VendorSubmittedView and the blog form. Failure is non-fatal —
 * we never block the user on a tracking write.
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { FormSubmission } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUBMISSIONS_ROOT = path.join(process.cwd(), "public", "submissions");
const INDEX_PATH = path.join(SUBMISSIONS_ROOT, "_index.json");

const ALLOWED_FLAGS = new Set([
  "accountCreated",
  "blogPostStarted",
  "blogPostSubmitted",
]);

export async function POST(req: NextRequest) {
  let body: { id?: unknown; flag?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON." },
      { status: 400 },
    );
  }

  const id = typeof body.id === "string" ? body.id : "";
  const flag = typeof body.flag === "string" ? body.flag : "";
  if (!id || !ALLOWED_FLAGS.has(flag)) {
    return NextResponse.json(
      { ok: false, error: "Bad request." },
      { status: 400 },
    );
  }

  let parsed: { submissions: FormSubmission[] };
  try {
    const buf = await fs.readFile(INDEX_PATH, "utf8");
    const json = JSON.parse(buf) as { submissions?: FormSubmission[] };
    parsed = {
      submissions: Array.isArray(json.submissions) ? json.submissions : [],
    };
  } catch {
    return NextResponse.json(
      { ok: false, error: "No submissions on disk yet." },
      { status: 404 },
    );
  }

  const idx = parsed.submissions.findIndex((s) => s.id === id);
  if (idx === -1) {
    return NextResponse.json(
      { ok: false, error: "Submission not found." },
      { status: 404 },
    );
  }

  const submission = parsed.submissions[idx];
  const data = (submission.data ?? {}) as Record<string, unknown>;
  data[flag] = true;
  parsed.submissions[idx] = { ...submission, data };

  await fs.writeFile(INDEX_PATH, JSON.stringify(parsed, null, 2));
  return NextResponse.json({ ok: true });
}
