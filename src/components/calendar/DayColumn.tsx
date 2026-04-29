"use client";

import type { CalendarItem, CalendarStatus } from "@/lib/types";
import { ContentTile } from "./ContentTile";
import { EmptyDayGhost, type EmptyDaySuggestion } from "./EmptyDayGhost";
import { formatDayHeader } from "./utils";

interface DayColumnProps {
  date: Date;
  items: CalendarItem[];
  isToday: boolean;
  onStatusChange: (id: string, next: CalendarStatus) => void;
  onDelete: (id: string) => void;
  /** All items (across the calendar) — used for empty-day suggestion context. */
  allItems?: CalendarItem[];
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string, additive?: boolean) => void;
  onContextMenu?: (item: CalendarItem, x: number, y: number) => void;
  onAcceptSuggestion?: (date: Date, suggestion: EmptyDaySuggestion) => void;
  onAddManual?: (date: Date) => void;
}

export function DayColumn({
  date,
  items,
  isToday,
  onStatusChange,
  onDelete,
  allItems,
  selectedIds,
  onToggleSelect,
  onContextMenu,
  onAcceptSuggestion,
  onAddManual,
}: DayColumnProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minWidth: 188,
      }}
    >
      <div
        style={{
          paddingBottom: 8,
          borderBottom: `2px solid ${isToday ? "var(--pink)" : "rgba(75,21,40,0.1)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1.6,
            color: isToday ? "var(--pink)" : "var(--wine)",
          }}
        >
          {formatDayHeader(date)}
        </span>
        {isToday && (
          <span
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 16,
              color: "var(--pink)",
              transform: "rotate(-4deg)",
            }}
          >
            today
          </span>
        )}
      </div>

      {items.length === 0 ? (
        onAcceptSuggestion && onAddManual ? (
          <EmptyDayGhost
            date={date}
            surroundingItems={allItems ?? []}
            onAccept={(s) => onAcceptSuggestion(date, s)}
            onAddManual={() => onAddManual(date)}
          />
        ) : (
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 11,
              color: "var(--mauve)",
              fontStyle: "italic",
              padding: "12px 4px",
              opacity: 0.6,
            }}
          >
            nothing scheduled
          </div>
        )
      ) : (
        items.map((item) => (
          <ContentTile
            key={item.id}
            item={item}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            selected={selectedIds?.has(item.id)}
            onToggleSelect={onToggleSelect}
            onContextMenu={onContextMenu}
          />
        ))
      )}
    </div>
  );
}
