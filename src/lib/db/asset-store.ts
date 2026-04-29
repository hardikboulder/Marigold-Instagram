/**
 * Exported-asset metadata, persisted to localStorage.
 *
 * We do NOT store the binary itself here — `file_url` is a data URL or blob
 * URL produced by the export pipeline (`src/lib/export/`). This store only
 * tracks the metadata so the Asset Library view can render thumbnails and
 * link back to the calendar item that produced the asset.
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

export function saveAssetRecord(input: AssetRecordInput): AssetRecord {
  const record: AssetRecord = {
    id: input.id ?? newId(),
    calendar_item_id: input.calendar_item_id,
    template_slug: input.template_slug,
    file_type: input.file_type,
    file_url: input.file_url,
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
}

export function clearAssetRecords(): void {
  updateStore<AssetRecord[]>(STORE_KEYS.assets, [], () => []);
}
