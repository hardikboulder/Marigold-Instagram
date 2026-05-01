/**
 * Asset records — metadata for every PNG exported from the studio.
 *
 * Storage model:
 *   - Source of truth: Supabase `asset_records` table + `assets`/`thumbnails`
 *     Storage buckets, accessed via /api/db/asset-records and
 *     /api/storage/upload (server-side, service-role).
 *   - Local cache: localStorage (STORE_KEYS.assets). Reads stay synchronous so
 *     existing components don't have to switch to async render. The cache is
 *     refilled by syncAssetRecords() on app boot and after writes.
 *
 * Writes (saveAssetRecord, deleteAssetRecord, clearAssetRecords):
 *   1. Update the localStorage cache immediately (UI feels instant).
 *   2. Fire-and-forget POST to the API to persist in Supabase.
 *   3. On API success, dispatch "marigold:storage-changed" so listeners
 *      (Library page) can re-read.
 */

import {
  STORE_KEYS,
  getStore,
  updateStore,
} from "@/lib/db/local-store";
import type { AssetRecord, AssetRecordInput } from "@/lib/types";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("marigold:storage-changed"));
  }
}

// ---------------------------------------------------------------------------
// Sync layer — pulls Supabase rows into the localStorage cache.
// ---------------------------------------------------------------------------

let syncPromise: Promise<void> | null = null;

export function syncAssetRecords(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    try {
      const res = await fetch("/api/db/asset-records", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { ok?: boolean; data?: AssetRecord[] };
      if (!json.ok || !Array.isArray(json.data)) return;
      // Replace the cache with the canonical DB list.
      updateStore<AssetRecord[]>(STORE_KEYS.assets, [], () =>
        json.data!.map((row) => normaliseRow(row)),
      );
      emitChange();
    } catch (err) {
      console.warn("[asset-store] sync failed", err);
    } finally {
      syncPromise = null;
    }
  })();
  return syncPromise;
}

function normaliseRow(row: AssetRecord): AssetRecord {
  // The DB row shape matches AssetRecord almost 1:1; fill required defaults
  // for legacy rows that may not have certain fields.
  return {
    ...row,
    file_size_bytes: row.file_size_bytes ?? null,
    render_config: row.render_config ?? {
      template_slug: row.template_slug,
      format: "post",
      content_data: {},
    },
  };
}

// ---------------------------------------------------------------------------
// Public API — synchronous reads, fire-and-forget writes.
// ---------------------------------------------------------------------------

export function saveAssetRecord(input: AssetRecordInput): AssetRecord {
  const record: AssetRecord = {
    id: input.id ?? newId(),
    calendar_item_id: input.calendar_item_id,
    template_slug: input.template_slug,
    series_slug: input.series_slug,
    file_type: input.file_type,
    file_url: input.file_url,
    file_path: input.file_path,
    thumbnail: input.thumbnail,
    thumbnail_path: input.thumbnail_path,
    filename: input.filename,
    dimensions: input.dimensions,
    file_size_bytes: input.file_size_bytes ?? null,
    render_config: input.render_config,
    created_at: input.created_at ?? nowIso(),
  };
  updateStore<AssetRecord[]>(STORE_KEYS.assets, [], (current) => [
    ...current,
    record,
  ]);
  emitChange();

  // Fire-and-forget DB upsert.
  if (typeof window !== "undefined") {
    void fetch("/api/db/asset-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    }).catch((err) => console.warn("[asset-store] save POST failed", err));
  }

  return record;
}

export function getAssetRecords(): AssetRecord[] {
  return [...getStore<AssetRecord[]>(STORE_KEYS.assets, [])].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );
}

export function getAssetsByCalendarItem(
  calendarItemId: string,
): AssetRecord[] {
  return getAssetRecords().filter(
    (a) => a.calendar_item_id === calendarItemId,
  );
}

export function deleteAssetRecord(id: string): void {
  updateStore<AssetRecord[]>(STORE_KEYS.assets, [], (current) =>
    current.filter((a) => a.id !== id),
  );
  emitChange();
  if (typeof window !== "undefined") {
    void fetch(`/api/db/asset-records?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).catch((err) => console.warn("[asset-store] delete failed", err));
  }
}

export function clearAssetRecords(): void {
  updateStore<AssetRecord[]>(STORE_KEYS.assets, [], () => []);
  emitChange();
  if (typeof window !== "undefined") {
    void fetch("/api/db/asset-records?all=1", { method: "DELETE" }).catch(
      (err) => console.warn("[asset-store] clearAll failed", err),
    );
  }
}
