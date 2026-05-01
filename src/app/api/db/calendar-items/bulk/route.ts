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

export async function POST(req: NextRequest) {
  let body: { items: Partial<CalendarItem>[] };
  try {
    body = (await req.json()) as { items: Partial<CalendarItem>[] };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ ok: false, error: "items required" }, { status: 400 });
  }
  const rows = body.items.map(toRow);
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("calendar_items").upsert(rows);
  if (error) {
    console.error("[calendar-items bulk]", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, count: rows.length });
}
