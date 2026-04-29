"use client";

/**
 * Instagram-style 3-column grid view of the feed.
 *
 * Posts (1080x1080) render at-scale into a square cell. Stories/reels
 * (1080x1920) are center-cropped to mimic how Instagram clips reels on the
 * profile grid. Cells are sorted newest-first; drag-and-drop swaps the
 * scheduled dates of the source and target items.
 *
 * Row analysis runs on every row of 3 (pillar mix + color repetition) so the
 * grid doubles as a content-strategy review surface, not just a viewer.
 */

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
} from "react";
import { TemplateFrame } from "@/components/brand/TemplateFrame";
import {
  computeGridHealthScore,
  getGridColorProfile,
  suggestGridFix,
  type GridFixSuggestion,
  type GridHealthIssue,
  type GridHealthScore,
} from "@/lib/ai/content-strategy";
import { getSeriesBySlug } from "@/lib/db/data-loader";
import type { CalendarItem, ContentFormat } from "@/lib/types";
import { FORMAT_BADGES, seriesColor } from "./labels";
import { renderTemplate } from "./template-renderer";
import { applyFilters, parseIsoDate, type CalendarFilters } from "./utils";

const CELL_SIZE = 220;
const GRID_GAP = 3;
const COLUMNS = 3;
const INITIAL_ROWS = 9;
const ROWS_PER_LOAD = 6;

interface FeedGridViewProps {
  items: CalendarItem[];
  filters: CalendarFilters;
  onSwapDates: (sourceId: string, targetId: string) => void;
  onAddPost: (defaultDate?: Date) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string, additive?: boolean) => void;
  onContextMenu?: (item: CalendarItem, x: number, y: number) => void;
}

export function FeedGridView({
  items,
  filters,
  onSwapDates,
  onAddPost,
  selectedIds,
  onToggleSelect,
  onContextMenu,
}: FeedGridViewProps) {
  const [gridPostsOnly, setGridPostsOnly] = useState(true);
  const [visibleRows, setVisibleRows] = useState(INITIAL_ROWS);

  // The grid is global, not weekly. Apply the same series/format/status filters
  // that the calendar view uses so the two views stay consistent.
  const filtered = useMemo(() => applyFilters(items, filters), [items, filters]);

  const feedPosts = useMemo(
    () =>
      [...filtered]
        .filter((item) => item.format === "post")
        .sort((a, b) => (a.scheduled_date < b.scheduled_date ? 1 : -1)),
    [filtered],
  );

  const auxiliary = useMemo(
    () =>
      [...filtered]
        .filter((item) => item.format !== "post")
        .sort((a, b) => (a.scheduled_date < b.scheduled_date ? 1 : -1)),
    [filtered],
  );

  // Stories/reels can either be hidden entirely or interleaved with a "won't
  // appear on grid" overlay (Instagram itself only puts posts on the grid).
  const gridItems = useMemo(() => {
    if (gridPostsOnly) return feedPosts;
    return [...filtered].sort((a, b) =>
      a.scheduled_date < b.scheduled_date ? 1 : -1,
    );
  }, [filtered, feedPosts, gridPostsOnly]);

  const visibleCount = visibleRows * COLUMNS;
  const visibleItems = gridItems.slice(0, visibleCount);

  // Pad to a full row of 3 with placeholder cells so the bottom edge always
  // looks like a complete grid (and gives the user "+" slots to add posts).
  const remainder = visibleItems.length % COLUMNS;
  const placeholderCount = remainder === 0 ? 0 : COLUMNS - remainder;
  const rows: GridCell[][] = [];
  for (let i = 0; i < visibleItems.length; i += COLUMNS) {
    rows.push(
      visibleItems.slice(i, i + COLUMNS).map((item) => ({ kind: "item", item })),
    );
  }
  if (placeholderCount > 0 && rows.length > 0) {
    rows[rows.length - 1].push(
      ...Array.from({ length: placeholderCount }, () => ({
        kind: "placeholder" as const,
      })),
    );
  }

  const hasMore = visibleCount < gridItems.length;

  // Grid Health analyses the *visible feed posts* — same set the user is
  // looking at — so the score matches what's on screen.
  const visibleFeedPosts = useMemo(
    () => visibleItems.filter((i) => i.format === "post"),
    [visibleItems],
  );
  const gridHealth = useMemo(
    () => computeGridHealthScore(visibleFeedPosts),
    [visibleFeedPosts],
  );
  const gridFix = useMemo(
    () => suggestGridFix(visibleFeedPosts),
    [visibleFeedPosts],
  );

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragEnd = () => {
    setDraggingId(null);
    setHoverId(null);
  };
  const handleDrop = (targetId: string) => {
    if (draggingId && draggingId !== targetId) {
      onSwapDates(draggingId, targetId);
    }
    handleDragEnd();
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <GridControls
        gridPostsOnly={gridPostsOnly}
        onToggleGridPostsOnly={() => setGridPostsOnly((v) => !v)}
        postCount={feedPosts.length}
        auxiliaryCount={auxiliary.length}
      />

      {visibleFeedPosts.length > 0 && (
        <GridHealthCard
          score={gridHealth}
          fix={gridFix}
          posts={visibleFeedPosts}
        />
      )}

      {gridItems.length === 0 ? (
        <EmptyGridState onAdd={() => onAddPost()} />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 240px",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: GRID_GAP,
              background: "var(--cream)",
              padding: GRID_GAP,
              borderRadius: 14,
              border: "1px solid rgba(75,21,40,0.08)",
              maxWidth: CELL_SIZE * COLUMNS + GRID_GAP * (COLUMNS - 1) + GRID_GAP * 2,
            }}
          >
            {rows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${COLUMNS}, ${CELL_SIZE}px)`,
                  gap: GRID_GAP,
                }}
              >
                {row.map((cell, colIdx) => {
                  if (cell.kind === "placeholder") {
                    return (
                      <PlaceholderCell
                        key={`ph-${rowIdx}-${colIdx}`}
                        onClick={() => onAddPost()}
                      />
                    );
                  }
                  const isDragging = draggingId === cell.item.id;
                  const isHovered =
                    hoverId === cell.item.id && draggingId !== null;
                  return (
                    <GridCellView
                      key={cell.item.id}
                      item={cell.item}
                      isDragging={isDragging}
                      isHoverTarget={isHovered}
                      selected={selectedIds?.has(cell.item.id) ?? false}
                      onToggleSelect={onToggleSelect}
                      onContextMenu={onContextMenu}
                      onDragStart={() => handleDragStart(cell.item.id)}
                      onDragEnd={handleDragEnd}
                      onDragEnter={() => setHoverId(cell.item.id)}
                      onDragLeave={() => {
                        if (hoverId === cell.item.id) setHoverId(null);
                      }}
                      onDrop={() => handleDrop(cell.item.id)}
                    />
                  );
                })}
              </div>
            ))}

            {hasMore && (
              <button
                type="button"
                onClick={() =>
                  setVisibleRows((r) => r + ROWS_PER_LOAD)
                }
                style={{
                  marginTop: 12,
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.6,
                  padding: "12px 16px",
                  background: "var(--blush)",
                  color: "var(--wine)",
                  border: "1px dashed rgba(75,21,40,0.3)",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Load older posts ({gridItems.length - visibleCount} remaining)
              </button>
            )}
          </div>

          <RowAnalysisSidebar rows={rows} />
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Grid Health Score
// ---------------------------------------------------------------------------

interface GridHealthCardProps {
  score: GridHealthScore;
  fix: GridFixSuggestion | null;
  posts: CalendarItem[];
}

function GridHealthCard({ score, fix, posts }: GridHealthCardProps) {
  const overallTone = scoreTone(score.overall);
  const [showPreview, setShowPreview] = useState(false);
  const postById = useMemo(
    () => new Map(posts.map((p) => [p.id, p])),
    [posts],
  );
  return (
    <div
      style={{
        background: "var(--cream)",
        border: "1px solid rgba(75,21,40,0.1)",
        borderRadius: 12,
        padding: 16,
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 18,
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          padding: "0 16px",
          borderRight: "1px dashed rgba(75,21,40,0.15)",
        }}
      >
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1.6,
            color: "var(--mauve)",
          }}
        >
          Grid health
        </span>
        <span
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 42,
            color: overallTone.color,
            fontStyle: "italic",
            lineHeight: 1,
          }}
        >
          {score.overall}
        </span>
        <span
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 16,
            color: overallTone.color,
          }}
        >
          {overallTone.label}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <ScoreMeter label="Color variety" value={score.colorVariety} />
          <ScoreMeter label="Pillar mix" value={score.pillarMix} />
          <ScoreMeter label="Visual rhythm" value={score.visualRhythm} />
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.4,
              color: "var(--mauve)",
              alignSelf: "center",
            }}
          >
            {score.postsAnalyzed} post{score.postsAnalyzed === 1 ? "" : "s"}
          </span>
        </div>

        {score.issues.length > 0 && (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {score.issues.slice(0, 3).map((issue, idx) => (
              <GridIssueRow key={idx} issue={issue} />
            ))}
            {score.issues.length > 3 && (
              <li
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 11,
                  color: "var(--mauve)",
                }}
              >
                + {score.issues.length - 3} more flag{score.issues.length - 3 === 1 ? "" : "s"} below in row analysis.
              </li>
            )}
          </ul>
        )}

        {score.issues.length === 0 && (
          <span
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 18,
              color: "var(--pink)",
            }}
          >
            grid is reading clean — keep going.
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {fix ? (
          <>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1.6,
                padding: "10px 16px",
                background: showPreview ? "var(--cream)" : "var(--wine)",
                color: showPreview ? "var(--wine)" : "var(--cream)",
                border: showPreview ? "1px solid var(--wine)" : "none",
                borderRadius: 4,
                cursor: "pointer",
                boxShadow: showPreview ? "none" : "2px 2px 0 var(--gold)",
              }}
              title={fix.rationale}
            >
              {showPreview ? "Hide suggestion" : "Suggest fix"}
            </button>
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 10,
                color: "var(--mauve)",
                maxWidth: 180,
                lineHeight: 1.35,
              }}
            >
              Predicted: {fix.predictedScore.overall}/100
            </span>
          </>
        ) : (
          <span
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 16,
              color: "var(--mauve)",
              maxWidth: 180,
              textAlign: "right",
            }}
          >
            no swap needed
          </span>
        )}
      </div>

      {fix && showPreview && (
        <div
          style={{
            gridColumn: "1 / -1",
            marginTop: 4,
            paddingTop: 12,
            borderTop: "1px dashed rgba(75,21,40,0.15)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 11.5,
              color: "var(--wine)",
              lineHeight: 1.4,
            }}
          >
            {fix.rationale} Drag posts on the grid below to match this order.
          </span>
          <SuggestedOrderStrip
            order={fix.newOrder}
            postById={postById}
          />
        </div>
      )}
    </div>
  );
}

function SuggestedOrderStrip({
  order,
  postById,
}: {
  order: string[];
  postById: Map<string, CalendarItem>;
}) {
  const tileSize = 38;
  const colorVar: Record<string, string> = {
    pink: "var(--pink)",
    wine: "var(--wine)",
    cream: "var(--cream)",
    colorful: "linear-gradient(135deg, var(--gold), var(--lavender), var(--mint))",
  };
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(3, ${tileSize}px)`,
        gap: 4,
        padding: 6,
        background: "rgba(75,21,40,0.04)",
        borderRadius: 8,
        width: "fit-content",
      }}
    >
      {order.map((id, idx) => {
        const post = postById.get(id);
        if (!post) return null;
        const profile = getGridColorProfile(post.series_slug, post.template_slug);
        const bg = colorVar[profile] ?? "var(--blush)";
        return (
          <div
            key={id}
            title={`Row ${Math.floor(idx / 3) + 1}, Col ${(idx % 3) + 1} — ${post.series_slug} (${profile})`}
            style={{
              width: tileSize,
              height: tileSize,
              borderRadius: 4,
              background: bg,
              border: "1px solid rgba(75,21,40,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Syne', sans-serif",
              fontSize: 9,
              fontWeight: 700,
              color: profile === "wine" ? "var(--cream)" : "var(--wine)",
            }}
          >
            {idx + 1}
          </div>
        );
      })}
    </div>
  );
}

function ScoreMeter({ label, value }: { label: string; value: number }) {
  const tone = scoreTone(value);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 110 }}>
      <span
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.4,
          color: "var(--mauve)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          height: 6,
          background: "rgba(75,21,40,0.08)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: tone.color,
            transition: "width 200ms ease",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 11,
          color: "var(--wine)",
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function GridIssueRow({ issue }: { issue: GridHealthIssue }) {
  const tone = issue.severity === "warn" ? "var(--deep-pink)" : "var(--mauve)";
  return (
    <li
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 11.5,
        color: "var(--wine)",
        lineHeight: 1.4,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: tone,
          marginTop: 6,
          flexShrink: 0,
        }}
      />
      <span>{issue.message}</span>
    </li>
  );
}

function scoreTone(value: number): { color: string; label: string } {
  if (value >= 85) return { color: "var(--mint)", label: "looking sharp" };
  if (value >= 70) return { color: "var(--gold)", label: "pretty solid" };
  if (value >= 55) return { color: "var(--peach)", label: "needs a tweak" };
  return { color: "var(--deep-pink)", label: "rebalance time" };
}

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

type GridCell =
  | { kind: "item"; item: CalendarItem }
  | { kind: "placeholder" };

interface GridCellViewProps {
  item: CalendarItem;
  isDragging: boolean;
  isHoverTarget: boolean;
  selected: boolean;
  onToggleSelect?: (id: string, additive?: boolean) => void;
  onContextMenu?: (item: CalendarItem, x: number, y: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
}

function GridCellView({
  item,
  isDragging,
  isHoverTarget,
  selected,
  onToggleSelect,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragLeave,
  onDrop,
}: GridCellViewProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const longPress = useRef<number | null>(null);
  const seriesName =
    getSeriesBySlug(item.series_slug)?.name ?? item.series_slug;
  const isAuxiliary = item.format !== "post";

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.id);
    onDragStart();
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (isAuxiliary) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-tile-action]")) return;
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      onToggleSelect?.(item.id, true);
      return;
    }
    router.push(`/editor/${item.id}`);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!onContextMenu) return;
    e.preventDefault();
    onContextMenu(item, e.clientX, e.clientY);
  };

  return (
    <div
      draggable={!isAuxiliary}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={(e) => {
        if (!onContextMenu) return;
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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        width: CELL_SIZE,
        height: CELL_SIZE,
        overflow: "hidden",
        background: "var(--blush)",
        cursor: isAuxiliary ? "pointer" : "grab",
        opacity: isDragging ? 0.35 : 1,
        outline: selected
          ? "3px solid var(--pink)"
          : isHoverTarget
            ? "3px solid var(--pink)"
            : "none",
        outlineOffset: -3,
        transition: "outline 80ms ease, opacity 120ms ease",
      }}
      title={`${seriesName} — ${item.scheduled_date}`}
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
            width: 22,
            height: 22,
            borderRadius: 4,
            background: selected ? "var(--pink)" : "rgba(255,255,255,0.85)",
            border: `1px solid ${selected ? "var(--pink)" : "rgba(75,21,40,0.3)"}`,
            color: selected ? "var(--cream)" : "var(--mauve)",
            cursor: "pointer",
            fontSize: 13,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 4,
            opacity: selected || hovered ? 1 : 0,
            transition: "opacity 120ms ease",
          }}
        >
          {selected ? "✓" : "▢"}
        </button>
      )}
      <ThumbnailRender item={item} />

      {/* Format icon overlay (camera = reel, layers = carousel-ish) */}
      {item.format !== "post" && (
        <FormatIcon format={item.format} />
      )}

      {/* "Won't appear on grid" overlay for stories/reels when they're
          interleaved into the grid view. */}
      {isAuxiliary && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(75,21,40,0.55), rgba(75,21,40,0.15))",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-start",
            padding: 10,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.4,
              color: "var(--cream)",
              background: "rgba(75,21,40,0.8)",
              padding: "4px 8px",
              borderRadius: 4,
            }}
          >
            Not on grid · {FORMAT_BADGES[item.format].label}
          </span>
        </div>
      )}

      {hovered && !isDragging && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(75,21,40,0) 40%, rgba(75,21,40,0.78) 100%)",
            color: "var(--cream)",
            padding: 10,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 4,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.4,
              opacity: 0.85,
            }}
          >
            {item.scheduled_date}
          </span>
          <span
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 16,
              lineHeight: 1.1,
              fontStyle: "italic",
            }}
          >
            {seriesName}
          </span>
        </div>
      )}
    </div>
  );
}

interface ThumbnailRenderProps {
  item: CalendarItem;
}

/**
 * Renders the post template at full 1080-width resolution and scales it
 * down to fit a square cell. For story/reel formats (1080x1920) we shift the
 * rendered surface up so the middle 1080 of the height shows — that's how
 * Instagram displays reels on the profile grid.
 */
function ThumbnailRender({ item }: ThumbnailRenderProps) {
  const previewFormat = item.format === "reel" ? "story" : item.format;
  const scale = CELL_SIZE / 1080;

  if (previewFormat === "post") {
    return (
      <div style={{ width: CELL_SIZE, height: CELL_SIZE }}>
        <TemplateFrame format="post" scale={scale} style={{ boxShadow: "none", borderRadius: 0 }}>
          {renderTemplate(item.template_slug, item.content_data)}
        </TemplateFrame>
      </div>
    );
  }

  // Story/reel: render at 1080x1920 scale, then translate the inner frame
  // up by the cropped band height so the visible square is the middle 1080.
  const cropOffset = ((1920 - 1080) / 2) * scale;
  return (
    <div
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -cropOffset,
          left: 0,
        }}
      >
        <TemplateFrame format="story" scale={scale} style={{ boxShadow: "none", borderRadius: 0 }}>
          {renderTemplate(item.template_slug, item.content_data)}
        </TemplateFrame>
      </div>
    </div>
  );
}

function FormatIcon({ format }: { format: ContentFormat }) {
  const icon = format === "reel" ? <ReelIcon /> : <LayersIcon />;
  return (
    <div
      style={{
        position: "absolute",
        top: 6,
        right: 6,
        width: 22,
        height: 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.92)",
        borderRadius: 4,
        color: "var(--wine)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }}
      title={FORMAT_BADGES[format].label}
    >
      {icon}
    </div>
  );
}

function ReelIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 7l5 3 5-3M3 7v10l5 3 5-3V7M13 10l5-3 3 2v10l-3 2-5-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="6" y="6" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="3" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.6" fill="white" />
    </svg>
  );
}

function PlaceholderCell({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        background: "var(--blush)",
        border: "2px dashed rgba(75,21,40,0.25)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        color: "var(--mauve)",
      }}
    >
      <span
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 36,
          lineHeight: 1,
          color: "var(--pink)",
        }}
      >
        +
      </span>
      <span
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.6,
        }}
      >
        Add post
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Controls + auxiliary strip + analysis
// ---------------------------------------------------------------------------

interface GridControlsProps {
  gridPostsOnly: boolean;
  onToggleGridPostsOnly: () => void;
  postCount: number;
  auxiliaryCount: number;
}

function GridControls({
  gridPostsOnly,
  onToggleGridPostsOnly,
  postCount,
  auxiliaryCount,
}: GridControlsProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <span
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 28,
            color: "var(--wine)",
            fontStyle: "italic",
          }}
        >
          @themarigold grid
        </span>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1.6,
            color: "var(--mauve)",
          }}
        >
          {postCount} feed posts · {auxiliaryCount} stories/reels
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1.6,
            color: "var(--mauve)",
          }}
        >
          Show
        </span>
        <SegmentedToggle
          options={[
            { value: "posts", label: "Grid posts only" },
            { value: "all", label: "All formats" },
          ]}
          value={gridPostsOnly ? "posts" : "all"}
          onChange={(v) => {
            if ((v === "posts") !== gridPostsOnly) onToggleGridPostsOnly();
          }}
        />
      </div>
    </div>
  );
}

interface SegmentedToggleProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: SegmentedToggleProps<T>) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {options.map((opt) => {
        const active = opt.value === value;
        const style: CSSProperties = {
          fontFamily: "'Syne', sans-serif",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.4,
          padding: "5px 12px",
          background: active ? "var(--wine)" : "transparent",
          color: active ? "var(--cream)" : "var(--wine)",
          border: `1px solid ${active ? "var(--wine)" : "rgba(75,21,40,0.25)"}`,
          borderRadius: 999,
          cursor: "pointer",
        };
        return (
          <button
            key={opt.value}
            type="button"
            style={style}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

interface RowAnalysisSidebarProps {
  rows: GridCell[][];
}

function RowAnalysisSidebar({ rows }: RowAnalysisSidebarProps) {
  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        position: "sticky",
        top: 16,
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.6,
          color: "var(--mauve)",
          marginBottom: 4,
          paddingLeft: 4,
        }}
      >
        Row analysis
      </div>
      {rows.map((row, idx) => (
        <RowAnalysisCard key={idx} row={row} index={idx} />
      ))}
      {rows.length === 0 && (
        <p
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 18,
            color: "var(--pink)",
            paddingLeft: 4,
          }}
        >
          add posts to see row vibes
        </p>
      )}
    </aside>
  );
}

function RowAnalysisCard({
  row,
  index,
}: {
  row: GridCell[];
  index: number;
}) {
  const items = row
    .filter((c): c is { kind: "item"; item: CalendarItem } => c.kind === "item")
    .map((c) => c.item);

  const seriesSlugs = items.map((i) => i.series_slug);
  const distinctSeries = new Set(seriesSlugs);
  const sameSeries =
    items.length === COLUMNS && distinctSeries.size === 1;
  const sameTemplate =
    items.length === COLUMNS &&
    new Set(items.map((i) => i.template_slug)).size === 1;

  const colors = items.map((i) => seriesColor(i.series_slug));
  const colorBalance =
    items.length < 2
      ? "neutral"
      : distinctSeries.size === 1
        ? "low"
        : distinctSeries.size === items.length
          ? "high"
          : "medium";

  const flags: { label: string; tone: "warn" | "info" | "good" }[] = [];
  if (sameSeries) flags.push({ label: "3 of the same series", tone: "warn" });
  if (sameTemplate)
    flags.push({ label: "Identical template repeated", tone: "warn" });
  if (!sameSeries && colorBalance === "high")
    flags.push({ label: "Strong variety", tone: "good" });
  if (items.length < COLUMNS)
    flags.push({ label: "Partial row", tone: "info" });

  return (
    <div
      style={{
        background: "var(--cream)",
        border: "1px solid rgba(75,21,40,0.08)",
        borderRadius: 8,
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        height: CELL_SIZE / 3 + 9, // roughly aligns with each row visually
        minHeight: 84,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1.4,
            color: "var(--mauve)",
          }}
        >
          Row {index + 1}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {colors.map((c, i) => (
            <span
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: c,
                border: "1px solid rgba(75,21,40,0.15)",
              }}
            />
          ))}
        </div>
      </div>

      {flags.length === 0 ? (
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 11,
            color: "var(--mauve)",
          }}
        >
          Mixed series — feed flow looks balanced.
        </span>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {flags.map((f, i) => (
            <span
              key={i}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                padding: "3px 6px",
                borderRadius: 4,
                background:
                  f.tone === "warn"
                    ? "var(--peach)"
                    : f.tone === "good"
                      ? "var(--mint)"
                      : "var(--blush)",
                color: "var(--wine)",
              }}
            >
              {f.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stories & Reels strip
// ---------------------------------------------------------------------------

function AuxiliaryStrip({ items }: { items: CalendarItem[] }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Suppress hydration mismatch on the date label by formatting client-side.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const formatLabel = useCallback((iso: string) => {
    if (!mounted) return iso;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(parseIsoDate(iso));
  }, [mounted]);

  if (items.length === 0) {
    return (
      <div
        style={{
          padding: "20px 18px",
          background: "var(--blush)",
          border: "1px dashed rgba(75,21,40,0.2)",
          borderRadius: 12,
          fontFamily: "'Caveat', cursive",
          fontSize: 18,
          color: "var(--pink)",
        }}
      >
        no stories or reels in the current filters — those are auxiliary content,
        they live off the grid.
      </div>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 22,
            color: "var(--wine)",
            fontStyle: "italic",
          }}
        >
          Stories &amp; reels
        </span>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1.6,
            color: "var(--mauve)",
          }}
        >
          Off-grid · {items.length} item{items.length === 1 ? "" : "s"}
        </span>
      </div>

      <div
        ref={stripRef}
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          padding: "8px 4px 16px",
          scrollSnapType: "x mandatory",
        }}
      >
        {items.map((item) => (
          <StoryReelCard
            key={item.id}
            item={item}
            label={formatLabel(item.scheduled_date)}
            onOpen={() => router.push(`/editor/${item.id}`)}
          />
        ))}
      </div>
    </section>
  );
}

interface StoryReelCardProps {
  item: CalendarItem;
  label: string;
  onOpen: () => void;
}

function StoryReelCard({ item, label, onOpen }: StoryReelCardProps) {
  const width = 110;
  const height = (1920 / 1080) * width;
  const scale = width / 1080;
  const seriesName =
    getSeriesBySlug(item.series_slug)?.name ?? item.series_slug;
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        flex: "0 0 auto",
        scrollSnapAlign: "start",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        alignItems: "center",
      }}
      title={`${seriesName} — ${item.scheduled_date}`}
    >
      <div
        style={{
          width: width + 6,
          height: height + 6,
          padding: 3,
          borderRadius: 14,
          background:
            "linear-gradient(135deg, var(--pink), var(--gold), var(--hot-pink))",
          position: "relative",
        }}
      >
        <div
          style={{
            width,
            height,
            borderRadius: 11,
            overflow: "hidden",
            background: "var(--cream)",
            position: "relative",
          }}
        >
          <div style={{ transform: "translateZ(0)" }}>
            <TemplateFrame
              format="story"
              scale={scale}
              style={{ boxShadow: "none", borderRadius: 0 }}
            >
              {renderTemplate(item.template_slug, item.content_data)}
            </TemplateFrame>
          </div>
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              fontFamily: "'Syne', sans-serif",
              fontSize: 8,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              padding: "2px 5px",
              borderRadius: 3,
              background: FORMAT_BADGES[item.format].bg,
              color: FORMAT_BADGES[item.format].fg,
            }}
          >
            {FORMAT_BADGES[item.format].label}
          </span>
        </div>
      </div>
      <span
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.4,
          color: "var(--mauve)",
        }}
      >
        {label}
      </span>
    </button>
  );
}

function EmptyGridState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      style={{
        padding: "48px 32px",
        background: "var(--blush)",
        border: "1px dashed rgba(75,21,40,0.25)",
        borderRadius: 14,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 32,
          color: "var(--wine)",
          fontStyle: "italic",
          marginBottom: 8,
        }}
      >
        No grid posts yet.
      </div>
      <p
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 22,
          color: "var(--pink)",
          marginBottom: 18,
        }}
      >
        the grid is the face of your feed — start with one square.
      </p>
      <button
        type="button"
        onClick={onAdd}
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 12,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 2,
          padding: "12px 22px",
          background: "var(--wine)",
          color: "var(--cream)",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          boxShadow: "3px 3px 0 var(--gold)",
        }}
      >
        + Add Post
      </button>
    </div>
  );
}
