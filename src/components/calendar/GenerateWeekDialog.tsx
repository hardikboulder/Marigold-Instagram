"use client";

import { useEffect, useMemo, useState } from "react";
import { TemplateFrame } from "@/components/brand/TemplateFrame";
import { getSeriesBySlug } from "@/lib/db/data-loader";
import type { CalendarItem } from "@/lib/types";
import { FORMAT_BADGES, pillarColor } from "./labels";
import { Modal } from "./Modal";
import { renderTemplate } from "./template-renderer";
import { formatWeekLabel, parseIsoDate } from "./utils";

interface GenerateWeekDialogProps {
  open: boolean;
  weekStart: Date;
  /**
   * Optional. Items the user already has in the calendar — passed back to the
   * server so the grid sequencer can read the last row of the existing grid
   * and avoid stacking same-coloured posts vertically.
   */
  existingItems?: CalendarItem[];
  onClose: () => void;
  onAccept: (items: CalendarItem[]) => void;
}

export function GenerateWeekDialog({
  open,
  weekStart,
  existingItems = [],
  onClose,
  onAccept,
}: GenerateWeekDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [gridReasoning, setGridReasoning] = useState<string | null>(null);
  const [gridOrderIds, setGridOrderIds] = useState<string[]>([]);
  const [storyReelIds, setStoryReelIds] = useState<string[]>([]);

  const startIso = useMemo(() => weekStart.toISOString(), [weekStart]);

  useEffect(() => {
    if (!open) {
      setItems([]);
      setRejected(new Set());
      setError(null);
      setLoading(false);
      setGridReasoning(null);
      setGridOrderIds([]);
      setStoryReelIds([]);
    }
  }, [open]);

  async function runGeneration() {
    setLoading(true);
    setError(null);
    setItems([]);
    setRejected(new Set());
    setGridReasoning(null);
    setGridOrderIds([]);
    setStoryReelIds([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "week",
          startDate: startIso,
          previousWeekItems: existingItems,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error ?? "AI generation failed.");
      }
      setItems(data.data as CalendarItem[]);
      setGridReasoning(
        typeof data.gridReasoning === "string" ? data.gridReasoning : null,
      );
      setGridOrderIds(Array.isArray(data.gridOrder) ? data.gridOrder : []);
      setStoryReelIds(
        Array.isArray(data.storyReelSchedule) ? data.storyReelSchedule : [],
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function toggleReject(id: string) {
    setRejected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAcceptAll() {
    const accepted = items.filter((i) => !rejected.has(i.id));
    onAccept(accepted);
  }

  return (
    <Modal
      open={open}
      title={`Generate ${formatWeekLabel(weekStart)}`}
      subtitle="Claude will plan the week — series, template, content data, captions. Review the suggestions and accept the ones you like."
      onClose={onClose}
      width={920}
    >
      {!loading && items.length === 0 && !error && (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <button
            type="button"
            onClick={runGeneration}
            style={primaryButton}
          >
            Generate week with AI
          </button>
        </div>
      )}

      {loading && (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 28,
              color: "var(--pink)",
              marginBottom: 8,
            }}
          >
            cooking up some content…
          </div>
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 13,
              color: "var(--mauve)",
            }}
          >
            Claude is planning the week. This usually takes 10–25 seconds.
          </p>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 16,
            background: "var(--blush)",
            border: "1px solid var(--deep-pink)",
            borderRadius: 8,
            color: "var(--deep-pink)",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={runGeneration} style={secondaryButton}>
              Try again
            </button>
          </div>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          {(gridReasoning || gridOrderIds.length > 0 || storyReelIds.length > 0) && (
            <div
              style={{
                background: "var(--blush)",
                border: "1px dashed rgba(75,21,40,0.18)",
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.6,
                  color: "var(--wine)",
                }}
              >
                Grid plan
              </span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 12,
                  color: "var(--wine)",
                  lineHeight: 1.45,
                }}
              >
                {gridReasoning ?? "Sequenced for colour + pillar variety."}
              </span>
              <PillarSummary items={items} />
              <span
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 16,
                  color: "var(--pink)",
                }}
              >
                {gridOrderIds.length} grid post{gridOrderIds.length === 1 ? "" : "s"} ·
                {" "}{storyReelIds.length} stor{storyReelIds.length === 1 ? "y" : "ies"}/reel
                {storyReelIds.length === 1 ? "" : "s"} (off-grid)
              </span>
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {items.map((item) => (
              <PreviewCard
                key={item.id}
                item={item}
                rejected={rejected.has(item.id)}
                onToggle={() => toggleReject(item.id)}
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              borderTop: "1px dashed rgba(75,21,40,0.15)",
              paddingTop: 16,
            }}
          >
            <button type="button" onClick={runGeneration} style={secondaryButton}>
              Regenerate
            </button>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 12,
                  color: "var(--mauve)",
                }}
              >
                {items.length - rejected.size} of {items.length} selected
              </span>
              <button
                type="button"
                onClick={handleAcceptAll}
                disabled={items.length - rejected.size === 0}
                style={{
                  ...primaryButton,
                  opacity: items.length - rejected.size === 0 ? 0.4 : 1,
                  cursor:
                    items.length - rejected.size === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Accept selected
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

interface PreviewCardProps {
  item: CalendarItem;
  rejected: boolean;
  onToggle: () => void;
}

function PreviewCard({ item, rejected, onToggle }: PreviewCardProps) {
  const date = parseIsoDate(item.scheduled_date);
  const dayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
  const previewFormat = item.format === "reel" ? "story" : item.format;
  const dimWidth = 1080;
  const scale = 200 / dimWidth;
  const formatBadge = FORMAT_BADGES[item.format];
  const seriesName =
    getSeriesBySlug(item.series_slug)?.name ?? item.series_slug;

  return (
    <div
      style={{
        background: rejected ? "rgba(75,21,40,0.06)" : "var(--cream)",
        border: `1px solid ${rejected ? "rgba(75,21,40,0.2)" : "rgba(75,21,40,0.1)"}`,
        borderRadius: 12,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        opacity: rejected ? 0.45 : 1,
        transition: "opacity 120ms ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1.4,
            color: "var(--wine)",
          }}
        >
          {dayLabel}
        </span>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1.4,
            padding: "2px 7px",
            borderRadius: 4,
            background: formatBadge.bg,
            color: formatBadge.fg,
          }}
        >
          {formatBadge.label}
        </span>
      </div>

      <TemplateFrame format={previewFormat} scale={scale}>
        {renderTemplate(item.template_slug, item.content_data)}
      </TemplateFrame>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: pillarColor(item.pillar),
          }}
          title={`Pillar: ${item.pillar}`}
        />
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1.4,
            color: "var(--mauve)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {seriesName}
        </span>
      </div>

      {item.ai_rationale && (
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 11,
            color: "var(--mauve)",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {item.ai_rationale}
        </p>
      )}

      <button
        type="button"
        onClick={onToggle}
        style={{
          ...secondaryButton,
          fontSize: 10,
          padding: "6px 10px",
          background: rejected ? "var(--mint)" : "transparent",
          color: rejected ? "var(--wine)" : "var(--deep-pink)",
        }}
      >
        {rejected ? "Re-include" : "Reject"}
      </button>
    </div>
  );
}

function PillarSummary({ items }: { items: CalendarItem[] }) {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.pillar, (counts.get(item.pillar) ?? 0) + 1);
  }
  const order: { slug: string; label: string }[] = [
    { slug: "engage", label: "Engage" },
    { slug: "educate", label: "Educate" },
    { slug: "inspire", label: "Inspire" },
    { slug: "connect", label: "Connect" },
    { slug: "convert", label: "Convert" },
  ];
  const total = items.length;
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginTop: 4,
      }}
    >
      {order.map((p) => {
        const count = counts.get(p.slug) ?? 0;
        const share = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <span
            key={p.slug}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "'Syne', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.4,
              color: count > 0 ? "var(--wine)" : "var(--mauve)",
              opacity: count > 0 ? 1 : 0.6,
            }}
            title={`${count} ${p.label} item${count === 1 ? "" : "s"} (${share}%)`}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: pillarColor(p.slug as never),
              }}
            />
            {p.label} {count}
          </span>
        );
      })}
    </div>
  );
}

const primaryButton = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: 2,
  padding: "12px 24px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: "3px 3px 0 var(--gold)",
};

const secondaryButton = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: 1.6,
  padding: "10px 18px",
  background: "transparent",
  color: "var(--wine)",
  border: "1px solid var(--wine)",
  borderRadius: 4,
  cursor: "pointer",
};
