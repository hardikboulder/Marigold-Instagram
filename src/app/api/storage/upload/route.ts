/**
 * POST /api/storage/upload
 *
 * Accepts multipart form-data with fields:
 *   bucket   (required) — one of "assets" | "media" | "thumbnails" | "submissions"
 *   path     (required) — object key (e.g. "asset_<uuid>.png")
 *   file     (required) — the binary blob
 *
 * Returns: { ok: true, path: string, publicUrl?: string }
 *
 * Server-side only. The browser never holds the service-role key.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_BUCKETS = new Set(["assets", "media", "thumbnails", "submissions"]);

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data." }, { status: 400 });
  }

  const bucket = String(form.get("bucket") ?? "");
  const path = String(form.get("path") ?? "");
  const file = form.get("file");

  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ ok: false, error: "Invalid bucket." }, { status: 400 });
  }
  if (!path || path.includes("..")) {
    return NextResponse.json({ ok: false, error: "Invalid path." }, { status: 400 });
  }
  if (!(file instanceof Blob)) {
    return NextResponse.json({ ok: false, error: "Missing file." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    console.error("[storage/upload]", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Public buckets (thumbnails) get a stable public URL; private ones return path only.
  let publicUrl: string | undefined;
  if (bucket === "thumbnails") {
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    publicUrl = pub.publicUrl;
  }
  return NextResponse.json({ ok: true, path, publicUrl });
}
