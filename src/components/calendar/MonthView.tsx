"use client";

/**
 * Monthly planner view. Each day is a square cell with up to N tiny
 * thumbnails stacked horizontally. Empty days show a ghost suggestion so the
 * user can spot cadence holes — clusters and gaps both surface visually.
 *
 * The grid is anchored to Monday (matches `startOfWeek()` in utils.ts) so
 * column alignment matches the week view.
 */

import { useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { TemplateFrame } from "@/components/brand/TemplateFrame";
import type { CalendarItem } from "@/lib/types";
import {
  EmptyDayGhost,
  type EmptyDaySuggestion,
} from "./EmptyDayGhost";
import { FORMAT_BADGES, seriesColor } from "./labels";
import { QuickActionsMenu } from "./QuickActionsMenu";
import { renderTemplate } from "./template-renderer";
import {
  addDays,
  isoDate,
  parseIsoDate,
  startOfWeek,
} from "./utils";

const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_THUMBS = 4;

interface MonthViewProps {
  monthAnchor: Date;
  items: CalendarItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string, additive?: boolean) => void;
  onEdit: (item: CalendarItem) => void;
  onDuplicate: (item: CalendarItem) => void;
  onMoveDate: (item: CalendarItem, isoDate: string) => void;
  onChangeTemplate: (item: CalendarItem, templateSlug: string) => void;
  onRegenerate: (item: CalendarItem) => void;
  onDelete: (item: CalendarItem) => void;
  onAcceptSuggestion: (date: Date, suggestion: EmptyDaySuggestion) => void;
  onAddManual: (date: Date) => void;
}

export function MonthView({
  monthAnchor,
  items,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDuplicate,
  onMoveDate,
  onChangeTemplate,
  onRegenerate,
  onDelete,
  onAcceptSuggestion,
  onAddManual,
}: MonthViewProps) {
  const router = useRouter();
  const cells = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);
  const monthIso = isoDate(monthAnchor).slice(0, 7);
  const todayIso = isoDate(new Date());

  // Group items by ISO date for fast lookup.
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const arr = map.get(item.scheduled_date);
      if (arr) arr.push(item);
      else map.set(item.scheduled_date, [item]);
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => a.sort_order - b.sort_order);
    }
    return map;
  }, [items]);

  const [menu, setMenu] = useState<{
    item: CalendarItem;
    x: number;
    y: number;
  } | null>(null);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 6,
          fontFamily: "'Syne', sans-serif",
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: "var(--mauve)",
          paddingLeft: 4,
        }}
      >
        {DOW_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 6,
        }}
      >
        {cells.map((cellDate) => {
          const dateIso = isoDate(cellDate);
          const inMonth = dateIso.startsWith(monthIso);
          const dayItems = byDay.get(dateIso) ?? [];
          return (
            <DayCell
              key={dateIso}
              date={cellDate}
              dateIso={dateIso}
              dayItems={dayItems}
              allItems={items}
              isToday={dateIso === todayIso}
              inMonth={inMonth}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onContextMenu={(item, x, y) => setMenu({ item, x, y })}
              onOpenItem={(item) => router.push(`/editor/${item.id}`)}
              onAcceptSuggestion={(s) => onAcceptSuggestion(cellDate, s)}
              onAddManual={() => onAddManual(cellDate)}
            />
          );
        })}
      </div>

      {menu && (
        <QuickActionsMenu
          item={menu.item}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onMoveDate={onMoveDate}
          onChangeTemplate={onChangeTemplate}
          onRegenerate={onRegenerate}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

interface DayCellProps {
  date: Date;
  dateIso: string;
  dayItems: CalendarItem[];
  allItems: CalendarItem[];
  isToday: boolean;
  inMonth: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, additive?: boolean) => void;
  onContextMenu: (item: CalendarItem, x: number, y: number) => void;
  onOpenItem: (item: CalendarItem) => void;
  onAcceptSuggestion: (suggestion: EmptyDaySuggestion) => void;
  onAddManual: () => void;
}

function DayCell({
  date,
  dateIso,
  dayItems,
  allItems,
  isToday,
  inMonth,
  selectedIds,
  onToggleSelect,
  onContextMenu,
  onOpenItem,
  onAcceptSuggestion,
  onAddManual,
}: DayCellProps) {
  const dayNum = parseIsoDate(dateIso).getDate();
  const overflow = Math.max(0, dayItems.length - MAX_THUMBS);

  return (
    <div
      style={{
        position: "relative",
        background: inMonth ? "var(--cream)" : "rgba(248,236,219,0.4)",
        border: `1px solid ${
          isToday ? "var(--pink)" : "rgba(75,21,40,0.08)"
        }`,
        borderRadius: 8,
        padding: 6,
        minHeight: 96,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        opacity: inMonth ? 1 : 0.55,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        <span
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: isToday ? 18 : 14,
            color: isToday ? "var(--pink)" : "var(--wine)",
            fontStyle: isToday ? "italic" : "normal",
            lineHeight: 1,
          }}
        >
          {dayNum}
        </span>
        {dayItems.length > 0 && (
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 8,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "var(--mauve)",
            }}
          >
            {dayItems.length}
          </span>
        )}
      </div>

      {dayItems.length === 0 ? (
        inMonth ? (
          <EmptyDayGhost
            date={date}
            surroundingItems={allItems}
            density="month"
            onAccept={onAcceptSuggestion}
            onAddManual={onAddManual}
          />
        ) : null
      ) : (
        <div
          style={{
            display: "flex",
            gap: 3,
            flexWrap: "wrap",
          }}
        >
          {dayItems.slice(0, MAX_THUMBS).map((item) => (
            <MonthThumb
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              onToggleSelect={onToggleSelect}
              onContextMenu={onContextMenu}
              onOpen={onOpenItem}
            />
          ))}
          {overflow > 0 && (
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 9,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                padding: "3px 6px",
                borderRadius: 4,
                background: "var(--blush)",
                color: "var(--wine)",
              }}
            >
              +{overflow}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface MonthThumbProps {
  item: CalendarItem;
  selected: boolean;
  onToggleSelect: (id: string, additive?: boolean) => void;
  onContextMenu: (item: CalendarItem, x: number, y: number) => void;
  onOpen: (item: CalendarItem) => void;
}

function MonthThumb({
  item,
  selected,
  onToggleSelect,
  onContextMenu,
  onOpen,
}: MonthThumbProps) {
  const longPress = useRef<number | null>(null);
  const ring = seriesColor(item.series_slug);
  const previewFormat = item.format === "reel" ? "story" : item.format;
  const w = 32;
  const h = previewFormat === "story" ? (1920 / 1080) * w : w;

  return (
    <button
      type="button"
      onClick={(e) => {
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          onToggleSelect(item.id, true);
        } else {
          onOpen(item);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(item, e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        longPress.current = window.setTimeout(() => {
          onContextMenu(item, touch.clientX, touch.clientY);
        }, 500);
      }}
      onTouchEnd={() => {
        if (longPress.current) {
          window.clearTimeout(longPress.current);
          longPress.current = null;
        }
      }}
      onTouchMove={() => {
        if (longPress.current) {
          window.clearTimeout(longPress.current);
          longPress.current = null;
        }
      }}
      title={`${item.template_slug} · ${FORMAT_BADGES[item.format].label}`}
      style={{
        position: "relative",
        width: w,
        height: h,
        padding: 0,
        border: `1.5px solid ${selected ? "var(--pink)" : ring}`,
        borderRadius: 4,
        overflow: "hidden",
        background: "var(--blush)",
        cursor: "pointer",
        outline: selected ? "2px solid var(--pink)" : "none",
        outlineOffset: 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${w / 1080})`,
          transformOrigin: "top left",
          width: 1080,
          height: previewFormat === "story" ? 1920 : 1080,
          pointerEvents: "none",
        }}
      >
        <TemplateFrame
          format={previewFormat}
          scale={1}
          style={{ boxShadow: "none", borderRadius: 0 }}
        >
          {renderTemplate(item.template_slug, item.content_data)}
        </TemplateFrame>
      </span>
      {item.format !== "post" && (
        <span
          style={{
            position: "absolute",
            top: 1,
            right: 1,
            width: 8,
            height: 8,
            borderRadius: 999,
            background: FORMAT_BADGES[item.format].bg,
            border: "1px solid var(--cream)",
          }}
        />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------

function buildMonthGrid(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const start = startOfWeek(first);
  // Always emit 6 rows (42 cells) so navigation is consistent month-to-month.
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(addDays(start, i));
  }
  // If the last day is well before the trailing edge, trim a row to 5 — but
  // to keep height stable we keep 6. (Decision: stable height > tight fit.)
  void last;
  return cells;
}

export const monthGridStyles: { dowLabel: CSSProperties } = {
  dowLabel: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 9,
    fontWeight: 800,
  },
};
