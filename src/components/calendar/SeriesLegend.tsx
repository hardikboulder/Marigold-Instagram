"use client";

/**
 * Pillar legend — shows how many items in the current view belong to each
 * Content Pillar plus a tiny share bar so the creator sees pillar
 * distribution at a glance. Replaces the old per-series legend; series
 * are still browsable inside each pillar (gallery, add-post flow).
 *
 * Exported as `SeriesLegend` for backward compatibility with existing
 * imports — the component itself is pillar-driven.
 */

import type { CSSProperties } from "react";
import type { CalendarItem, PillarSlug } from "@/lib/types";
import { pillarColor } from "./labels";
import { getActivePillarList } from "./utils";

interface PillarLegendProps {
  items: CalendarItem[];
  /** Solo'd pillar (filter mode); others render dimmed. */
  soloPillar?: PillarSlug | null;
  onTogglePillar?: (slug: PillarSlug) => void;
  compact?: boolean;
  /**
   * Legacy props from the old SeriesLegend API. Tolerated so existing
   * call sites keep compiling — they're ignored.
   */
  activeSeries?: string[];
  onToggleSeries?: (slug: string) => void;
}

export function SeriesLegend({
  items,
  soloPillar = null,
  onTogglePillar,
  compact = false,
}: PillarLegendProps) {
  const pillars = getActivePillarList();
  const total = items.length;

  const counts = new Map<PillarSlug, number>();
  for (const item of items) {
    counts.set(item.pillar, (counts.get(item.pillar) ?? 0) + 1);
  }

  return (
    <aside
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 10 : 14,
        flexWrap: "wrap",
        padding: compact ? "8px 14px" : "10px 16px",
        background: "var(--cream)",
        border: "1px solid rgba(75,21,40,0.08)",
        borderRadius: 12,
      }}
      aria-label="Pillar mix"
    >
      <span
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 9,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 1.6,
          color: "var(--mauve)",
          flexShrink: 0,
        }}
      >
        Pillar mix
      </span>

      {/* Stacked share bar */}
      <div
        style={{
          flex: 1,
          minWidth: 200,
          height: 14,
          borderRadius: 999,
          background: "rgba(75,21,40,0.06)",
          overflow: "hidden",
          display: "flex",
        }}
        role="img"
        aria-label={
          total === 0
            ? "No items yet"
            : pillars
                .map((p) => {
                  const c = counts.get(p.slug) ?? 0;
                  return `${p.name} ${Math.round((c / total) * 100)}%`;
                })
                .join(", ")
        }
      >
        {total > 0 &&
          pillars.map((p) => {
            const count = counts.get(p.slug) ?? 0;
            if (count === 0) return null;
            const sharePct = (count / total) * 100;
            const dim = Boolean(soloPillar && soloPillar !== p.slug);
            return (
              <div
                key={p.slug}
                title={`${p.name} — ${count} of ${total} (${sharePct.toFixed(0)}%)`}
                style={{
                  width: `${sharePct}%`,
                  background: pillarColor(p.slug),
                  opacity: dim ? 0.3 : 1,
                  transition: "opacity 120ms ease",
                }}
              />
            );
          })}
      </div>

      {/* Per-pillar count chips with target delta */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {pillars.map((p) => {
          const count = counts.get(p.slug) ?? 0;
          const share = total === 0 ? 0 : count / total;
          const target = p.default_share;
          const delta = share - target;
          const status: "on" | "low" | "high" =
            total === 0
              ? "low"
              : Math.abs(delta) < 0.08
                ? "on"
                : delta < 0
                  ? "low"
                  : "high";
          const dim = Boolean(soloPillar && soloPillar !== p.slug);
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => onTogglePillar?.(p.slug)}
              disabled={!onTogglePillar}
              title={`${p.name} — ${count} of ${total} (${(share * 100).toFixed(0)}%) · target ${(target * 100).toFixed(0)}%`}
              style={chipStyle(dim, !!onTogglePillar)}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: pillarColor(p.slug),
                  boxShadow: "inset 0 0 0 1px rgba(75,21,40,0.15)",
                }}
              />
              <span style={{ whiteSpace: "nowrap" }}>{p.name}</span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 10,
                  color: "var(--wine)",
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
              {total > 0 && (
                <span
                  aria-hidden
                  title={
                    status === "on"
                      ? "On target"
                      : status === "low"
                        ? `Under target (${(target * 100).toFixed(0)}%)`
                        : `Over target (${(target * 100).toFixed(0)}%)`
                  }
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 9,
                    fontWeight: 700,
                    color:
                      status === "on"
                        ? "var(--mauve)"
                        : status === "low"
                          ? "var(--deep-pink)"
                          : "var(--gold)",
                  }}
                >
                  {status === "on" ? "●" : status === "low" ? "↓" : "↑"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function chipStyle(dim: boolean, interactive: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px 4px 8px",
    borderRadius: 999,
    background: "transparent",
    border: "1px solid rgba(75,21,40,0.12)",
    cursor: interactive ? "pointer" : "default",
    fontFamily: "'Syne', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "var(--wine)",
    opacity: dim ? 0.4 : 1,
    transition: "opacity 120ms ease",
  };
}
