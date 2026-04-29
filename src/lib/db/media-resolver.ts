/**
 * Media reference resolver.
 *
 * Calendar items reference media by id with the sentinel `media:<uuid>`. At
 * render time we look the id up in IndexedDB, create an object URL from the
 * stored blob, and cache it on a module-level Map so the same blob URL is
 * reused across renders. Stale URLs are revoked when the media item changes
 * or is deleted (we listen for `marigold:media-changed` to clear the cache).
 *
 * Two flavours are exposed:
 *   • resolveMediaUrl(id)         — async lookup, returns null if missing
 *   • resolveMediaUrlSync(id)     — returns a cached URL or null if not warm
 *   • prefetchMediaUrls(ids)      — warms the cache for a batch
 *   • useMediaUrl(value)          — React hook that resolves a value which
 *                                   may be a media: ref, a plain URL, or "".
 */

"use client";

import { useEffect, useState } from "react";
import { getMediaItem, getMediaItems } from "./media-store";
import { isMediaRef, parseMediaRef } from "./media-types";

interface CacheEntry {
  url: string;
  /** Bumped whenever we see a media-change event so React hooks can re-resolve. */
  generation: number;
}

const cache = new Map<string, CacheEntry>();
let generation = 0;
let listenerInstalled = false;

function installListener(): void {
  if (listenerInstalled || typeof window === "undefined") return;
  listenerInstalled = true;
  window.addEventListener("marigold:media-changed", () => {
    // Bump the generation so subscribers know to re-fetch. We also revoke any
    // existing URLs because the underlying blob may have changed.
    generation += 1;
    for (const entry of cache.values()) {
      try {
        URL.revokeObjectURL(entry.url);
      } catch {
        /* ignore */
      }
    }
    cache.clear();
  });
}

export async function resolveMediaUrl(id: string): Promise<string | null> {
  installListener();
  const cached = cache.get(id);
  if (cached) return cached.url;
  const item = await getMediaItem(id);
  if (!item) return null;
  const url = URL.createObjectURL(item.fileBlob);
  cache.set(id, { url, generation });
  return url;
}

export function resolveMediaUrlSync(id: string): string | null {
  const cached = cache.get(id);
  return cached ? cached.url : null;
}

export async function resolveMultipleMediaUrls(
  ids: string[],
): Promise<Record<string, string>> {
  installListener();
  const out: Record<string, string> = {};
  const missing: string[] = [];
  for (const id of ids) {
    const cached = cache.get(id);
    if (cached) out[id] = cached.url;
    else missing.push(id);
  }
  if (missing.length === 0) return out;
  const items = await getMediaItems(missing);
  for (const item of items) {
    const url = URL.createObjectURL(item.fileBlob);
    cache.set(item.id, { url, generation });
    out[item.id] = url;
  }
  return out;
}

/**
 * Prefetches thumbnail URLs for a batch of media items. Used by the Media
 * Library grid so it can render thumbs synchronously after the first paint.
 */
const thumbCache = new Map<string, CacheEntry>();

export async function getThumbnailUrl(id: string): Promise<string | null> {
  installListener();
  const cached = thumbCache.get(id);
  if (cached) return cached.url;
  const item = await getMediaItem(id);
  if (!item) return null;
  const url = URL.createObjectURL(item.thumbnailBlob);
  thumbCache.set(id, { url, generation });
  return url;
}

export function getThumbnailUrlSync(id: string): string | null {
  const cached = thumbCache.get(id);
  return cached ? cached.url : null;
}

if (typeof window !== "undefined") {
  window.addEventListener("marigold:media-changed", () => {
    for (const entry of thumbCache.values()) {
      try {
        URL.revokeObjectURL(entry.url);
      } catch {
        /* ignore */
      }
    }
    thumbCache.clear();
  });
}

/**
 * React hook that returns a renderable URL for a content_data field value.
 * Accepts:
 *   • "" / undefined → returns ""
 *   • "media:<id>"  → resolves through IndexedDB
 *   • anything else (http(s) URL, data URL) → returned as-is
 */
export function useResolvedMediaUrl(value: unknown): string {
  const id = parseMediaRef(value);
  const passthrough =
    typeof value === "string" && !isMediaRef(value) ? value : "";
  const [resolved, setResolved] = useState<string>(() =>
    id ? resolveMediaUrlSync(id) ?? "" : passthrough,
  );

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setResolved(passthrough);
      return;
    }
    resolveMediaUrl(id).then((url) => {
      if (!cancelled) setResolved(url ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [id, passthrough]);

  return resolved;
}

/**
 * Walk a content_data object and resolve every "media:<id>" string into a
 * blob URL. Returns a new object — never mutates. Used by the editor preview
 * and export pipeline so templates always see real URLs.
 */
export async function resolveContentDataMedia<T extends Record<string, unknown>>(
  data: T,
): Promise<T> {
  const ids = collectMediaIds(data);
  if (ids.length === 0) return data;
  const map = await resolveMultipleMediaUrls(ids);
  return mapMediaRefs(data, map) as T;
}

function collectMediaIds(value: unknown, out: string[] = []): string[] {
  if (value == null) return out;
  if (isMediaRef(value)) {
    const id = parseMediaRef(value);
    if (id && !out.includes(id)) out.push(id);
    return out;
  }
  if (Array.isArray(value)) {
    for (const v of value) collectMediaIds(v, out);
    return out;
  }
  if (typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      collectMediaIds(v, out);
    }
  }
  return out;
}

function mapMediaRefs(
  value: unknown,
  map: Record<string, string>,
): unknown {
  if (value == null) return value;
  if (isMediaRef(value)) {
    const id = parseMediaRef(value);
    return id && map[id] ? map[id] : value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => mapMediaRefs(v, map));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = mapMediaRefs(v, map);
    }
    return out;
  }
  return value;
}

/** Re-export for convenience. */
export { isMediaRef, parseMediaRef } from "./media-types";

/** Module-level generation counter. Components can subscribe via `useMediaGeneration`. */
export function useMediaGeneration(): number {
  const [g, setG] = useState(generation);
  useEffect(() => {
    if (typeof window === "undefined") return;
    function bump() {
      setG((prev) => prev + 1);
    }
    window.addEventListener("marigold:media-changed", bump);
    return () => window.removeEventListener("marigold:media-changed", bump);
  }, []);
  return g;
}
