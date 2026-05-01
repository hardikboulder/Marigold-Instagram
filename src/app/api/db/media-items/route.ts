/**
 * GET    /api/db/media-items                — list metadata
 * POST   /api/db/media-items                — upsert one row
 * DELETE /api/db/media-items?id=...         — delete one
 *
 * Binary upload happens via /api/storage/upload (separate). This route only
 * persists metadata. The browser reconstructs blobs on-demand from the
 * Storage public URL or by fetching with a signed URL.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MediaRow {
  id: string;
  type: "image" | "video" | "text";
  file_name: string;
  mime_type: string;
  file_path?: string | null;
  thumbnail_path?: string | null;
  width?: number | null;
  height?: number | null;
  duration_seconds?: number | null;
  file_size?: number | null;
  text_content?: string | null;
  tags?: string[];
  collection?: string;
  source?: "upload" | "vendor-submission" | "generated";
  vendor_name?: string | null;
  vendor_category?: string | null;
  notes?: string;
  used_in?: string[];
  submission_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function GET() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("media_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) {
    console.error("[media-items GET]", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, data: data ?? [] });
}

export async function POST(req: NextRequest) {
  let body: MediaRow;
  try {
    body = (await req.json()) as MediaRow;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  if (!body.id || !body.type || !body.file_name) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields." },
      { status: 400 },
    );
  }
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("media_items")
    .upsert({
      id: body.id,
      type: body.type,
      file_name: body.file_name,
      mime_type: body.mime_type,
      file_path: body.file_path ?? null,
      thumbnail_path: body.thumbnail_path ?? null,
      width: body.width ?? null,
      height: body.height ?? null,
      duration_seconds: body.duration_seconds ?? null,
      file_size: body.file_size ?? null,
      text_content: body.text_content ?? null,
      tags: body.tags ?? [],
      collection: body.collection ?? "Vendor Photos",
      source: body.source ?? "upload",
      vendor_name: body.vendor_name ?? null,
      vendor_category: body.vendor_category ?? null,
      notes: body.notes ?? "",
      used_in: body.used_in ?? [],
      submission_id: body.submission_id ?? null,
      created_at: body.created_at,
      updated_at: body.updated_at,
    })
    .select()
    .single();
  if (error) {
    console.error("[media-items POST]", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, data });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("media_items").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
