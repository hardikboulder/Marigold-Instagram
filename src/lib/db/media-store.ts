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
  const id = input.id ?? newId();

  // Upload binaries to Supabase Storage (best-effort; if it fails we still
  // keep the local IDB copy so the UI stays consistent).
  let filePath: string | undefined;
  let thumbnailPath: string | undefined;
  let thumbnailUrl: string | undefined;
  if (input.type !== "text" && input.fileBlob && input.fileBlob.size > 0) {
    try {
      const ext = mimeToExt(input.mimeType, input.fileName);
      const objectKey = `${id}.${ext}`;
      const up = await uploadBlobToBucket("media", objectKey, input.fileBlob);
      filePath = up.path;
    } catch (e) {
      console.warn("[media-store] file upload failed", e);
    }
  }
  if (input.thumbnailBlob && input.thumbnailBlob.size > 0) {
    try {
      const up = await uploadBlobToBucket(
        "thumbnails",
        `media_${id}.jpg`,
        input.thumbnailBlob,
      );
      thumbnailPath = up.path;
      thumbnailUrl = up.publicUrl;
    } catch (e) {
      console.warn("[media-store] thumb upload failed", e);
    }
  }

  const item: MediaItem = {
    id,
    type: input.type,
    fileName: input.fileName,
    mimeType: input.mimeType,
    fileBlob: input.fileBlob,
    thumbnailBlob: input.thumbnailBlob,
    filePath,
    thumbnailPath,
    thumbnailUrl,
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
  pushMediaRow(item);
  return item;
}

// ---------------------------------------------------------------------------
// Supabase sync helpers
// ---------------------------------------------------------------------------

function mimeToExt(mime: string, fallbackName: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/gif") return "gif";
  if (mime === "image/webp") return "webp";
  if (mime === "video/mp4") return "mp4";
  if (mime === "video/webm") return "webm";
  const dot = fallbackName.lastIndexOf(".");
  return dot >= 0 ? fallbackName.slice(dot + 1) : "bin";
}

async function uploadBlobToBucket(
  bucket: "media" | "thumbnails" | "assets" | "submissions",
  path: string,
  blob: Blob,
): Promise<{ path: string; publicUrl?: string }> {
  const form = new FormData();
  form.append("bucket", bucket);
  form.append("path", path);
  form.append("file", blob);
  const res = await fetch("/api/storage/upload", { method: "POST", body: form });
  const json = (await res.json()) as {
    ok?: boolean;
    error?: string;
    path?: string;
    publicUrl?: string;
  };
  if (!json.ok || !json.path) throw new Error(json.error ?? "upload failed");
  return { path: json.path, publicUrl: json.publicUrl };
}

function pushMediaRow(item: MediaItem) {
  if (typeof window === "undefined") return;
  void fetch("/api/db/media-items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: item.id,
      type: item.type,
      file_name: item.fileName,
      mime_type: item.mimeType,
      file_path: item.filePath,
      thumbnail_path: item.thumbnailPath,
      width: item.width,
      height: item.height,
      duration_seconds: item.duration,
      file_size: item.fileSize,
      text_content: item.textContent,
      tags: item.tags,
      collection: item.collection,
      source: item.source,
      vendor_name: item.vendorName,
      vendor_category: item.vendorCategory,
      notes: item.notes,
      used_in: item.usedIn,
      submission_id: item.submissionId,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    }),
  }).catch((err) => console.warn("[media-store] DB push failed", err));
}

interface MediaRowFromDb {
  id: string;
  type: MediaItemType;
  file_name: string;
  mime_type: string;
  file_path?: string | null;
  thumbnail_path?: string | null;
  width?: number | null;
  height?: number | null;
  duration_seconds?: number | null;
  file_size?: number | null;
  text_content?: string | null;
  tags?: string[];
  collection?: string;
  source?: MediaSource;
  vendor_name?: string | null;
  vendor_category?: string | null;
  notes?: string;
  used_in?: string[];
  submission_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

let mediaSyncPromise: Promise<void> | null = null;
export function syncMediaItems(): Promise<void> {
  if (!isBrowser()) return Promise.resolve();
  if (mediaSyncPromise) return mediaSyncPromise;
  mediaSyncPromise = (async () => {
    try {
      const res = await fetch("/api/db/media-items", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { ok?: boolean; data?: MediaRowFromDb[] };
      if (!json.ok || !Array.isArray(json.data)) return;

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      const db = await getDb();
      const existingIds = new Set<string>(
        ((await db.getAllKeys(STORE)) as string[]).map((k) => String(k)),
      );

      // Insert any rows we don't already have locally. We don't refetch the
      // raw fileBlob; instead we put a placeholder Blob and the path so the
      // UI knows to fetch on demand. Thumbnail comes from the public URL.
      for (const row of json.data) {
        if (existingIds.has(row.id)) continue;
        const thumbnailUrl = row.thumbnail_path
          ? `${supabaseUrl}/storage/v1/object/public/thumbnails/${row.thumbnail_path}`
          : undefined;
        const item: MediaItem = {
          id: row.id,
          type: row.type,
          fileName: row.file_name,
          mimeType: row.mime_type,
          // Empty placeholder blob — the real file lives in Storage; UI
          // fetches it on demand when needed.
          fileBlob: new Blob([], { type: row.mime_type }),
          thumbnailBlob: new Blob([], { type: "image/jpeg" }),
          filePath: row.file_path ?? undefined,
          thumbnailPath: row.thumbnail_path ?? undefined,
          thumbnailUrl,
          width: row.width ?? undefined,
          height: row.height ?? undefined,
          duration: row.duration_seconds ?? undefined,
          fileSize: row.file_size ?? 0,
          textContent: row.text_content ?? undefined,
          tags: row.tags ?? [],
          collection: row.collection ?? "Vendor Photos",
          source: row.source ?? "upload",
          vendorName: row.vendor_name ?? undefined,
          vendorCategory: row.vendor_category ?? undefined,
          notes: row.notes ?? "",
          usedIn: row.used_in ?? [],
          createdAt: row.created_at ?? nowIso(),
          updatedAt: row.updated_at ?? nowIso(),
          submissionId: row.submission_id ?? undefined,
        };
        await db.put(STORE, item);
      }
      notifyChange();
    } catch (err) {
      console.warn("[media-store] sync failed", err);
    } finally {
      mediaSyncPromise = null;
    }
  })();
  return mediaSyncPromise;
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
  if (typeof window !== "undefined") {
    void fetch(`/api/db/media-items?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).catch((err) => console.warn("[media-store] delete failed", err));
  }
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
