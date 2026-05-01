/**
 * GET    /api/db/calendar-items                — list all
 * POST   /api/db/calendar-items                — upsert one (insert or update)
 * POST   /api/db/calendar-items/bulk           — bulk upsert (see ./bulk/route.ts)
 * DELETE /api/db/calendar-items?id=...         — delete one
 * DELETE /api/db/calendar-items?all=1          — clear all
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { CalendarItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toRow(item: Partial<CalendarItem>) {
  return {
    id: item.id,
    scheduled_date: item.scheduled_date,
    scheduled_time: item.scheduled_time ?? null,
    week_number: item.week_number ?? null,
    series_slug: item.series_slug,
    pillar_slug: item.pillar,
    template_slug: item.template_slug,
    format: item.format,
    status: item.status,
    content_data: item.content_data ?? {},
    caption: item.caption ?? null,
    hashtags: item.hashtags ?? [],
    grid_position: item.grid_position ?? null,
    ai_rationale: item.ai_rationale ?? null,
    generation_prompt: item.generation_prompt ?? null,
    sort_order: item.sort_order ?? 0,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function fromRow(row: Record<string, unknown>): CalendarItem {
  return {
    id: String(row.id),
    scheduled_date: String(row.scheduled_date ?? ""),
    scheduled_time: (row.scheduled_time as string | null) ?? null,
    week_number: (row.week_number as number | undefined) ?? undefined,
    series_slug: String(row.series_slug ?? ""),
    pillar: (row.pillar_slug as CalendarItem["pillar"]) ?? "engage",
    template_slug: String(row.template_slug ?? ""),
    format: (row.format as CalendarItem["format"]) ?? "post",
    status: (row.status as CalendarItem["status"]) ?? "suggested",
    content_data: (row.content_data as CalendarItem["content_data"]) ?? {},
    caption: (row.caption as string | null) ?? null,
    hashtags: (row.hashtags as string[]) ?? [],
    grid_position: (row.grid_position as CalendarItem["grid_position"]) ?? null,
    ai_rationale: (row.ai_rationale as string | null) ?? null,
    generation_prompt: (row.generation_prompt as string | null) ?? null,
    sort_order: (row.sort_order as number) ?? 0,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function GET() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("calendar_items")
    .select("*")
    .order("scheduled_date", { ascending: true })
    .limit(2000);
  if (error) {
    console.error("[calendar-items GET]", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, data: (data ?? []).map(fromRow) });
}

export async function POST(req: NextRequest) {
  let body: Partial<CalendarItem>;
  try {
    body = (await req.json()) as Partial<CalendarItem>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  if (!body.id || !body.scheduled_date || !body.template_slug) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields." },
      { status: 400 },
    );
  }
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("calendar_items")
    .upsert(toRow(body))
    .select()
    .single();
  if (error) {
    console.error("[calendar-items POST]", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, data: fromRow(data) });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const all = url.searchParams.get("all");
  const supabase = getSupabaseAdminClient();
  if (all === "1") {
    const { error } = await supabase.from("calendar_items").delete().not("id", "is", null);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
  }
  const { error } = await supabase.from("calendar_items").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
