"use client";

import { useRouter } from "next/navigation";
import { useRef, type CSSProperties, type MouseEvent } from "react";
import { TemplateFrame } from "@/components/brand/TemplateFrame";
import {
  getPillarBySlug,
  getSeriesBySlug,
  getTemplateBySlug,
} from "@/lib/db/data-loader";
import type { CalendarItem, CalendarStatus, ContentFormat } from "@/lib/types";
import {
  STATUS_BADGES,
  formatIconShape,
  pillarColor,
  statusBorderColor,
  type FormatIconShape,
} from "./labels";
import { renderTemplate } from "./template-renderer";
import { formatTime } from "./utils";

const TILE_WIDTH = 168;

const labelStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
};

interface ContentTileProps {
  item: CalendarItem;
  onStatusChange?: (id: string, next: CalendarStatus) => void;
  onDelete?: (id: string) => void;
  selected?: boolean;
  onToggleSelect?: (id: string, additive?: boolean) => void;
  onContextMenu?: (item: CalendarItem, x: number, y: number) => void;
}

export function ContentTile({
  item,
  onStatusChange,
  onDelete,
  selected,
  onToggleSelect,
  onContextMenu,
}: ContentTileProps) {
  const router = useRouter();
  const longPressTimer = useRef<number | null>(null);

  const statusBadge = STATUS_BADGES[item.status];
  const series = getSeriesBySlug(item.series_slug);
  const seriesName = series?.name ?? item.series_slug;
  const pillar = getPillarBySlug(item.pillar);
  const template = getTemplateBySlug(item.template_slug);
  const templateName = template?.name ?? item.template_slug;

  const previewFormat = item.format === "reel" ? "story" : item.format;
  const dimWidth = 1080;
  const dimHeight = previewFormat === "story" ? 1920 : 1080;
  const scale = TILE_WIDTH / dimWidth;
  const previewHeight = dimHeight * scale;

  function handleOpen(e: MouseEvent) {
    if ((e.target as HTMLElement).closest("[data-tile-action]")) return;
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      onToggleSelect?.(item.id, true);
      return;
    }
    router.push(`/editor/${item.id}`);
  }

  function handleContextMenu(e: MouseEvent) {
    if (!onContextMenu) return;
    e.preventDefault();
    onContextMenu(item, e.clientX, e.clientY);
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (!onContextMenu) return;
    const touch = e.touches[0];
    longPressTimer.current = window.setTimeout(() => {
      onContextMenu(item, touch.clientX, touch.clientY);
    }, 500);
  }

  function clearLongPress() {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleStatusClick(e: MouseEvent) {
    e.stopPropagation();
    onStatusChange?.(item.id, item.status);
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    if (window.confirm("Delete this post from the calendar?")) {
      onDelete?.(item.id);
    }
  }

  const tooltip = `${templateName} · ${seriesName}${pillar ? ` · ${pillar.name}` : ""}`;

  return (
    <article
      title={tooltip}
      onClick={handleOpen}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={clearLongPress}
      onTouchMove={clearLongPress}
      style={{
        width: TILE_WIDTH,
        background: "var(--cream)",
        border: `1px solid ${selected ? "var(--pink)" : "rgba(75,21,40,0.08)"}`,
        outline: selected ? "2px solid var(--pink)" : "none",
        outlineOffset: -1,
        borderBottom: `3px solid ${statusBorderColor(item.status)}`,
        borderRadius: 12,
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        cursor: "pointer",
        transition: "transform 120ms ease, box-shadow 120ms ease",
        boxShadow: "0 1px 0 rgba(75,21,40,0.04)",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 6px 18px rgba(75,21,40,0.12)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 0 rgba(75,21,40,0.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {onToggleSelect && (
        <button
          type="button"
          data-tile-action
          aria-label={selected ? "Deselect" : "Select"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(item.id, true);
          }}
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            width: 20,
            height: 20,
            borderRadius: 4,
            background: selected ? "var(--pink)" : "rgba(255,255,255,0.85)",
            border: `1px solid ${selected ? "var(--pink)" : "rgba(75,21,40,0.3)"}`,
            color: selected ? "var(--cream)" : "var(--mauve)",
            cursor: "pointer",
            fontSize: 12,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          {selected ? "✓" : ""}
        </button>
      )}
      <div
        style={{
          width: TILE_WIDTH - 20,
          height: previewHeight,
          position: "relative",
          borderRadius: 8,
          overflow: "hidden",
          background: "var(--blush)",
        }}
      >
        <TemplateFrame format={previewFormat} scale={scale}>
          {renderTemplate(item.template_slug, item.content_data)}
        </TemplateFrame>

        <span
          aria-label={`Pillar: ${pillar?.name ?? item.pillar}`}
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            width: 12,
            height: 12,
            borderRadius: 999,
            background: pillarColor(item.pillar),
            boxShadow: "0 0 0 2px rgba(255,255,255,0.95)",
          }}
        />

        <FormatIcon format={item.format} />

        <button
          type="button"
          data-tile-action
          onClick={handleDelete}
          aria-label="Delete post"
          style={{
            position: "absolute",
            bottom: 6,
            right: 6,
            width: 20,
            height: 20,
            border: "none",
            borderRadius: 4,
            background: "rgba(75,21,40,0.7)",
            color: "var(--cream)",
            cursor: "pointer",
            fontSize: 12,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.85,
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 6,
          minHeight: 16,
        }}
      >
        <span
          style={{
            ...labelStyle,
            fontSize: 9,
            color: "var(--mauve)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            minWidth: 0,
          }}
        >
          {seriesName}
        </span>
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 10,
            color: "var(--mauve)",
            flexShrink: 0,
          }}
        >
          {formatTime(item.scheduled_time) || "—"}
        </span>
        <button
          type="button"
          data-tile-action
          onClick={handleStatusClick}
          title="Click to advance status"
          aria-label={`Status: ${statusBadge.label}`}
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: statusBorderColor(item.status),
            border: "1px solid rgba(75,21,40,0.25)",
            cursor: "pointer",
            padding: 0,
            flexShrink: 0,
          }}
        />
      </div>
    </article>
  );
}

function FormatIcon({ format }: { format: ContentFormat }) {
  const shape: FormatIconShape = formatIconShape(format);
  const wrap: CSSProperties = {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 4,
    background: "rgba(255,255,255,0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 0 1px rgba(75,21,40,0.12)",
    pointerEvents: "none",
  };

  let glyph: React.ReactNode = null;
  if (shape === "square") {
    glyph = (
      <span
        style={{
          width: 9,
          height: 9,
          background: "var(--wine)",
          borderRadius: 1,
        }}
      />
    );
  } else if (shape === "tall") {
    glyph = (
      <span
        style={{
          width: 6,
          height: 11,
          background: "var(--wine)",
          borderRadius: 1,
        }}
      />
    );
  } else if (shape === "triangle") {
    glyph = (
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: "7px solid var(--wine)",
          borderTop: "5px solid transparent",
          borderBottom: "5px solid transparent",
          marginLeft: 1,
        }}
      />
    );
  } else if (shape === "layers") {
    glyph = (
      <span style={{ position: "relative", width: 10, height: 10 }}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(75,21,40,0.45)",
            borderRadius: 1,
            transform: "translate(2px,2px)",
          }}
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--wine)",
            borderRadius: 1,
          }}
        />
      </span>
    );
  }

  return <span style={wrap}>{glyph}</span>;
}
