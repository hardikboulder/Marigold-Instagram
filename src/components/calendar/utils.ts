/**
 * Date + content helpers for the Feed Calendar.
 *
 * Week math is anchored to Monday — that matches the Marigold posting
 * cadence (Mon/Wed/Fri priority slots) and the day-priority array used by
 * the AI planner in `src/lib/ai/generate-content.ts`.
 */

import {
  getTemplateBySlug,
  loadContentPillars,
  loadContentSeries,
  loadTemplateDefinitions,
} from "@/lib/db/data-loader";
import type {
  CalendarItem,
  CalendarStatus,
  ContentData,
  ContentPillar,
  EditableField,
  PillarSlug,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Date math
// ---------------------------------------------------------------------------

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function addWeeks(date: Date, n: number): Date {
  return addDays(date, n * 7);
}

export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split("-").map((p) => parseInt(p, 10));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatWeekLabel(weekStart: Date): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  });
  return `Week of ${fmt.format(weekStart)}`;
}

export function formatDayHeader(date: Date): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return fmt.format(date);
}

export function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":").map((p) => parseInt(p, 10));
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function dayOfWeekName(date: Date): string {
  return [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][date.getDay()];
}

export function isoWeekNumber(date: Date): number {
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
}

// ---------------------------------------------------------------------------
// Calendar item filtering / grouping
// ---------------------------------------------------------------------------

export interface CalendarFilters {
  /** Pillar slugs that are *hidden*. Empty means all pillars visible. */
  pillars: PillarSlug[];
  /** Optional "solo" pillar — only show this one (others dimmed). */
  soloPillar: PillarSlug | null;
  formats: string[];
  statuses: CalendarStatus[];
  /** Legacy series filter — still functional for callers that need it. */
  series: string[];
}

export function emptyFilters(): CalendarFilters {
  return {
    pillars: [],
    soloPillar: null,
    formats: [],
    statuses: [],
    series: [],
  };
}

export function filterItemsForWeek(
  items: CalendarItem[],
  weekStart: Date,
): CalendarItem[] {
  const startStr = isoDate(weekStart);
  const endStr = isoDate(addDays(weekStart, 7));
  return items.filter(
    (item) => item.scheduled_date >= startStr && item.scheduled_date < endStr,
  );
}

export function applyFilters(
  items: CalendarItem[],
  filters: CalendarFilters,
): CalendarItem[] {
  return items.filter((item) => {
    if (filters.soloPillar && item.pillar !== filters.soloPillar) {
      return false;
    }
    if (filters.pillars.length && filters.pillars.includes(item.pillar)) {
      // `pillars` here is the *hidden* list (toggle-off semantics).
      return false;
    }
    if (filters.series.length && !filters.series.includes(item.series_slug)) {
      return false;
    }
    if (filters.formats.length && !filters.formats.includes(item.format)) {
      return false;
    }
    if (
      filters.statuses.length &&
      !filters.statuses.includes(item.status)
    ) {
      return false;
    }
    return true;
  });
}

export function groupItemsByDay(
  items: CalendarItem[],
  weekStart: Date,
): CalendarItem[][] {
  const buckets: CalendarItem[][] = Array.from({ length: 7 }, () => []);
  for (const item of items) {
    const itemDate = parseIsoDate(item.scheduled_date);
    const offset = Math.floor(
      (itemDate.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (offset >= 0 && offset < 7) buckets[offset].push(item);
  }
  for (const bucket of buckets) {
    bucket.sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      const aT = a.scheduled_time ?? "";
      const bT = b.scheduled_time ?? "";
      return aT < bT ? -1 : aT > bT ? 1 : 0;
    });
  }
  return buckets;
}

// ---------------------------------------------------------------------------
// Status cycling
// ---------------------------------------------------------------------------

export const STATUS_ORDER: CalendarStatus[] = [
  "suggested",
  "approved",
  "editing",
  "exported",
  "posted",
];

export function nextStatus(current: CalendarStatus): CalendarStatus {
  const idx = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

// ---------------------------------------------------------------------------
// Default content for a template (used when "Create blank")
// ---------------------------------------------------------------------------

export function defaultContentForTemplate(templateSlug: string): ContentData {
  const template = getTemplateBySlug(templateSlug);
  if (!template) return {};
  return template.editable_fields.reduce<ContentData>((data, field) => {
    if (field.default !== undefined) {
      data[field.key] = field.default;
    } else if (field.type === "number") {
      data[field.key] = 0;
    } else {
      data[field.key] = "";
    }
    return data;
  }, {});
}

export function getActiveSeriesList() {
  return loadContentSeries()
    .filter((s) => s.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getActivePillarList(): ContentPillar[] {
  return loadContentPillars();
}

export function getActiveTemplatesForSeries(seriesSlug: string) {
  return loadTemplateDefinitions()
    .filter((t) => t.is_active && t.series_slug === seriesSlug)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function fieldHelp(field: EditableField): string {
  return field.helpText ?? "";
}
