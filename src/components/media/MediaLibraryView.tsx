"use client";

/**
 * Media Library — content warehouse.
 *
 * Left rail: collections, type/source filters, tag pills.
 * Top bar: search, sort, view toggle, "New text", "Upload".
 * Grid:   responsive thumbnail tiles with hover actions and multi-select.
 * Detail: slide-in right panel with editable metadata + usage.
 *
 * Storage:
 *   - Files are read in via the File API and persisted to IndexedDB
 *     (`marigold-media`) along with auto-generated 300px thumbnails.
 *   - Collection list is in localStorage so the sidebar can render before
 *     IndexedDB hydrates.
 */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { useToast } from "@/components/app/ToastProvider";
import { MediaThumb } from "./MediaThumb";
import { setMediaDrag } from "./drag";
import {
  addCollection,
  addMediaItem,
  addTagsToItems,
  deleteCollection,
  deleteMediaItem,
  deleteMediaItems,
  generateImageThumbnail,
  generateTextThumbnail,
  generateVideoThumbnail,
  getAllMediaItems,
  getCollections,
  moveItemsToCollection,
  syncMediaItems,
  updateMediaItem,
  validateFile,
} from "@/lib/db/media-store";
import type {
  MediaItem,
  MediaItemType,
  MediaSource,
} from "@/lib/db/media-types";

type SortKey = "newest" | "oldest" | "name" | "most-used" | "unused";
type ViewMode = "grid" | "list";
type TypeFilter = MediaItemType | "all";
type SourceFilter = MediaSource | "all";

const ALL_COLLECTIONS = "__ALL__";

interface UploadProgressItem {
  id: string;
  fileName: string;
  progress: number; // 0..1
  error?: string;
}

export function MediaLibraryView() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [collections, setCollections] = useState<string[]>(() => getCollections());
  const [activeCollection, setActiveCollection] = useState<string>(ALL_COLLECTIONS);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<ViewMode>("grid");
  const [selected, setSelected] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadProgressItem[]>([]);
  const [postUploadIds, setPostUploadIds] = useState<string[] | null>(null);
  const [newCollectionDraft, setNewCollectionDraft] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [newTextOpen, setNewTextOpen] = useState(false);
  const [pageDragOver, setPageDragOver] = useState(false);

  // Initial hydration + change-event subscription
  const refresh = useCallback(async () => {
    try {
      const all = await getAllMediaItems();
      setItems(all);
    } catch (err) {
      console.error("[media] refresh failed", err);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refresh();
      setHydrated(true);
      // Pull metadata from Supabase so uploads from other browsers show up.
      await syncMediaItems();
      await refresh();
    })();
    function bump() {
      setCollections(getCollections());
      void refresh();
    }
    window.addEventListener("marigold:media-changed", bump);
    return () => window.removeEventListener("marigold:media-changed", bump);
  }, [refresh]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) for (const tag of item.tags) set.add(tag);
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let list = items.slice();
    if (activeCollection !== ALL_COLLECTIONS) {
      list = list.filter((i) => i.collection === activeCollection);
    }
    if (typeFilter !== "all") list = list.filter((i) => i.type === typeFilter);
    if (sourceFilter !== "all")
      list = list.filter((i) => i.source === sourceFilter);
    if (activeTags.length > 0) {
      list = list.filter((i) =>
        activeTags.every((tag) => i.tags.includes(tag)),
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((i) => {
        return (
          i.fileName.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q)) ||
          i.notes.toLowerCase().includes(q) ||
          (i.vendorName?.toLowerCase().includes(q) ?? false) ||
          (i.textContent?.toLowerCase().includes(q) ?? false)
        );
      });
    }
    switch (sort) {
      case "oldest":
        list.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
        break;
      case "name":
        list.sort((a, b) => a.fileName.localeCompare(b.fileName));
        break;
      case "most-used":
        list.sort((a, b) => b.usedIn.length - a.usedIn.length);
        break;
      case "unused":
        list.sort((a, b) => a.usedIn.length - b.usedIn.length);
        break;
      case "newest":
      default:
        list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        break;
    }
    return list;
  }, [items, activeCollection, typeFilter, sourceFilter, activeTags, search, sort]);

  const detailItem = useMemo(
    () => (detailId ? items.find((i) => i.id === detailId) ?? null : null),
    [detailId, items],
  );

  // ---------- selection ----------
  function toggleSelect(id: string, withShift: boolean) {
    if (withShift && lastSelectedId) {
      const ids = filtered.map((i) => i.id);
      const a = ids.indexOf(lastSelectedId);
      const b = ids.indexOf(id);
      if (a !== -1 && b !== -1) {
        const [from, to] = a < b ? [a, b] : [b, a];
        const range = ids.slice(from, to + 1);
        setSelected((prev) => Array.from(new Set([...prev, ...range])));
        return;
      }
    }
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
    setLastSelectedId(id);
  }

  function clearSelection() {
    setSelected([]);
    setLastSelectedId(null);
  }

  // ---------- upload ----------
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;

      const queue: UploadProgressItem[] = list.map((f) => ({
        id: `${f.name}-${f.size}-${f.lastModified}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        fileName: f.name,
        progress: 0,
      }));
      setUploads(queue);

      const createdIds: string[] = [];
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        const queueId = queue[i].id;
        const validation = validateFile(file);
        if (!validation.ok || !validation.type) {
          setUploads((u) =>
            u.map((q) =>
              q.id === queueId ? { ...q, error: validation.reason } : q,
            ),
          );
          toast.error(`${file.name}: ${validation.reason}`);
          continue;
        }
        try {
          setUploads((u) =>
            u.map((q) => (q.id === queueId ? { ...q, progress: 0.2 } : q)),
          );
          const type = validation.type;
          let thumbBlob: Blob;
          let width: number | undefined;
          let height: number | undefined;
          let duration: number | undefined;
          if (type === "image") {
            const t = await generateImageThumbnail(file);
            thumbBlob = t.blob;
            width = t.width;
            height = t.height;
          } else {
            const t = await generateVideoThumbnail(file);
            thumbBlob = t.blob;
            width = t.width;
            height = t.height;
            duration = t.duration;
          }
          setUploads((u) =>
            u.map((q) => (q.id === queueId ? { ...q, progress: 0.7 } : q)),
          );
          const created = await addMediaItem({
            type,
            fileName: file.name,
            mimeType: file.type,
            fileBlob: file,
            thumbnailBlob: thumbBlob,
            width,
            height,
            duration,
            fileSize: file.size,
            tags: [],
            source: "upload",
          });
          createdIds.push(created.id);
          setUploads((u) =>
            u.map((q) => (q.id === queueId ? { ...q, progress: 1 } : q)),
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          setUploads((u) =>
            u.map((q) => (q.id === queueId ? { ...q, error: msg } : q)),
          );
          toast.error(`Upload failed: ${file.name} — ${msg}`);
        }
      }
      // Brief delay so users can see the progress bars finish.
      window.setTimeout(() => setUploads([]), 700);
      if (createdIds.length > 0) {
        setPostUploadIds(createdIds);
      }
      await refresh();
    },
    [refresh, toast],
  );

  function onUploadButtonClick() {
    fileInputRef.current?.click();
  }

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    void handleFiles(files);
    e.target.value = "";
  }

  function onPageDragOver(e: DragEvent<HTMLDivElement>) {
    if (Array.from(e.dataTransfer.types).includes("Files")) {
      e.preventDefault();
      setPageDragOver(true);
    }
  }
  function onPageDragLeave(e: DragEvent<HTMLDivElement>) {
    if (e.currentTarget === e.target) setPageDragOver(false);
  }
  function onPageDrop(e: DragEvent<HTMLDivElement>) {
    if (Array.from(e.dataTransfer.types).includes("Files")) {
      e.preventDefault();
      setPageDragOver(false);
      void handleFiles(e.dataTransfer.files);
    }
  }

  // ---------- collections ----------
  function handleCreateCollection() {
    const name = newCollectionDraft.trim();
    if (!name) {
      setCreatingCollection(false);
      return;
    }
    setCollections(addCollection(name));
    setNewCollectionDraft("");
    setCreatingCollection(false);
    toast.success(`Collection “${name}” created.`);
  }

  function handleDeleteCollection(name: string) {
    if (
      !window.confirm(
        `Delete collection “${name}”? Media items in it stay — they just lose this folder tag.`,
      )
    )
      return;
    setCollections(deleteCollection(name));
    if (activeCollection === name) setActiveCollection(ALL_COLLECTIONS);
  }

  function onCollectionDrop(e: DragEvent<HTMLDivElement>, name: string) {
    e.preventDefault();
    const ids = readDraggedItemIds(e) ?? selected;
    if (ids.length === 0) return;
    void (async () => {
      await moveItemsToCollection(ids, name);
      toast.success(
        `Moved ${ids.length} item${ids.length === 1 ? "" : "s"} to “${name}”.`,
      );
      await refresh();
      clearSelection();
    })();
  }

  // ---------- bulk actions ----------
  async function handleBulkDelete() {
    if (selected.length === 0) return;
    if (
      !window.confirm(
        `Delete ${selected.length} item${selected.length === 1 ? "" : "s"}? This can't be undone.`,
      )
    )
      return;
    await deleteMediaItems(selected);
    toast.success(`Deleted ${selected.length} items.`);
    await refresh();
    clearSelection();
  }

  async function handleBulkMove(name: string) {
    if (selected.length === 0) return;
    await moveItemsToCollection(selected, name);
    toast.success(`Moved to ${name}.`);
    await refresh();
    clearSelection();
  }

  async function handleBulkTag(tag: string) {
    if (selected.length === 0 || !tag.trim()) return;
    await addTagsToItems(selected, [tag.trim()]);
    toast.success(`Added tag “${tag.trim()}” to ${selected.length} items.`);
    await refresh();
  }

  function handleBulkDownload() {
    if (selected.length === 0) return;
    selected.forEach((id, idx) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      window.setTimeout(() => downloadBlob(item.fileBlob, item.fileName), idx * 80);
    });
  }

  // ---------- new text ----------
  async function handleCreateText(input: {
    title: string;
    content: string;
    tags: string[];
    collection: string;
  }) {
    const name = input.title.trim() || `Text — ${new Date().toLocaleString()}`;
    const thumbnailBlob = generateTextThumbnail(input.content, name);
    await addMediaItem({
      type: "text",
      fileName: name,
      mimeType: "text/plain",
      fileBlob: new Blob([input.content], { type: "text/plain" }),
      thumbnailBlob,
      fileSize: new Blob([input.content]).size,
      textContent: input.content,
      tags: input.tags,
      collection: input.collection || "Text & Quotes",
      source: "upload",
    });
    setNewTextOpen(false);
    toast.success("Text saved to library.");
    await refresh();
  }

  // ---------- ESC closes panels ----------
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (newTextOpen) {
        setNewTextOpen(false);
      } else if (postUploadIds) {
        setPostUploadIds(null);
      } else if (detailId) {
        setDetailId(null);
      } else if (selected.length > 0) {
        clearSelection();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailId, newTextOpen, postUploadIds, selected.length]);

  // ---------- render ----------
  return (
    <div
      className="marigold-page-pad"
      style={pageStyle}
      onDragOver={onPageDragOver}
      onDragLeave={onPageDragLeave}
      onDrop={onPageDrop}
    >
      <header style={heroStyle}>
        <div style={eyebrowStyle}>The Marigold Content Studio</div>
        <h1 style={titleStyle}>
          Media <i style={{ color: "var(--hot-pink)" }}>Library</i>
        </h1>
        <p style={leadStyle}>
          The content warehouse — every photo, video, quote, and snippet you'll
          drop into a template. Drag files anywhere onto this page to upload.
        </p>
      </header>

      <div style={layoutGrid}>
        <aside style={sidebarStyle}>
          <SidebarSectionTitle>Collections</SidebarSectionTitle>
          <SidebarItem
            active={activeCollection === ALL_COLLECTIONS}
            onClick={() => setActiveCollection(ALL_COLLECTIONS)}
            label="All Media"
            count={items.length}
          />
          {collections.map((name) => {
            const count = items.filter((i) => i.collection === name).length;
            return (
              <SidebarItem
                key={name}
                active={activeCollection === name}
                onClick={() => setActiveCollection(name)}
                label={name}
                count={count}
                onDelete={() => handleDeleteCollection(name)}
                onDrop={(e) => onCollectionDrop(e, name)}
              />
            );
          })}
          {creatingCollection ? (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input
                autoFocus
                value={newCollectionDraft}
                onChange={(e) => setNewCollectionDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateCollection();
                  if (e.key === "Escape") {
                    setCreatingCollection(false);
                    setNewCollectionDraft("");
                  }
                }}
                placeholder="Name…"
                style={{ ...sidebarInput, flex: 1 }}
              />
              <button
                type="button"
                onClick={handleCreateCollection}
                style={tinyAddBtn}
              >
                ✓
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreatingCollection(true)}
              style={addCollectionBtn}
            >
              + New collection
            </button>
          )}

          <div style={sidebarDivider} />
          <SidebarSectionTitle>Type</SidebarSectionTitle>
          {[
            { value: "all", label: "All types" },
            { value: "image", label: "Images" },
            { value: "video", label: "Videos" },
            { value: "text", label: "Text" },
          ].map((opt) => (
            <SidebarChip
              key={opt.value}
              active={typeFilter === opt.value}
              onClick={() => setTypeFilter(opt.value as TypeFilter)}
            >
              {opt.label}
            </SidebarChip>
          ))}

          <div style={sidebarDivider} />
          <SidebarSectionTitle>Source</SidebarSectionTitle>
          {[
            { value: "all", label: "All sources" },
            { value: "upload", label: "Upload" },
            { value: "vendor-submission", label: "Vendor submission" },
            { value: "generated", label: "Generated" },
          ].map((opt) => (
            <SidebarChip
              key={opt.value}
              active={sourceFilter === opt.value}
              onClick={() => setSourceFilter(opt.value as SourceFilter)}
            >
              {opt.label}
            </SidebarChip>
          ))}

          {allTags.length > 0 && (
            <>
              <div style={sidebarDivider} />
              <SidebarSectionTitle>Tags</SidebarSectionTitle>
              <div style={tagWrap}>
                {allTags.map((tag) => {
                  const active = activeTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setActiveTags((prev) =>
                          active
                            ? prev.filter((t) => t !== tag)
                            : [...prev, tag],
                        )
                      }
                      style={{
                        ...tagPill,
                        background: active ? "var(--wine)" : "transparent",
                        color: active ? "var(--cream)" : "var(--mauve)",
                        borderColor: active
                          ? "var(--wine)"
                          : "rgba(75,21,40,0.2)",
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
                {activeTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTags([])}
                    style={{ ...tagPill, color: "var(--deep-pink)" }}
                  >
                    clear
                  </button>
                )}
              </div>
            </>
          )}
        </aside>

        <section style={mainStyle}>
          <div style={topBarStyle}>
            <input
              type="search"
              placeholder="Search file names, tags, notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={searchStyle}
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              style={selectStyle}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name A–Z</option>
              <option value="most-used">Most used</option>
              <option value="unused">Unused</option>
            </select>
            <div style={viewToggle}>
              <button
                type="button"
                onClick={() => setView("grid")}
                style={{
                  ...viewToggleBtn,
                  background:
                    view === "grid" ? "var(--wine)" : "transparent",
                  color: view === "grid" ? "var(--cream)" : "var(--wine)",
                }}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                style={{
                  ...viewToggleBtn,
                  background:
                    view === "list" ? "var(--wine)" : "transparent",
                  color: view === "list" ? "var(--cream)" : "var(--wine)",
                }}
              >
                List
              </button>
            </div>
            <button
              type="button"
              onClick={() => setNewTextOpen(true)}
              style={ghostButton}
            >
              + New text
            </button>
            <button
              type="button"
              onClick={onUploadButtonClick}
              style={primaryButton}
            >
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/quicktime"
              style={{ display: "none" }}
              onChange={onFileInputChange}
            />
          </div>

          {selected.length > 0 && (
            <BulkActionsBar
              count={selected.length}
              collections={collections}
              onClear={clearSelection}
              onDelete={handleBulkDelete}
              onDownload={handleBulkDownload}
              onMove={handleBulkMove}
              onTag={handleBulkTag}
            />
          )}

          {uploads.length > 0 && <UploadsBar items={uploads} />}

          {!hydrated ? (
            <div style={loadingHint}>loading library…</div>
          ) : items.length === 0 ? (
            <EmptyLibrary onUpload={onUploadButtonClick} onNewText={() => setNewTextOpen(true)} />
          ) : filtered.length === 0 ? (
            <NoMatches
              onClear={() => {
                setSearch("");
                setActiveCollection(ALL_COLLECTIONS);
                setTypeFilter("all");
                setSourceFilter("all");
                setActiveTags([]);
              }}
            />
          ) : view === "grid" ? (
            <MediaGrid
              items={filtered}
              selected={selected}
              onToggleSelect={toggleSelect}
              onOpenDetail={(id) => setDetailId(id)}
              onCopyText={(item) => {
                if (item.textContent) {
                  void navigator.clipboard.writeText(item.textContent);
                  toast.success("Text copied to clipboard.");
                }
              }}
              onDelete={async (id) => {
                if (!window.confirm("Delete this item?")) return;
                await deleteMediaItem(id);
                toast.success("Deleted.");
                await refresh();
              }}
            />
          ) : (
            <MediaListView
              items={filtered}
              selected={selected}
              onToggleSelect={toggleSelect}
              onOpenDetail={(id) => setDetailId(id)}
            />
          )}
        </section>
      </div>

      {detailItem && (
        <MediaDetailPanel
          item={detailItem}
          collections={collections}
          onClose={() => setDetailId(null)}
          onSave={async (patch) => {
            await updateMediaItem(detailItem.id, patch);
            toast.success("Saved.");
            await refresh();
          }}
          onDelete={async () => {
            if (!window.confirm("Delete this item?")) return;
            await deleteMediaItem(detailItem.id);
            toast.success("Deleted.");
            setDetailId(null);
            await refresh();
          }}
        />
      )}

      {newTextOpen && (
        <NewTextDialog
          collections={collections}
          onClose={() => setNewTextOpen(false)}
          onSubmit={handleCreateText}
        />
      )}

      {postUploadIds && (
        <QuickTagDialog
          ids={postUploadIds}
          collections={collections}
          onClose={() => setPostUploadIds(null)}
          onApply={async (collection, tags) => {
            if (collection) await moveItemsToCollection(postUploadIds, collection);
            if (tags.length > 0) await addTagsToItems(postUploadIds, tags);
            toast.success(
              `Tagged ${postUploadIds.length} upload${postUploadIds.length === 1 ? "" : "s"}.`,
            );
            setPostUploadIds(null);
            await refresh();
          }}
        />
      )}

      {pageDragOver && <DragOverlay />}
    </div>
  );
}

// ===========================================================================
// Sub-components
// ===========================================================================

function SidebarSectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={sidebarSection}>{children}</div>;
}

function SidebarItem({
  label,
  count,
  active,
  onClick,
  onDelete,
  onDrop,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={
        onDrop
          ? (e) => {
              e.preventDefault();
              setOver(true);
            }
          : undefined
      }
      onDragLeave={() => setOver(false)}
      onDrop={
        onDrop
          ? (e) => {
              setOver(false);
              onDrop(e);
            }
          : undefined
      }
      style={{
        ...sidebarRow,
        background: over
          ? "rgba(212,168,83,0.25)"
          : active
            ? "rgba(75,21,40,0.07)"
            : "transparent",
        boxShadow: over ? "inset 0 0 0 1px var(--gold)" : "none",
      }}
    >
      <button
        type="button"
        onClick={onClick}
        style={{
          ...sidebarBtn,
          color: active ? "var(--wine)" : "var(--mauve)",
          fontWeight: active ? 700 : 500,
        }}
      >
        <span>{label}</span>
        {typeof count === "number" && (
          <span style={countPill}>{count}</span>
        )}
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title={`Delete collection “${label}”`}
          style={sidebarDeleteBtn}
        >
          ×
        </button>
      )}
    </div>
  );
}

function SidebarChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...sidebarChipStyle,
        background: active ? "var(--wine)" : "transparent",
        color: active ? "var(--cream)" : "var(--mauve)",
      }}
    >
      {children}
    </button>
  );
}

function MediaGrid({
  items,
  selected,
  onToggleSelect,
  onOpenDetail,
  onCopyText,
  onDelete,
}: {
  items: MediaItem[];
  selected: string[];
  onToggleSelect: (id: string, withShift: boolean) => void;
  onOpenDetail: (id: string) => void;
  onCopyText: (item: MediaItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div style={gridStyle}>
      {items.map((item) => (
        <MediaTile
          key={item.id}
          item={item}
          selected={selected.includes(item.id)}
          onToggleSelect={onToggleSelect}
          onOpenDetail={onOpenDetail}
          onCopyText={onCopyText}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function MediaTile({
  item,
  selected,
  onToggleSelect,
  onOpenDetail,
  onCopyText,
  onDelete,
}: {
  item: MediaItem;
  selected: boolean;
  onToggleSelect: (id: string, withShift: boolean) => void;
  onOpenDetail: (id: string) => void;
  onCopyText: (item: MediaItem) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const used = item.usedIn.length > 0;
  return (
    <div
      draggable
      onDragStart={(e) => setMediaDrag(e, item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...tileStyle,
        outline: selected
          ? "2px solid var(--pink)"
          : "1px solid rgba(75,21,40,0.08)",
      }}
    >
      <button
        type="button"
        onClick={() => onOpenDetail(item.id)}
        style={tileImageBtn}
      >
        <MediaThumb item={item} rounded={6} />
      </button>

      <div style={tileTypeIcon} title={item.type}>
        {item.type === "image" && "📷"}
        {item.type === "video" && "▶"}
        {item.type === "text" && "T"}
      </div>

      {used && (
        <div
          style={usedDot}
          title={`Used in ${item.usedIn.length} calendar item${item.usedIn.length === 1 ? "" : "s"}`}
        />
      )}

      {(hovered || selected) && (
        <label
          style={selectCheckbox}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              const evt = e.nativeEvent as MouseEvent;
              onToggleSelect(item.id, evt.shiftKey);
            }}
            onClick={(e) => {
              const native = e.nativeEvent as MouseEvent;
              if (native.shiftKey) {
                e.preventDefault();
                onToggleSelect(item.id, true);
              }
            }}
          />
        </label>
      )}

      {hovered && (
        <div style={hoverOverlay}>
          <button
            type="button"
            onClick={() => onOpenDetail(item.id)}
            style={hoverBtn}
            title="Preview"
          >
            👁
          </button>
          <button
            type="button"
            onClick={() => onOpenDetail(item.id)}
            style={hoverBtn}
            title="Edit details"
          >
            ✎
          </button>
          {item.type === "text" && (
            <button
              type="button"
              onClick={() => onCopyText(item)}
              style={hoverBtn}
              title="Copy text"
            >
              ⧉
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            style={{ ...hoverBtn, color: "var(--deep-pink)" }}
            title="Delete"
          >
            🗑
          </button>
        </div>
      )}

      <div style={tileLabel} title={item.fileName}>
        {item.fileName}
      </div>
    </div>
  );
}

function MediaListView({
  items,
  selected,
  onToggleSelect,
  onOpenDetail,
}: {
  items: MediaItem[];
  selected: string[];
  onToggleSelect: (id: string, withShift: boolean) => void;
  onOpenDetail: (id: string) => void;
}) {
  return (
    <table style={listTable}>
      <thead>
        <tr style={listHeaderRow}>
          <th style={listTh}></th>
          <th style={listTh}>Name</th>
          <th style={listTh}>Type</th>
          <th style={listTh}>Collection</th>
          <th style={listTh}>Tags</th>
          <th style={listTh}>Size</th>
          <th style={listTh}>Used</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr
            key={item.id}
            draggable
            onDragStart={(e) => setMediaDrag(e, item)}
            style={listRow}
          >
            <td style={listTd}>
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={(e) => {
                  const evt = e.nativeEvent as MouseEvent;
                  onToggleSelect(item.id, evt.shiftKey);
                }}
              />
            </td>
            <td style={listTd}>
              <button
                type="button"
                onClick={() => onOpenDetail(item.id)}
                style={listNameBtn}
              >
                <div style={listThumbWrap}>
                  <MediaThumb item={item} rounded={4} />
                </div>
                <span>{item.fileName}</span>
              </button>
            </td>
            <td style={listTd}>{item.type}</td>
            <td style={listTd}>{item.collection}</td>
            <td style={listTd}>{item.tags.join(", ")}</td>
            <td style={listTd}>{formatBytes(item.fileSize)}</td>
            <td style={listTd}>{item.usedIn.length}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BulkActionsBar({
  count,
  collections,
  onClear,
  onDelete,
  onDownload,
  onMove,
  onTag,
}: {
  count: number;
  collections: string[];
  onClear: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onMove: (collection: string) => void;
  onTag: (tag: string) => void;
}) {
  const [tagDraft, setTagDraft] = useState("");
  return (
    <div style={bulkBar}>
      <div style={{ fontWeight: 700, color: "var(--cream)" }}>
        {count} selected
      </div>
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onMove(e.target.value);
          e.target.value = "";
        }}
        style={{ ...selectStyle, color: "var(--wine)" }}
      >
        <option value="">Move to collection…</option>
        {collections.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={tagDraft}
        onChange={(e) => setTagDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onTag(tagDraft);
            setTagDraft("");
          }
        }}
        placeholder="Add tag, ↵"
        style={{ ...searchStyle, maxWidth: 160 }}
      />
      <button type="button" onClick={onDownload} style={ghostButtonInverse}>
        Download
      </button>
      <button
        type="button"
        onClick={onDelete}
        style={{
          ...ghostButtonInverse,
          color: "var(--cream)",
          borderColor: "var(--cream)",
        }}
      >
        Delete
      </button>
      <button type="button" onClick={onClear} style={ghostButtonInverse}>
        Clear
      </button>
    </div>
  );
}

function UploadsBar({ items }: { items: UploadProgressItem[] }) {
  return (
    <div style={uploadBar}>
      {items.map((u) => (
        <div key={u.id} style={uploadRow}>
          <span style={{ flex: 1, fontFamily: fontBody, fontSize: 12 }}>
            {u.fileName}
          </span>
          {u.error ? (
            <span style={{ color: "var(--deep-pink)", fontSize: 11 }}>
              {u.error}
            </span>
          ) : (
            <div style={uploadProgressTrack}>
              <div
                style={{
                  ...uploadProgressFill,
                  width: `${Math.round(u.progress * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyLibrary({
  onUpload,
  onNewText,
}: {
  onUpload: () => void;
  onNewText: () => void;
}) {
  return (
    <div style={emptyState}>
      <div style={emptyTitle}>The library is empty.</div>
      <p style={emptyHint}>
        Drop files anywhere on this page to upload, or jot down a quote /
        confession with “New text”.
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" onClick={onUpload} style={primaryButton}>
          Upload files
        </button>
        <button type="button" onClick={onNewText} style={ghostButton}>
          + New text
        </button>
      </div>
    </div>
  );
}

function NoMatches({ onClear }: { onClear: () => void }) {
  return (
    <div style={emptyState}>
      <div style={emptyTitle}>Nothing matches those filters.</div>
      <button type="button" onClick={onClear} style={ghostButton}>
        Clear filters
      </button>
    </div>
  );
}

function MediaDetailPanel({
  item,
  collections,
  onClose,
  onSave,
  onDelete,
}: {
  item: MediaItem;
  collections: string[];
  onClose: () => void;
  onSave: (patch: Parameters<typeof updateMediaItem>[1]) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    fileName: item.fileName,
    tags: item.tags,
    collection: item.collection,
    source: item.source,
    vendorName: item.vendorName ?? "",
    vendorCategory: item.vendorCategory ?? "",
    notes: item.notes,
    textContent: item.textContent ?? "",
  });
  const [tagDraft, setTagDraft] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    setDraft({
      fileName: item.fileName,
      tags: item.tags,
      collection: item.collection,
      source: item.source,
      vendorName: item.vendorName ?? "",
      vendorCategory: item.vendorCategory ?? "",
      notes: item.notes,
      textContent: item.textContent ?? "",
    });
  }, [item.id, item.updatedAt, item]);

  useEffect(() => {
    if (item.type === "text") {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(item.fileBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [item.id, item.fileBlob, item.type]);

  function handleAddTag() {
    const t = tagDraft.trim();
    if (!t) return;
    if (draft.tags.includes(t)) {
      setTagDraft("");
      return;
    }
    setDraft((d) => ({ ...d, tags: [...d.tags, t] }));
    setTagDraft("");
  }

  function handleRemoveTag(tag: string) {
    setDraft((d) => ({ ...d, tags: d.tags.filter((t) => t !== tag) }));
  }

  async function handleSave() {
    await onSave({
      fileName: draft.fileName,
      tags: draft.tags,
      collection: draft.collection,
      source: draft.source,
      vendorName: draft.vendorName || undefined,
      vendorCategory: draft.vendorCategory || undefined,
      notes: draft.notes,
      textContent:
        item.type === "text" ? draft.textContent : item.textContent,
    });
  }

  return (
    <div style={detailBackdrop} onClick={onClose}>
      <aside
        style={detailPanel}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={detailHeader}>
          <div>
            <div style={detailEyebrow}>Detail</div>
            <h2 style={detailTitle}>{item.fileName}</h2>
          </div>
          <button type="button" onClick={onClose} style={detailCloseBtn}>
            ×
          </button>
        </header>

        <div style={detailBody}>
          <div style={detailPreview}>
            {item.type === "image" && previewUrl && (
              <img
                src={previewUrl}
                alt={item.fileName}
                style={{
                  maxWidth: "100%",
                  maxHeight: 280,
                  display: "block",
                  margin: "0 auto",
                  borderRadius: 8,
                }}
              />
            )}
            {item.type === "video" && previewUrl && (
              <video
                src={previewUrl}
                controls
                style={{
                  width: "100%",
                  maxHeight: 280,
                  display: "block",
                  borderRadius: 8,
                }}
              />
            )}
            {item.type === "text" && (
              <div style={textPreviewCard}>
                {(draft.textContent || item.textContent) ?? ""}
              </div>
            )}
          </div>

          <DetailField label="File name">
            <input
              type="text"
              value={draft.fileName}
              onChange={(e) =>
                setDraft((d) => ({ ...d, fileName: e.target.value }))
              }
              style={inputStyle}
            />
          </DetailField>

          {item.type === "text" && (
            <DetailField label="Text content">
              <textarea
                rows={6}
                value={draft.textContent}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, textContent: e.target.value }))
                }
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </DetailField>
          )}

          <DetailField label="Tags">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {draft.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  style={hashtagPill}
                >
                  {tag}
                  <span style={{ opacity: 0.6, marginLeft: 6 }}>×</span>
                </button>
              ))}
            </div>
            <input
              type="text"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add tag, press ↵"
              style={inputStyle}
            />
          </DetailField>

          <DetailField label="Collection">
            <select
              value={draft.collection}
              onChange={(e) =>
                setDraft((d) => ({ ...d, collection: e.target.value }))
              }
              style={inputStyle}
            >
              {collections.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </DetailField>

          <DetailField label="Source">
            <select
              value={draft.source}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  source: e.target.value as MediaSource,
                }))
              }
              style={inputStyle}
            >
              <option value="upload">Upload</option>
              <option value="vendor-submission">Vendor submission</option>
              <option value="generated">Generated</option>
            </select>
          </DetailField>

          {(draft.source === "vendor-submission" || draft.vendorName) && (
            <>
              <DetailField label="Vendor name">
                <input
                  type="text"
                  value={draft.vendorName}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, vendorName: e.target.value }))
                  }
                  style={inputStyle}
                />
              </DetailField>
              <DetailField label="Vendor category">
                <input
                  type="text"
                  value={draft.vendorCategory}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      vendorCategory: e.target.value,
                    }))
                  }
                  style={inputStyle}
                />
              </DetailField>
            </>
          )}

          <DetailField label="Notes">
            <textarea
              rows={3}
              value={draft.notes}
              onChange={(e) =>
                setDraft((d) => ({ ...d, notes: e.target.value }))
              }
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </DetailField>

          <DetailField label="Info">
            <ul style={infoList}>
              {item.type === "image" && item.width && item.height && (
                <li>
                  Dimensions: {item.width} × {item.height}
                </li>
              )}
              {item.type === "video" && (
                <>
                  {item.width && item.height && (
                    <li>
                      Dimensions: {item.width} × {item.height}
                    </li>
                  )}
                  {typeof item.duration === "number" && (
                    <li>Duration: {formatDuration(item.duration)}</li>
                  )}
                </>
              )}
              <li>Size: {formatBytes(item.fileSize)}</li>
              <li>Format: {item.mimeType || "—"}</li>
              <li>Created: {new Date(item.createdAt).toLocaleString()}</li>
            </ul>
          </DetailField>

          {item.usedIn.length > 0 ? (
            <DetailField label={`Used in (${item.usedIn.length})`}>
              <ul style={usedList}>
                {item.usedIn.map((id) => (
                  <li key={id}>
                    <Link href={`/editor/${id}`} style={usedLink}>
                      → {id}
                    </Link>
                  </li>
                ))}
              </ul>
            </DetailField>
          ) : (
            <DetailField label="Used in">
              <span
                style={{ color: "var(--mauve)", fontSize: 12, fontFamily: fontBody }}
              >
                Not used in any calendar items yet.
              </span>
            </DetailField>
          )}
        </div>

        <footer style={detailFooter}>
          <button type="button" onClick={handleSave} style={primaryButton}>
            Save
          </button>
          <button
            type="button"
            onClick={onDelete}
            style={{
              ...ghostButton,
              color: "var(--deep-pink)",
              borderColor: "var(--deep-pink)",
            }}
          >
            Delete
          </button>
        </footer>
      </aside>
    </div>
  );
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={detailFieldLabel}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function NewTextDialog({
  collections,
  onClose,
  onSubmit,
}: {
  collections: string[];
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    content: string;
    tags: string[];
    collection: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [collection, setCollection] = useState("Text & Quotes");

  function handleAddTag() {
    const t = tagDraft.trim();
    if (!t || tags.includes(t)) {
      setTagDraft("");
      return;
    }
    setTags([...tags, t]);
    setTagDraft("");
  }

  return (
    <div style={detailBackdrop} onClick={onClose}>
      <div style={dialogBox} onClick={(e) => e.stopPropagation()}>
        <header style={detailHeader}>
          <div>
            <div style={detailEyebrow}>New text item</div>
            <h2 style={detailTitle}>Save a quote, confession, or snippet</h2>
          </div>
          <button type="button" onClick={onClose} style={detailCloseBtn}>
            ×
          </button>
        </header>
        <div style={{ ...detailBody, padding: "8px 24px 24px" }}>
          <DetailField label="Title">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="optional"
              style={inputStyle}
            />
          </DetailField>
          <DetailField label="Content">
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the quote, confession, or caption draft…"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </DetailField>
          <DetailField label="Tags">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  style={hashtagPill}
                >
                  {tag} ×
                </button>
              ))}
            </div>
            <input
              type="text"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add tag, ↵"
              style={inputStyle}
            />
          </DetailField>
          <DetailField label="Collection">
            <select
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              style={inputStyle}
            >
              {collections.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </DetailField>
        </div>
        <footer style={detailFooter}>
          <button
            type="button"
            onClick={() =>
              void onSubmit({ title, content, tags, collection })
            }
            disabled={!content.trim()}
            style={{
              ...primaryButton,
              opacity: content.trim() ? 1 : 0.5,
              cursor: content.trim() ? "pointer" : "not-allowed",
            }}
          >
            Save text
          </button>
          <button type="button" onClick={onClose} style={ghostButton}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
}

function QuickTagDialog({
  ids,
  collections,
  onClose,
  onApply,
}: {
  ids: string[];
  collections: string[];
  onClose: () => void;
  onApply: (collection: string, tags: string[]) => Promise<void>;
}) {
  const [collection, setCollection] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");

  return (
    <div style={detailBackdrop} onClick={onClose}>
      <div style={dialogBox} onClick={(e) => e.stopPropagation()}>
        <header style={detailHeader}>
          <div>
            <div style={detailEyebrow}>Tag uploads</div>
            <h2 style={detailTitle}>
              {ids.length} new file{ids.length === 1 ? "" : "s"} — add a
              collection or tags
            </h2>
          </div>
          <button type="button" onClick={onClose} style={detailCloseBtn}>
            ×
          </button>
        </header>
        <div style={{ ...detailBody, padding: "8px 24px 24px" }}>
          <DetailField label="Move to collection (optional)">
            <select
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              style={inputStyle}
            >
              <option value="">— keep default —</option>
              {collections.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </DetailField>
          <DetailField label="Tags (apply to all)">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  style={hashtagPill}
                >
                  {t} ×
                </button>
              ))}
            </div>
            <input
              type="text"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (tagDraft.trim() && !tags.includes(tagDraft.trim())) {
                    setTags([...tags, tagDraft.trim()]);
                  }
                  setTagDraft("");
                }
              }}
              placeholder="Add tag, ↵"
              style={inputStyle}
            />
          </DetailField>
        </div>
        <footer style={detailFooter}>
          <button
            type="button"
            onClick={() => void onApply(collection, tags)}
            style={primaryButton}
          >
            Apply
          </button>
          <button type="button" onClick={onClose} style={ghostButton}>
            Skip
          </button>
        </footer>
      </div>
    </div>
  );
}

function DragOverlay() {
  return (
    <div style={dragOverlayStyle}>
      <div style={dragOverlayInner}>
        Drop files here to upload to the Media Library
      </div>
    </div>
  );
}

// ===========================================================================
// Helpers
// ===========================================================================

function readDraggedItemIds(e: DragEvent<Element>): string[] | null {
  try {
    const raw = e.dataTransfer.getData("application/x-marigold-media-ids");
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : null;
  } catch {
    return null;
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return "—";
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ===========================================================================
// Styles
// ===========================================================================

const fontBody = "'Space Grotesk', sans-serif";
const fontUI = "'Syne', sans-serif";
const fontDisplay = "'Instrument Serif', serif";

const pageStyle: CSSProperties = {
  background: "var(--cream)",
  minHeight: "100vh",
  position: "relative",
};

const heroStyle: CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto 24px",
};

const eyebrowStyle: CSSProperties = {
  fontFamily: fontUI,
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 6,
  color: "var(--pink)",
  marginBottom: 10,
};

const titleStyle: CSSProperties = {
  fontFamily: fontDisplay,
  fontSize: 64,
  color: "var(--wine)",
  lineHeight: 1,
  marginBottom: 12,
};

const leadStyle: CSSProperties = {
  fontFamily: fontBody,
  fontSize: 15,
  color: "var(--mauve)",
  lineHeight: 1.6,
  maxWidth: 720,
};

const layoutGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "240px 1fr",
  gap: 24,
  maxWidth: 1280,
  margin: "0 auto",
};

const sidebarStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "18px 14px",
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.08)",
  borderRadius: 14,
  alignSelf: "flex-start",
  position: "sticky",
  top: 76,
};

const sidebarSection: CSSProperties = {
  fontFamily: fontUI,
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--pink)",
  margin: "12px 6px 6px",
};

const sidebarRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  borderRadius: 6,
  padding: "0 4px",
  transition: "background 0.12s ease",
};

const sidebarBtn: CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  background: "transparent",
  border: "none",
  textAlign: "left",
  fontFamily: fontBody,
  fontSize: 13,
  padding: "8px 6px",
  cursor: "pointer",
};

const sidebarDeleteBtn: CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--mauve)",
  fontSize: 16,
  padding: "0 6px",
  lineHeight: 1,
};

const sidebarChipStyle: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "8px 10px",
  border: "1px solid rgba(75,21,40,0.1)",
  borderRadius: 6,
  fontFamily: fontUI,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.2,
  cursor: "pointer",
  marginTop: 4,
};

const sidebarDivider: CSSProperties = {
  height: 1,
  background: "rgba(75,21,40,0.08)",
  margin: "12px 4px",
};

const sidebarInput: CSSProperties = {
  fontFamily: fontBody,
  fontSize: 12,
  padding: "6px 8px",
  border: "1px solid rgba(75,21,40,0.2)",
  borderRadius: 4,
  background: "var(--cream)",
  color: "var(--wine)",
};

const tinyAddBtn: CSSProperties = {
  fontFamily: fontUI,
  fontSize: 12,
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  padding: "0 10px",
  cursor: "pointer",
};

const addCollectionBtn: CSSProperties = {
  fontFamily: fontUI,
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.2,
  color: "var(--mauve)",
  background: "transparent",
  border: "1px dashed rgba(75,21,40,0.3)",
  borderRadius: 6,
  padding: "8px 10px",
  margin: "6px 4px 0",
  cursor: "pointer",
};

const countPill: CSSProperties = {
  fontFamily: fontUI,
  fontSize: 10,
  background: "rgba(75,21,40,0.08)",
  color: "var(--mauve)",
  padding: "2px 8px",
  borderRadius: 999,
  fontWeight: 700,
};

const tagWrap: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  padding: "0 4px",
};

const tagPill: CSSProperties = {
  fontFamily: fontBody,
  fontSize: 11,
  padding: "4px 10px",
  border: "1px solid rgba(75,21,40,0.2)",
  borderRadius: 999,
  background: "transparent",
  color: "var(--mauve)",
  cursor: "pointer",
};

const mainStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  minWidth: 0,
};

const topBarStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const searchStyle: CSSProperties = {
  flex: 1,
  minWidth: 220,
  fontFamily: fontBody,
  fontSize: 13,
  padding: "10px 12px",
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.2)",
  borderRadius: 6,
  color: "var(--wine)",
};

const selectStyle: CSSProperties = {
  fontFamily: fontBody,
  fontSize: 13,
  padding: "10px 12px",
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.2)",
  borderRadius: 6,
  color: "var(--wine)",
};

const viewToggle: CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(75,21,40,0.2)",
  borderRadius: 999,
  overflow: "hidden",
};

const viewToggleBtn: CSSProperties = {
  fontFamily: fontUI,
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "8px 14px",
  border: "none",
  cursor: "pointer",
};

const primaryButton: CSSProperties = {
  fontFamily: fontUI,
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "10px 18px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: "3px 3px 0 var(--gold)",
};

const ghostButton: CSSProperties = {
  fontFamily: fontUI,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "10px 14px",
  background: "transparent",
  color: "var(--mauve)",
  border: "1px dashed rgba(75,21,40,0.3)",
  borderRadius: 4,
  cursor: "pointer",
};

const ghostButtonInverse: CSSProperties = {
  fontFamily: fontUI,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "8px 12px",
  background: "transparent",
  color: "var(--cream)",
  border: "1px solid rgba(255,255,255,0.4)",
  borderRadius: 4,
  cursor: "pointer",
};

const bulkBar: CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  padding: "10px 16px",
  background: "var(--wine)",
  borderRadius: 8,
  flexWrap: "wrap",
  color: "var(--cream)",
  fontFamily: fontBody,
  fontSize: 12,
};

const uploadBar: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: 12,
  background: "var(--blush)",
  border: "1px dashed rgba(153,53,86,0.3)",
  borderRadius: 8,
};

const uploadRow: CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
};

const uploadProgressTrack: CSSProperties = {
  width: 160,
  height: 6,
  background: "rgba(75,21,40,0.1)",
  borderRadius: 999,
  overflow: "hidden",
};

const uploadProgressFill: CSSProperties = {
  height: "100%",
  background: "var(--pink)",
  transition: "width 120ms linear",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: 14,
};

const tileStyle: CSSProperties = {
  position: "relative",
  background: "var(--cream)",
  borderRadius: 10,
  padding: 8,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const tileImageBtn: CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  width: "100%",
  aspectRatio: "1 / 1",
  overflow: "hidden",
  borderRadius: 6,
};

const tileTypeIcon: CSSProperties = {
  position: "absolute",
  top: 14,
  left: 14,
  background: "rgba(75,21,40,0.7)",
  color: "var(--cream)",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: 10,
  fontFamily: fontUI,
  fontWeight: 700,
  letterSpacing: 0.5,
};

const usedDot: CSSProperties = {
  position: "absolute",
  top: 14,
  right: 14,
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "var(--mint)",
  border: "2px solid var(--cream)",
  boxShadow: "0 0 0 1px rgba(75,21,40,0.15)",
};

const selectCheckbox: CSSProperties = {
  position: "absolute",
  top: 12,
  right: 12,
  background: "rgba(255,255,255,0.92)",
  borderRadius: 4,
  padding: 4,
  zIndex: 2,
  display: "flex",
};

const hoverOverlay: CSSProperties = {
  position: "absolute",
  inset: 8,
  bottom: 36,
  borderRadius: 6,
  background: "rgba(75,21,40,0.55)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  gap: 6,
  padding: 8,
  pointerEvents: "auto",
};

const hoverBtn: CSSProperties = {
  background: "var(--cream)",
  border: "none",
  borderRadius: 6,
  padding: "6px 8px",
  cursor: "pointer",
  fontSize: 12,
  color: "var(--wine)",
};

const tileLabel: CSSProperties = {
  fontFamily: fontBody,
  fontSize: 11,
  color: "var(--mauve)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const listTable: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontFamily: fontBody,
  fontSize: 13,
};

const listHeaderRow: CSSProperties = {
  background: "rgba(75,21,40,0.04)",
};

const listTh: CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontFamily: fontUI,
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--mauve)",
  borderBottom: "1px solid rgba(75,21,40,0.08)",
};

const listRow: CSSProperties = {
  borderBottom: "1px solid rgba(75,21,40,0.06)",
};

const listTd: CSSProperties = {
  padding: "8px 12px",
  color: "var(--wine)",
  verticalAlign: "middle",
};

const listNameBtn: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--wine)",
  fontFamily: fontBody,
  fontSize: 13,
  padding: 0,
};

const listThumbWrap: CSSProperties = {
  width: 36,
  height: 36,
  flexShrink: 0,
  borderRadius: 4,
  overflow: "hidden",
};

const detailBackdrop: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(75,21,40,0.25)",
  zIndex: 80,
  display: "flex",
  justifyContent: "flex-end",
};

const detailPanel: CSSProperties = {
  width: 400,
  maxWidth: "94vw",
  background: "var(--cream)",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  borderLeft: "1px solid rgba(75,21,40,0.08)",
  boxShadow: "-12px 0 32px rgba(75,21,40,0.12)",
};

const detailHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  padding: "20px 24px",
  borderBottom: "1px solid rgba(75,21,40,0.08)",
};

const detailEyebrow: CSSProperties = {
  fontFamily: fontUI,
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2.4,
  color: "var(--pink)",
};

const detailTitle: CSSProperties = {
  fontFamily: fontDisplay,
  fontSize: 22,
  color: "var(--wine)",
  margin: "4px 0 0",
  lineHeight: 1.15,
  wordBreak: "break-word",
};

const detailCloseBtn: CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 22,
  color: "var(--mauve)",
  cursor: "pointer",
  lineHeight: 1,
};

const detailBody: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "16px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const detailPreview: CSSProperties = {
  background: "var(--blush)",
  borderRadius: 8,
  padding: 16,
};

const textPreviewCard: CSSProperties = {
  fontFamily: fontBody,
  fontSize: 14,
  color: "var(--wine)",
  background: "var(--cream)",
  borderRadius: 6,
  padding: 14,
  whiteSpace: "pre-wrap",
  lineHeight: 1.55,
};

const detailFieldLabel: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontFamily: fontUI,
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--wine)",
};

const inputStyle: CSSProperties = {
  fontFamily: fontBody,
  fontSize: 13,
  padding: "10px 12px",
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.2)",
  borderRadius: 6,
  color: "var(--wine)",
  width: "100%",
  boxSizing: "border-box",
};

const hashtagPill: CSSProperties = {
  fontFamily: fontBody,
  fontSize: 12,
  fontWeight: 600,
  padding: "4px 10px",
  background: "var(--blush)",
  color: "var(--deep-pink)",
  border: "1px solid rgba(153,53,86,0.25)",
  borderRadius: 999,
  cursor: "pointer",
};

const infoList: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: "none",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontFamily: fontBody,
  fontSize: 12,
  color: "var(--mauve)",
};

const usedList: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: "none",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const usedLink: CSSProperties = {
  fontFamily: fontBody,
  fontSize: 12,
  color: "var(--deep-pink)",
  textDecoration: "underline",
};

const detailFooter: CSSProperties = {
  display: "flex",
  gap: 10,
  padding: "16px 24px",
  borderTop: "1px solid rgba(75,21,40,0.08)",
};

const dialogBox: CSSProperties = {
  margin: "auto",
  width: 480,
  maxWidth: "94vw",
  maxHeight: "90vh",
  background: "var(--cream)",
  borderRadius: 12,
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 24px 64px rgba(75,21,40,0.25)",
  alignSelf: "center",
};

const loadingHint: CSSProperties = {
  fontFamily: fontBody,
  fontSize: 13,
  color: "var(--mauve)",
  padding: "60px 0",
  textAlign: "center",
};

const emptyState: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  gap: 14,
  padding: "60px 24px",
  background: "var(--blush)",
  borderRadius: 14,
  border: "1px dashed rgba(153,53,86,0.3)",
};

const emptyTitle: CSSProperties = {
  fontFamily: fontDisplay,
  fontSize: 28,
  color: "var(--wine)",
};

const emptyHint: CSSProperties = {
  fontFamily: fontBody,
  fontSize: 14,
  color: "var(--mauve)",
  maxWidth: 460,
  lineHeight: 1.5,
};

const dragOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(75,21,40,0.55)",
  zIndex: 90,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
};

const dragOverlayInner: CSSProperties = {
  background: "var(--cream)",
  border: "2px dashed var(--pink)",
  borderRadius: 16,
  padding: "40px 60px",
  fontFamily: fontUI,
  fontSize: 14,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--wine)",
};
