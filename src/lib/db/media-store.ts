/**
 * Media Library — IndexedDB store for raw photos, videos, and text snippets.
 *
 * Uses `idb` (a small wrapper around the native IndexedDB API) so we can keep
 * blobs out of localStorage. localStorage stays in charge of small, query-
 * heavy state (calendar, settings, collections); IndexedDB owns the bytes.
 *
 * Public surface:
 *   • CRUD: addMediaItem / updateMediaItem / deleteMediaItem / getMediaItem
 *   • Bulk: getAllMediaItems
 *   • Collections: get/save/add/delete/rename (localStorage-backed)
 *   • Helpers: generateImageThumbnail / generateVideoThumbnail
 *
 * Every write fires a `marigold:media-changed` window event so UI can refresh
 * (mirrors the convention used by local-store.ts).
 */

import { openDB, type IDBPDatabase } from "idb";
import {
  DEFAULT_COLLECTIONS,
  MAX_FILE_SIZE_BYTES,
  detectMediaType,
  type MediaItem,
  type MediaItemPatch,
  type MediaItemType,
  type MediaSource,
} from "./media-types";

const DB_NAME = "marigold-media";
const DB_VERSION = 1;
const STORE = "items";
const COLLECTIONS_KEY = "marigold:media-collections";

let dbPromise: Promise<IDBPDatabase> | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function getDb(): Promise<IDBPDatabase> {
  if (!isBrowser()) {
    return Promise.reject(
      new Error("media-store: IndexedDB is unavailable (SSR or unsupported)."),
    );
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("byCollection", "collection", { unique: false });
          store.createIndex("byType", "type", { unique: false });
          store.createIndex("byCreatedAt", "createdAt", { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `media_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function notifyChange(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("marigold:media-changed"));
    window.dispatchEvent(new CustomEvent("marigold:storage-changed"));
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function getAllMediaItems(): Promise<MediaItem[]> {
  if (!isBrowser()) return [];
  const db = await getDb();
  const all = (await db.getAll(STORE)) as MediaItem[];
  return all.sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
  );
}

export async function getMediaItem(id: string): Promise<MediaItem | null> {
  if (!isBrowser()) return null;
  const db = await getDb();
  return ((await db.get(STORE, id)) as MediaItem | undefined) ?? null;
}

export async function getMediaItems(ids: string[]): Promise<MediaItem[]> {
  if (!isBrowser() || ids.length === 0) return [];
  const db = await getDb();
  const tx = db.transaction(STORE, "readonly");
  const out: MediaItem[] = [];
  for (const id of ids) {
    const item = (await tx.store.get(id)) as MediaItem | undefined;
    if (item) out.push(item);
  }
  await tx.done;
  return out;
}

export interface AddMediaItemInput {
  id?: string;
  type: MediaItemType;
  fileName: string;
  mimeType: string;
  fileBlob: Blob;
  thumbnailBlob: Blob;
  width?: number;
  height?: number;
  duration?: number;
  fileSize: number;
  textContent?: string;
  tags?: string[];
  collection?: string;
  source?: MediaSource;
  vendorName?: string;
  vendorCategory?: string;
  notes?: string;
  submissionId?: string;
}

export async function addMediaItem(input: AddMediaItemInput): Promise<MediaItem> {
  const db = await getDb();
  const item: MediaItem = {
    id: input.id ?? newId(),
    type: input.type,
    fileName: input.fileName,
    mimeType: input.mimeType,
    fileBlob: input.fileBlob,
    thumbnailBlob: input.thumbnailBlob,
    width: input.width,
    height: input.height,
    duration: input.duration,
    fileSize: input.fileSize,
    textContent: input.textContent,
    tags: input.tags ?? [],
    collection: input.collection ?? defaultCollectionFor(input.type),
    source: input.source ?? "upload",
    vendorName: input.vendorName,
    vendorCategory: input.vendorCategory,
    notes: input.notes ?? "",
    usedIn: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    submissionId: input.submissionId,
  };
  await db.put(STORE, item);
  notifyChange();
  return item;
}

export async function updateMediaItem(
  id: string,
  patch: MediaItemPatch,
): Promise<MediaItem | null> {
  const db = await getDb();
  const existing = (await db.get(STORE, id)) as MediaItem | undefined;
  if (!existing) return null;
  const next: MediaItem = {
    ...existing,
    ...patch,
    updatedAt: nowIso(),
  };
  await db.put(STORE, next);
  notifyChange();
  return next;
}

export async function deleteMediaItem(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
  notifyChange();
}

export async function deleteMediaItems(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const tx = db.transaction(STORE, "readwrite");
  for (const id of ids) await tx.store.delete(id);
  await tx.done;
  notifyChange();
}

/** Add tags to many items in one transaction. Idempotent. */
export async function addTagsToItems(
  ids: string[],
  tags: string[],
): Promise<void> {
  if (ids.length === 0 || tags.length === 0) return;
  const db = await getDb();
  const tx = db.transaction(STORE, "readwrite");
  for (const id of ids) {
    const item = (await tx.store.get(id)) as MediaItem | undefined;
    if (!item) continue;
    const merged = Array.from(new Set([...item.tags, ...tags]));
    await tx.store.put({ ...item, tags: merged, updatedAt: nowIso() });
  }
  await tx.done;
  notifyChange();
}

export async function moveItemsToCollection(
  ids: string[],
  collection: string,
): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const tx = db.transaction(STORE, "readwrite");
  for (const id of ids) {
    const item = (await tx.store.get(id)) as MediaItem | undefined;
    if (!item) continue;
    await tx.store.put({ ...item, collection, updatedAt: nowIso() });
  }
  await tx.done;
  ensureCollectionExists(collection);
  notifyChange();
}

/**
 * Add a calendar item id to the `usedIn` array for every media id in `ids`.
 * Idempotent — safe to call repeatedly during auto-save.
 */
export async function trackMediaUsage(
  mediaIds: string[],
  calendarItemId: string,
): Promise<void> {
  if (!isBrowser() || mediaIds.length === 0) return;
  const db = await getDb();
  const tx = db.transaction(STORE, "readwrite");
  for (const id of mediaIds) {
    const item = (await tx.store.get(id)) as MediaItem | undefined;
    if (!item) continue;
    if (item.usedIn.includes(calendarItemId)) continue;
    await tx.store.put({
      ...item,
      usedIn: [...item.usedIn, calendarItemId],
      updatedAt: nowIso(),
    });
  }
  await tx.done;
  notifyChange();
}

// ---------------------------------------------------------------------------
// Collections (localStorage-backed — small, listed often)
// ---------------------------------------------------------------------------

export function getCollections(): string[] {
  if (typeof window === "undefined") return [...DEFAULT_COLLECTIONS];
  try {
    const raw = window.localStorage.getItem(COLLECTIONS_KEY);
    if (!raw) {
      window.localStorage.setItem(
        COLLECTIONS_KEY,
        JSON.stringify(DEFAULT_COLLECTIONS),
      );
      return [...DEFAULT_COLLECTIONS];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_COLLECTIONS];
    return parsed.filter((c): c is string => typeof c === "string");
  } catch {
    return [...DEFAULT_COLLECTIONS];
  }
}

export function saveCollections(collections: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
    notifyChange();
  } catch {
    /* ignore */
  }
}

export function addCollection(name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) return getCollections();
  const current = getCollections();
  if (current.includes(trimmed)) return current;
  const next = [...current, trimmed];
  saveCollections(next);
  return next;
}

export function deleteCollection(name: string): string[] {
  const current = getCollections();
  if (!current.includes(name)) return current;
  const next = current.filter((c) => c !== name);
  saveCollections(next);
  return next;
}

export function ensureCollectionExists(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const current = getCollections();
  if (!current.includes(trimmed)) {
    saveCollections([...current, trimmed]);
  }
}

function defaultCollectionFor(type: MediaItemType): string {
  if (type === "video") return "Video Clips";
  if (type === "text") return "Text & Quotes";
  return "Vendor Photos";
}

// ---------------------------------------------------------------------------
// Thumbnail generation
// ---------------------------------------------------------------------------

export async function generateImageThumbnail(
  file: Blob,
  maxWidth = 300,
): Promise<{ blob: Blob; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const ratio = img.naturalHeight / img.naturalWidth || 1;
    const w = Math.min(maxWidth, img.naturalWidth || maxWidth);
    const h = Math.round(w * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");
    ctx.drawImage(img, 0, 0, w, h);
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error("toBlob returned null")),
        "image/jpeg",
        0.82,
      );
    });
    return {
      blob,
      width: img.naturalWidth || w,
      height: img.naturalHeight || h,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function generateVideoThumbnail(
  file: Blob,
  maxWidth = 300,
): Promise<{
  blob: Blob;
  width: number;
  height: number;
  duration: number;
}> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("video metadata load failed"));
    });
    // Seek to 1s — or duration/2 for shorter clips — for a representative frame.
    const seekTo = Math.min(1, Math.max(0, (video.duration || 0) / 2));
    await new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve();
      video.onerror = () => reject(new Error("video seek failed"));
      video.currentTime = seekTo;
    });
    const ratio = (video.videoHeight || 1) / (video.videoWidth || 1);
    const w = Math.min(maxWidth, video.videoWidth || maxWidth);
    const h = Math.round(w * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");
    ctx.drawImage(video, 0, 0, w, h);
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error("toBlob returned null")),
        "image/jpeg",
        0.78,
      );
    });
    return {
      blob,
      width: video.videoWidth || w,
      height: video.videoHeight || h,
      duration: video.duration || 0,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

/**
 * Renders a tiny SVG thumbnail for text items so the grid has something to
 * show. The returned blob is image/svg+xml and renders instantly.
 */
export function generateTextThumbnail(
  textContent: string,
  title?: string,
): Blob {
  const preview = (title || textContent || "Text")
    .replace(/[<>&]/g, " ")
    .slice(0, 70);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff8f2"/>
      <stop offset="100%" stop-color="#fbeaf0"/>
    </linearGradient>
  </defs>
  <rect width="300" height="300" fill="url(#bg)"/>
  <text x="20" y="50" font-family="Syne, sans-serif" font-size="11" font-weight="700"
        letter-spacing="2" fill="#993556" text-transform="uppercase">TEXT</text>
  <foreignObject x="20" y="60" width="260" height="220">
    <div xmlns="http://www.w3.org/1999/xhtml"
         style="font-family: 'Space Grotesk', sans-serif; font-size: 14px;
                color: #4b1528; line-height: 1.45; word-wrap: break-word;">
      ${preview}${preview.length >= 70 ? "…" : ""}
    </div>
  </foreignObject>
</svg>`;
  return new Blob([svg], { type: "image/svg+xml" });
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export interface FileValidation {
  ok: boolean;
  reason?: string;
  type?: MediaItemType;
}

export function validateFile(file: File): FileValidation {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      reason: `File is ${(file.size / 1024 / 1024).toFixed(1)}MB — max is 50MB.`,
    };
  }
  const type = detectMediaType(file.type);
  if (!type) {
    return {
      ok: false,
      reason: `Unsupported file type: ${file.type || "unknown"}.`,
    };
  }
  return { ok: true, type };
}
