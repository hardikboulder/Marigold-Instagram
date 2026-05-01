/**
 * Content calendar CRUD — backed by localStorage cache, source of truth is
 * Supabase `calendar_items`. Reads stay synchronous; writes update the cache
 * immediately and fire-and-forget POST to /api/db/calendar-items.
 */

import {
  STORE_KEYS,
  getStore,
  setStore,
  updateStore,
} from "@/lib/db/local-store";
import { resolvePillarForTemplate, getSeriesBySlug } from "@/lib/db/data-loader";
import type {
  CalendarItem,
  CalendarItemInput,
  PillarSlug,
} from "@/lib/types";

function readAll(): CalendarItem[] {
  const raw = getStore<CalendarItem[]>(STORE_KEYS.contentCalendar, []);
  // Backfill `pillar` on items written before the pillars migration.
  return raw.map((item) => {
    if (item.pillar) return item;
    const series = getSeriesBySlug(item.series_slug);
    return { ...item, pillar: (series?.pillar ?? "engage") as PillarSlug };
  });
}

function writeAll(items: CalendarItem[]): void {
  setStore(STORE_KEYS.contentCalendar, items);
}

function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("marigold:storage-changed"));
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function sortItems(items: CalendarItem[]): CalendarItem[] {
  return [...items].sort((a, b) => {
    if (a.scheduled_date !== b.scheduled_date) {
      return a.scheduled_date < b.scheduled_date ? -1 : 1;
    }
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    const aT = a.scheduled_time ?? "";
    const bT = b.scheduled_time ?? "";
    return aT < bT ? -1 : aT > bT ? 1 : 0;
  });
}

// ---------------------------------------------------------------------------
// Sync — pull canonical list from Supabase into the cache.
// ---------------------------------------------------------------------------

let syncPromise: Promise<void> | null = null;
export function syncCalendarItems(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    try {
      const res = await fetch("/api/db/calendar-items", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { ok?: boolean; data?: CalendarItem[] };
      if (!json.ok || !Array.isArray(json.data)) return;
      writeAll(json.data);
      emitChange();
    } catch (err) {
      console.warn("[calendar-store] sync failed", err);
    } finally {
      syncPromise = null;
    }
  })();
  return syncPromise;
}

// ---------------------------------------------------------------------------
// Reads (sync, from cache)
// ---------------------------------------------------------------------------

export function getAllCalendarItems(): CalendarItem[] {
  return sortItems(readAll());
}

export function getCalendarItemsByWeek(weekNumber: number): CalendarItem[] {
  return sortItems(readAll().filter((i) => i.week_number === weekNumber));
}

export function getCalendarItemById(id: string): CalendarItem | null {
  return readAll().find((i) => i.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Writes — cache immediately, push to Supabase fire-and-forget.
// ---------------------------------------------------------------------------

function resolvePillar(input: CalendarItemInput): PillarSlug {
  if (input.pillar) return input.pillar;
  const fromTemplate = resolvePillarForTemplate({
    pillar: undefined as unknown as PillarSlug,
    series_slug: input.series_slug,
  });
  if (fromTemplate) return fromTemplate;
  const series = getSeriesBySlug(input.series_slug);
  return (series?.pillar ?? "engage") as PillarSlug;
}

function materialize(input: CalendarItemInput): CalendarItem {
  const now = nowIso();
  return {
    id: input.id ?? newId(),
    scheduled_date: input.scheduled_date,
    scheduled_time: input.scheduled_time ?? null,
    week_number: input.week_number,
    day_of_week: input.day_of_week,
    series_slug: input.series_slug,
    pillar: resolvePillar(input),
    template_slug: input.template_slug,
    format: input.format,
    status: input.status,
    content_data: input.content_data,
    caption: input.caption ?? null,
    hashtags: input.hashtags ?? [],
    ai_rationale: input.ai_rationale ?? null,
    generation_prompt: input.generation_prompt ?? null,
    sort_order: input.sort_order ?? 0,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

function pushOne(item: CalendarItem) {
  if (typeof window === "undefined") return;
  void fetch("/api/db/calendar-items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  }).catch((err) => console.warn("[calendar-store] push failed", err));
}

function pushBulk(items: CalendarItem[]) {
  if (typeof window === "undefined") return;
  void fetch("/api/db/calendar-items/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  }).catch((err) => console.warn("[calendar-store] bulk push failed", err));
}

export function addCalendarItem(input: CalendarItemInput): CalendarItem {
  const item = materialize(input);
  updateStore<CalendarItem[]>(STORE_KEYS.contentCalendar, [], (current) => [
    ...current,
    item,
  ]);
  emitChange();
  pushOne(item);
  return item;
}

export function bulkAddCalendarItems(
  inputs: CalendarItemInput[],
): CalendarItem[] {
  const items = inputs.map(materialize);
  updateStore<CalendarItem[]>(STORE_KEYS.contentCalendar, [], (current) => [
    ...current,
    ...items,
  ]);
  emitChange();
  pushBulk(items);
  return items;
}

export function updateCalendarItem(
  id: string,
  updates: Partial<Omit<CalendarItem, "id" | "created_at">>,
): CalendarItem {
  let updated: CalendarItem | null = null;
  updateStore<CalendarItem[]>(STORE_KEYS.contentCalendar, [], (current) =>
    current.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...updates, updated_at: nowIso() };
      return updated;
    }),
  );
  if (!updated) {
    throw new Error(`CalendarItem not found: ${id}`);
  }
  emitChange();
  pushOne(updated);
  return updated;
}

export function deleteCalendarItem(id: string): void {
  updateStore<CalendarItem[]>(STORE_KEYS.contentCalendar, [], (current) =>
    current.filter((i) => i.id !== id),
  );
  emitChange();
  if (typeof window !== "undefined") {
    void fetch(`/api/db/calendar-items?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).catch((err) => console.warn("[calendar-store] delete failed", err));
  }
}

export function clearCalendar(): void {
  writeAll([]);
  emitChange();
  if (typeof window !== "undefined") {
    void fetch("/api/db/calendar-items?all=1", { method: "DELETE" }).catch(
      (err) => console.warn("[calendar-store] clear failed", err),
    );
  }
}
