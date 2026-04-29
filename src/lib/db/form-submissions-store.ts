/**
 * Form submissions inbox — submissions captured from public /submit/[formId]
 * forms. Stored in localStorage keyed by submission id.
 *
 * The studio UI reads this list. The Next.js API route at /api/submit/[formId]
 * is the *server-side* writer; locally it appends to a JSON file under
 * /public/submissions and the studio polls that JSON on load to merge any
 * new entries into the local store.
 */

import {
  STORE_KEYS_FORMS,
  getStore,
  setStore,
  updateStore,
} from "@/lib/db/local-store";
import type {
  FormSubmission,
  FormSubmissionStatus,
} from "@/lib/types";
import { incrementSubmissionCount } from "@/lib/db/forms-store";
import { findAndMatchOutreach } from "@/lib/db/outreach-log";

function readAll(): FormSubmission[] {
  return getStore<FormSubmission[]>(STORE_KEYS_FORMS.formSubmissions, []);
}

function writeAll(items: FormSubmission[]): void {
  setStore(STORE_KEYS_FORMS.formSubmissions, items);
}

function sortItems(items: FormSubmission[]): FormSubmission[] {
  return [...items].sort((a, b) =>
    a.submittedAt < b.submittedAt ? 1 : a.submittedAt > b.submittedAt ? -1 : 0,
  );
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function getAllFormSubmissions(): FormSubmission[] {
  return sortItems(readAll());
}

export function getFormSubmissionById(id: string): FormSubmission | null {
  return readAll().find((s) => s.id === id) ?? null;
}

export function getFormSubmissionsForForm(formId: string): FormSubmission[] {
  return sortItems(readAll().filter((s) => s.formId === formId));
}

export function getNewSubmissionCount(): number {
  return readAll().filter((s) => s.status === "new").length;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export function addFormSubmission(submission: FormSubmission): FormSubmission {
  const exists = readAll().some((s) => s.id === submission.id);
  if (exists) return submission;
  updateStore<FormSubmission[]>(
    STORE_KEYS_FORMS.formSubmissions,
    [],
    (current) => [submission, ...current],
  );
  try {
    incrementSubmissionCount(submission.formId);
  } catch {
    // form may have been deleted — ignore.
  }
  return submission;
}

export function mergeFormSubmissions(
  incoming: FormSubmission[],
): { added: number; total: number } {
  if (incoming.length === 0) {
    const all = readAll();
    return { added: 0, total: all.length };
  }
  const current = readAll();
  const known = new Set(current.map((s) => s.id));
  const fresh = incoming.filter((s) => !known.has(s.id));
  if (fresh.length === 0) return { added: 0, total: current.length };
  const next = sortItems([...fresh, ...current]);
  writeAll(next);
  // Bump per-form counters for newly-merged entries and try to match each
  // submission back to its outreach (best-effort, by template type + recency).
  for (const s of fresh) {
    try {
      incrementSubmissionCount(s.formId);
    } catch {
      // no-op
    }
    try {
      findAndMatchOutreach(s);
    } catch {
      // no-op — outreach matching is best-effort.
    }
  }
  return { added: fresh.length, total: next.length };
}

export function updateFormSubmission(
  id: string,
  updates: Partial<Omit<FormSubmission, "id" | "submittedAt">>,
): FormSubmission {
  let updated: FormSubmission | null = null;
  updateStore<FormSubmission[]>(
    STORE_KEYS_FORMS.formSubmissions,
    [],
    (current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        updated = { ...item, ...updates };
        return updated;
      }),
  );
  if (!updated) throw new Error(`Form submission not found: ${id}`);
  return updated;
}

export function deleteFormSubmission(id: string): void {
  updateStore<FormSubmission[]>(
    STORE_KEYS_FORMS.formSubmissions,
    [],
    (current) => current.filter((s) => s.id !== id),
  );
}

// ---------------------------------------------------------------------------
// "Last seen" tracking — used to show a toast for new arrivals.
// ---------------------------------------------------------------------------

export function getLastSeenAt(): string {
  return getStore<string>(STORE_KEYS_FORMS.formSubmissionsLastSeen, "");
}

export function setLastSeenAt(iso: string): void {
  setStore(STORE_KEYS_FORMS.formSubmissionsLastSeen, iso);
}

export function getSubmissionsSince(iso: string): FormSubmission[] {
  if (!iso) return readAll();
  return readAll().filter((s) => s.submittedAt > iso);
}

// ---------------------------------------------------------------------------
// Sync: pull from /public/submissions/_index.json and merge.
//
// During local development, the API route writes a single index file that
// the client polls on load. This is the seam where Supabase Storage swaps in
// — replace `fetch('/submissions/_index.json')` with a Supabase query.
// ---------------------------------------------------------------------------

export async function syncFromPublicIndex(): Promise<{
  added: number;
  total: number;
}> {
  if (typeof window === "undefined") {
    return { added: 0, total: readAll().length };
  }
  try {
    const res = await fetch("/submissions/_index.json", {
      cache: "no-store",
    });
    if (!res.ok) {
      return { added: 0, total: readAll().length };
    }
    const data = (await res.json()) as { submissions?: FormSubmission[] };
    const list = Array.isArray(data.submissions) ? data.submissions : [];
    return mergeFormSubmissions(list);
  } catch {
    return { added: 0, total: readAll().length };
  }
}

// ---------------------------------------------------------------------------
// Status labels
// ---------------------------------------------------------------------------

export const FORM_SUBMISSION_STATUSES: {
  value: FormSubmissionStatus;
  label: string;
}[] = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "saved-to-library", label: "Saved" },
  { value: "used", label: "Used" },
  { value: "rejected", label: "Rejected" },
];

export function formSubmissionStatusLabel(value: FormSubmissionStatus): string {
  return (
    FORM_SUBMISSION_STATUSES.find((s) => s.value === value)?.label ?? value
  );
}
