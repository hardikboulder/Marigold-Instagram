/**
 * Compute how much localStorage the studio is using.
 *
 * Browsers cap each origin at roughly 5MB. We sum every key that lives under
 * the `marigold:` namespace (see local-store.ts) and report:
 *  - itemCount: number of CalendarItems + AssetRecords (the user-visible
 *    items, not raw store entries)
 *  - totalBytes: approximate byte count of all marigold values
 *  - percentage: 0–1 of the assumed 5MB ceiling
 */

const NAMESPACE = "marigold:";
const ESTIMATED_QUOTA_BYTES = 5 * 1024 * 1024;

export interface StorageUsage {
  itemCount: number;
  totalBytes: number;
  percentage: number;
}

export function computeStorageUsage(): StorageUsage {
  if (typeof window === "undefined") {
    return { itemCount: 0, totalBytes: 0, percentage: 0 };
  }

  let bytes = 0;
  let itemCount = 0;

  try {
    const ls = window.localStorage;
    for (let i = 0; i < ls.length; i++) {
      const key = ls.key(i);
      if (!key || !key.startsWith(NAMESPACE)) continue;
      const value = ls.getItem(key) ?? "";
      // localStorage stores UTF-16 — each char is roughly 2 bytes.
      bytes += (key.length + value.length) * 2;

      if (
        key === `${NAMESPACE}content-calendar` ||
        key === `${NAMESPACE}assets`
      ) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) itemCount += parsed.length;
        } catch {
          // ignore — value is not parseable JSON
        }
      }
    }
  } catch {
    // localStorage unavailable (private mode, SSR, etc.)
  }

  return {
    itemCount,
    totalBytes: bytes,
    percentage: bytes / ESTIMATED_QUOTA_BYTES,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
