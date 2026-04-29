"use client";

/**
 * Floating action bar that appears when one or more content tiles are
 * selected. Bulk-shifts dates by ±N days, advances status to approved /
 * exported, or deletes the whole selection in one go.
 */

import { useState, type CSSProperties } from "react";
import type { CalendarItem } from "@/lib/types";

export interface BulkOperationsBarProps {
  selectedIds: string[];
  items: CalendarItem[];
  onClear: () => void;
  onApprove: () => void;
  onExport: () => void;
  onDelete: () => void;
  onShift: (days: number) => void;
}

export function BulkOperationsBar({
  selectedIds,
  items,
  onClear,
  onApprove,
  onExport,
  onDelete,
  onShift,
}: BulkOperationsBarProps) {
  const [shiftValue, setShiftValue] = useState(1);
  if (selectedIds.length === 0) return null;
  const total = selectedIds.length;
  const seriesSet = new Set<string>();
  let approvable = 0;
  let exportable = 0;
  for (const id of selectedIds) {
    const item = items.find((i) => i.id === id);
    if (!item) continue;
    seriesSet.add(item.series_slug);
    if (item.status === "suggested" || item.status === "editing") approvable++;
    if (item.status !== "posted") exportable++;
  }

  return (
    <div
      role="toolbar"
      aria-label="Bulk operations"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 18px",
        background: "var(--wine)",
        color: "var(--cream)",
        borderRadius: 999,
        boxShadow: "4px 4px 0 var(--gold), 0 12px 32px rgba(75,21,40,0.35)",
        flexWrap: "wrap",
        maxWidth: "min(960px, 96vw)",
      }}
    >
      <span
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 18,
          fontStyle: "italic",
        }}
      >
        {total} selected
      </span>
      <span
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 9,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 1.4,
          color: "rgba(248,236,219,0.6)",
        }}
      >
        {seriesSet.size} series
      </span>

      <Divider />

      <Action onClick={onApprove} disabled={approvable === 0}>
        Approve {approvable > 0 ? `(${approvable})` : ""}
      </Action>
      <Action onClick={onExport} disabled={exportable === 0}>
        Export {exportable > 0 ? `(${exportable})` : ""}
      </Action>

      <Divider />

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 9,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 1.4,
            color: "rgba(248,236,219,0.7)",
          }}
        >
          Shift
        </span>
        <button
          type="button"
          onClick={() => onShift(-shiftValue)}
          style={shiftBtn}
          aria-label={`Shift back ${shiftValue} days`}
        >
          ◀
        </button>
        <input
          type="number"
          value={shiftValue}
          min={1}
          max={60}
          onChange={(e) =>
            setShiftValue(Math.max(1, parseInt(e.target.value, 10) || 1))
          }
          style={{
            width: 44,
            background: "rgba(248,236,219,0.12)",
            border: "1px solid rgba(248,236,219,0.25)",
            borderRadius: 6,
            color: "var(--cream)",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 12,
            textAlign: "center",
            padding: "4px 6px",
          }}
        />
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 9,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 1.4,
            color: "rgba(248,236,219,0.7)",
          }}
        >
          d
        </span>
        <button
          type="button"
          onClick={() => onShift(shiftValue)}
          style={shiftBtn}
          aria-label={`Shift forward ${shiftValue} days`}
        >
          ▶
        </button>
      </div>

      <Divider />

      <Action onClick={onDelete} tone="danger">
        Delete
      </Action>
      <Action onClick={onClear} tone="ghost">
        Clear
      </Action>
    </div>
  );
}

function Divider() {
  return (
    <span
      style={{
        width: 1,
        height: 22,
        background: "rgba(248,236,219,0.18)",
      }}
    />
  );
}

interface ActionProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  tone?: "danger" | "ghost";
}

function Action({ onClick, children, disabled, tone }: ActionProps) {
  const base: CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    padding: "8px 14px",
    borderRadius: 999,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid rgba(248,236,219,0.25)",
    background: "rgba(248,236,219,0.1)",
    color: "var(--cream)",
    opacity: disabled ? 0.4 : 1,
  };
  if (tone === "danger") {
    base.background = "var(--deep-pink)";
    base.borderColor = "var(--deep-pink)";
  }
  if (tone === "ghost") {
    base.background = "transparent";
    base.borderColor = "rgba(248,236,219,0.35)";
  }
  return (
    <button type="button" disabled={disabled} onClick={onClick} style={base}>
      {children}
    </button>
  );
}

const shiftBtn: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 999,
  background: "rgba(248,236,219,0.12)",
  border: "1px solid rgba(248,236,219,0.25)",
  color: "var(--cream)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 10,
};
