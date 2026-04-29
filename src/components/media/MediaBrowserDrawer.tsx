"use client";

/**
 * Compact Media Browser drawer used inside the template editor.
 *
 * Presents a horizontally-collapsing strip at the bottom of the editor with
 * a search bar, collection tabs, and a dense thumbnail grid. Each tile is
 * draggable into the form fields (`MediaDropField` inputs) or onto the live
 * preview's `MediaDropZone` regions.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { MediaThumb } from "./MediaThumb";
import { setMediaDrag } from "./drag";
import {
  getAllMediaItems,
  getCollections,
} from "@/lib/db/media-store";
import type { MediaItem, MediaItemType } from "@/lib/db/media-types";

type Filter = MediaItemType | "all";

interface Props {
  open: boolean;
  height?: number;
  onClose: () => void;
  onResize?: (height: number) => void;
}

const MIN_HEIGHT = 220;
const MAX_HEIGHT = 600;

export function MediaBrowserDrawer({
  open,
  height = 320,
  onClose,
  onResize,
}: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [collections, setCollections] = useState<string[]>(() => getCollections());
  const [collection, setCollection] = useState<string>("__ALL__");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const dragHandle = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const all = await getAllMediaItems();
      setItems(all);
    } catch {
      /* ignore — IndexedDB unavailable in tests */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      await refresh();
      setHydrated(true);
    })();
    function bump() {
      setCollections(getCollections());
      void refresh();
    }
    window.addEventListener("marigold:media-changed", bump);
    return () => window.removeEventListener("marigold:media-changed", bump);
  }, [open, refresh]);

  const filtered = useMemo(() => {
    let list = items;
    if (collection !== "__ALL__")
      list = list.filter((i) => i.collection === collection);
    if (filter !== "all") list = list.filter((i) => i.type === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.fileName.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q)) ||
          (i.textContent?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [items, collection, filter, search]);

  // Drag-resize on the top edge.
  useEffect(() => {
    if (!open) return;
    const handle = dragHandle.current;
    if (!handle || !onResize) return;
    let dragging = false;
    let startY = 0;
    let startH = height;
    function onDown(e: MouseEvent) {
      dragging = true;
      startY = e.clientY;
      startH = height;
      document.body.style.cursor = "ns-resize";
    }
    function onMove(e: MouseEvent) {
      if (!dragging || !onResize) return;
      const delta = startY - e.clientY;
      const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startH + delta));
      onResize(next);
    }
    function onUp() {
      dragging = false;
      document.body.style.cursor = "";
    }
    handle.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      handle.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [open, height, onResize]);

  if (!open) return null;

  return (
    <div
      style={{
        ...drawerStyle,
        height,
      }}
      role="region"
      aria-label="Media browser"
    >
      <div
        ref={dragHandle}
        style={dragHandleStyle}
        title="Drag to resize"
      />
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong style={titleStyle}>Media</strong>
          <span style={countLabel}>{filtered.length} items</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            style={searchInput}
          />
          <select
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            style={selectStyle}
          >
            <option value="__ALL__">All collections</option>
            {collections.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            style={selectStyle}
          >
            <option value="all">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="text">Text</option>
          </select>
        </div>
        <button type="button" onClick={onClose} style={closeBtn} aria-label="Close drawer">
          ×
        </button>
      </header>

      <div style={gridWrap}>
        {!hydrated ? (
          <div style={hint}>loading media…</div>
        ) : filtered.length === 0 ? (
          <div style={hint}>
            {items.length === 0
              ? "Library is empty — head to the Media page to add files."
              : "Nothing matches that filter."}
          </div>
        ) : (
          <div style={grid}>
            {filtered.map((item) => (
              <button
                key={item.id}
                draggable
                onDragStart={(e) => setMediaDrag(e, item)}
                style={tileStyle}
                title={`${item.fileName}${item.tags.length ? " · " + item.tags.join(", ") : ""}`}
              >
                <div style={tileImageWrap}>
                  <MediaThumb item={item} rounded={4} />
                </div>
                <div style={tileBadge}>
                  {item.type === "image"
                    ? "📷"
                    : item.type === "video"
                      ? "▶"
                      : "T"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const drawerStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  background: "var(--cream)",
  borderTop: "1px solid rgba(75,21,40,0.12)",
  boxShadow: "0 -8px 24px rgba(75,21,40,0.08)",
  zIndex: 60,
  display: "flex",
  flexDirection: "column",
};

const dragHandleStyle: CSSProperties = {
  height: 6,
  cursor: "ns-resize",
  background: "transparent",
};

const headerStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  padding: "8px 18px",
  borderBottom: "1px solid rgba(75,21,40,0.06)",
  flexWrap: "wrap",
};

const titleStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--wine)",
};

const countLabel: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  color: "var(--mauve)",
};

const searchInput: CSSProperties = {
  flex: 1,
  minWidth: 200,
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  padding: "8px 10px",
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.18)",
  borderRadius: 6,
  color: "var(--wine)",
};

const selectStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  padding: "8px 10px",
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.18)",
  borderRadius: 6,
  color: "var(--wine)",
};

const closeBtn: CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 22,
  color: "var(--mauve)",
  cursor: "pointer",
  lineHeight: 1,
  padding: "0 6px",
};

const gridWrap: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: 14,
};

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
  gap: 10,
};

const tileStyle: CSSProperties = {
  position: "relative",
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.08)",
  borderRadius: 6,
  padding: 0,
  cursor: "grab",
};

const tileImageWrap: CSSProperties = {
  width: "100%",
  aspectRatio: "1 / 1",
  overflow: "hidden",
  borderRadius: 6,
};

const tileBadge: CSSProperties = {
  position: "absolute",
  top: 4,
  left: 4,
  background: "rgba(75,21,40,0.65)",
  color: "var(--cream)",
  padding: "1px 5px",
  borderRadius: 4,
  fontSize: 9,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 700,
};

const hint: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
  padding: 24,
  textAlign: "center",
};
