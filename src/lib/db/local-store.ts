/**
 * Type-safe localStorage wrapper.
 *
 * - JSON serialize / parse on every read and write.
 * - All keys are namespaced under `marigold:` so we never collide with another
 *   app on the same origin.
 * - Falls back to an in-memory Map when `window.localStorage` is unavailable
 *   (SSR, private windows with storage disabled, etc.) so server rendering
 *   does not throw and the API remains synchronous everywhere.
 */

const NAMESPACE = "marigold:";

function namespaced(key: string): string {
  return key.startsWith(NAMESPACE) ? key : `${NAMESPACE}${key}`;
}

const memoryStore = new Map<string, string>();

function backend(): Storage | Map<string, string> {
  if (typeof window === "undefined") return memoryStore;
  try {
    const ls = window.localStorage;
    // Probe — Safari private mode throws on setItem.
    const probe = `${NAMESPACE}__probe__`;
    ls.setItem(probe, "1");
    ls.removeItem(probe);
    return ls;
  } catch {
    return memoryStore;
  }
}

function readRaw(key: string): string | null {
  const store = backend();
  if (store instanceof Map) return store.get(key) ?? null;
  return store.getItem(key);
}

function notifyChange(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("marigold:storage-changed"));
  } catch {
    // ignore — older runtimes
  }
}

function writeRaw(key: string, value: string): void {
  const store = backend();
  if (store instanceof Map) {
    store.set(key, value);
    notifyChange();
    return;
  }
  store.setItem(key, value);
  notifyChange();
}

function deleteRaw(key: string): void {
  const store = backend();
  if (store instanceof Map) {
    store.delete(key);
    notifyChange();
    return;
  }
  store.removeItem(key);
  notifyChange();
}

/** Read a JSON-serialized value. Returns `fallback` if missing or unparsable. */
export function getStore<T>(key: string, fallback: T): T {
  const raw = readRaw(namespaced(key));
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Write a value as JSON. */
export function setStore<T>(key: string, value: T): void {
  writeRaw(namespaced(key), JSON.stringify(value));
}

/** Delete a key. */
export function deleteStore(key: string): void {
  deleteRaw(namespaced(key));
}

/**
 * Mutate a value in place. Reads, applies the updater, writes back.
 * Used by the calendar/asset stores to keep CRUD logic small.
 */
export function updateStore<T>(
  key: string,
  fallback: T,
  updater: (current: T) => T,
): T {
  const next = updater(getStore<T>(key, fallback));
  setStore(key, next);
  return next;
}

export const STORE_KEYS = {
  contentCalendar: "content-calendar",
  assets: "assets",
  brandConfigOverrides: "brand-config-overrides",
  brandKnowledgeOverrides: "brand-knowledge-overrides",
  contentStrategy: "content-strategy",
  templateActive: "template-active",
  submissions: "vendor-submissions",
  submissionTemplates: "vendor-submission-templates",
} as const;

export const STORE_KEYS_FORMS = {
  forms: "submission-forms",
  formSubmissions: "form-submissions",
  formSubmissionsLastSeen: "form-submissions-last-seen",
} as const;
