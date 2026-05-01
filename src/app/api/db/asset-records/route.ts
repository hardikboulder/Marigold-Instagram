/**
 * POST   /api/db/asset-records   — insert one row
 * GET    /api/db/asset-records   — list (most-recent first)
 * DELETE /api/db/asset-records?id=...   — delete one
 * DELETE /api/db/asset-records?all=1    — clear all
 *
 * Server-side only; uses the SERVICE ROLE key to bypass RLS. The browser
 * never sees the service key. When real auth is added later, switch to the
 * user-bound client and let RLS enforce per-admin access.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AssetRecordRow {
  id?: string;
  calendar_item_id?: string | null;
  source_ref?: string | null;
  template_slug: string;
  series_slug?: string | null;
  file_type: "png" | "jpg" | "mp4";
  file_path?: string | null;
  file_url?: string | null;
  thumbnail_path?: string | null;
  thumbnail?: string | null;
  filename: string;
  dimensions?: { width: number; height: number } | null;
  file_size_bytes?: number | null;
  render_config: Record<string, unknown>;
  created_at?: string;
}

export async function POST(req: NextRequest) {
  let body: AssetRecordRow;
  try {
    body = (await req.json()) as AssetRecordRow;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  if (!body.template_slug || !body.filename || !body.file_type) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("asset_records")
    .insert({
      id: body.id,
      calendar_item_id: isUuid(body.calendar_item_id) ? body.calendar_item_id : null,
      source_ref: !isUuid(body.calendar_item_id) ? body.calendar_item_id : body.source_ref ?? null,
      template_slug: body.template_slug,
      series_slug: body.series_slug ?? null,
      file_type: body.file_type,
      file_path: body.file_path ?? null,
      file_url: body.file_url ?? null,
      thumbnail_path: body.thumbnail_path ?? null,
      thumbnail: body.thumbnail ?? null,
      filename: body.filename,
      dimensions: body.dimensions ?? null,
      file_size_bytes: body.file_size_bytes ?? null,
      render_config: body.render_config ?? {},
      created_at: body.created_at,
    })
    .select()
    .single();

  if (error) {
    console.error("[asset-records POST]", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, data });
}

export async function GET() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("asset_records")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    console.error("[asset-records GET]", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, data: data ?? [] });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const all = url.searchParams.get("all");
  const supabase = getSupabaseAdminClient();

  if (all === "1") {
    const { error } = await supabase.from("asset_records").delete().not("id", "is", null);
    if (error) {
      console.error("[asset-records DELETE all]", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
  }
  const { error } = await supabase.from("asset_records").delete().eq("id", id);
  if (error) {
    console.error("[asset-records DELETE]", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

function isUuid(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
