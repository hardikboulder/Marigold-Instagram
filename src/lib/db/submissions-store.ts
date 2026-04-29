/**
 * Vendor submissions CRUD — backed by localStorage via `local-store.ts`.
 *
 * Mirrors the pattern in `content-calendar-store.ts`. A submission is a chunk
 * of content (photos / quote / tips / etc.) sent in by a vendor or planner;
 * the studio team turns those into calendar posts via the Submission Inbox.
 */

import {
  STORE_KEYS,
  getStore,
  setStore,
  updateStore,
} from "@/lib/db/local-store";
import type {
  VendorSubmission,
  VendorSubmissionInput,
  SubmissionStatus,
  SubmissionType,
  VendorCategory,
} from "@/lib/types";

function readAll(): VendorSubmission[] {
  return getStore<VendorSubmission[]>(STORE_KEYS.submissions, []);
}

function writeAll(items: VendorSubmission[]): void {
  setStore(STORE_KEYS.submissions, items);
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function sortItems(items: VendorSubmission[]): VendorSubmission[] {
  // Newest first.
  return [...items].sort((a, b) =>
    a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0,
  );
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function getAllSubmissions(): VendorSubmission[] {
  return sortItems(readAll());
}

export function getSubmissionById(id: string): VendorSubmission | null {
  return readAll().find((s) => s.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

function materialize(input: VendorSubmissionInput): VendorSubmission {
  const now = nowIso();
  return {
    id: input.id ?? newId(),
    vendor_name: input.vendor_name,
    category: input.category,
    submission_type: input.submission_type,
    text_content: input.text_content,
    image_urls: input.image_urls ?? [],
    notes: input.notes,
    status: input.status,
    linked_calendar_item_id: input.linked_calendar_item_id ?? null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export function addSubmission(input: VendorSubmissionInput): VendorSubmission {
  const item = materialize(input);
  updateStore<VendorSubmission[]>(STORE_KEYS.submissions, [], (current) => [
    item,
    ...current,
  ]);
  return item;
}

export function updateSubmission(
  id: string,
  updates: Partial<Omit<VendorSubmission, "id" | "created_at">>,
): VendorSubmission {
  let updated: VendorSubmission | null = null;
  updateStore<VendorSubmission[]>(STORE_KEYS.submissions, [], (current) =>
    current.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...updates, updated_at: nowIso() };
      return updated;
    }),
  );
  if (!updated) {
    throw new Error(`Submission not found: ${id}`);
  }
  return updated;
}

export function deleteSubmission(id: string): void {
  updateStore<VendorSubmission[]>(STORE_KEYS.submissions, [], (current) =>
    current.filter((s) => s.id !== id),
  );
}

export function clearSubmissions(): void {
  writeAll([]);
}

// ---------------------------------------------------------------------------
// Stats — used by the Feed Calendar sidebar.
// ---------------------------------------------------------------------------

export interface SubmissionStats {
  total: number;
  unused: number;
  vendorsThisMonth: number;
  byStatus: Record<SubmissionStatus, number>;
}

export function computeSubmissionStats(
  monthIso: string,
  items?: VendorSubmission[],
): SubmissionStats {
  const all = items ?? readAll();
  const byStatus: Record<SubmissionStatus, number> = {
    new: 0,
    planned: 0,
    used: 0,
  };
  let unused = 0;
  const vendors = new Set<string>();
  for (const sub of all) {
    byStatus[sub.status] = (byStatus[sub.status] ?? 0) + 1;
    if (sub.status !== "used") unused += 1;
    if (sub.status === "used" && sub.updated_at.startsWith(monthIso)) {
      vendors.add(sub.vendor_name.trim().toLowerCase());
    }
  }
  return {
    total: all.length,
    unused,
    vendorsThisMonth: vendors.size,
    byStatus,
  };
}

// ---------------------------------------------------------------------------
// Submission request templates (the copy-pasteable messages in Settings).
// Stored separately so users can edit them without touching the inbox itself.
// ---------------------------------------------------------------------------

export interface SubmissionRequestTemplate {
  id: string;
  name: string;
  description: string;
  body: string;
}

export const DEFAULT_SUBMISSION_TEMPLATES: SubmissionRequestTemplate[] = [
  {
    id: "portfolio-submission",
    name: "Portfolio Submission",
    description:
      "Ask a new vendor for a portfolio drop — photos, bio, specialty.",
    body: [
      "Hi {{vendor_name}} —",
      "",
      "We'd love to feature your work on The Marigold. Could you send over:",
      "",
      "  • 5–10 high-res photos of your best work (favor recent weddings)",
      "  • A short bio (2–3 sentences — how you got into it, what makes you different)",
      "  • Your specialty (e.g. candid documentary, North Indian-style decor, fusion menus)",
      "",
      "We'll credit you in every post and tag your handle. Drop everything in a Drive / Dropbox link and reply here when ready.",
      "",
      "— The Marigold team",
    ].join("\n"),
  },
  {
    id: "vendor-tips",
    name: "Vendor Tips",
    description:
      "Pull 3–5 expert tips for a tips-card series. Include a headshot.",
    body: [
      "Hi {{vendor_name}} —",
      "",
      "We're putting together a vendor-tips series and would love yours. Could you send:",
      "",
      "  • 3–5 tips you wish brides knew about working with a {{category}} (one or two sentences each — punchy is better than thorough)",
      "  • A headshot we can use alongside the tips",
      "",
      "Tag-credit will go on every card. Reply with the text inline and the headshot as an attachment.",
      "",
      "— The Marigold team",
    ].join("\n"),
  },
  {
    id: "wedding-recap",
    name: "Wedding Recap",
    description:
      "Photos + a couple testimonial from a wedding the vendor worked on.",
    body: [
      "Hi {{vendor_name}} —",
      "",
      "We'd love to recap a wedding you worked on. Could you send:",
      "",
      "  • 8–15 photos from the wedding (mix of details, candids, and one hero portrait)",
      "  • The couple's first names + wedding date + location",
      "  • A 2–3 sentence testimonial from the couple if you can pull one",
      "  • A short note on what made the day yours (the moment, the detail, the chaos)",
      "",
      "Couples must be okay with being featured — please confirm before sending.",
      "",
      "— The Marigold team",
    ].join("\n"),
  },
  {
    id: "quick-quote",
    name: "Quick Quote",
    description:
      "A 1–2 sentence quote about the vendor's craft for a confessional / quote card.",
    body: [
      "Hi {{vendor_name}} —",
      "",
      "Quick favor — can you send over a 1–2 sentence quote about your craft? Something a bride would screenshot. Examples:",
      "",
      "  • The hardest part of being a {{category}} no one talks about",
      "  • The one thing brides always get wrong",
      "  • Why you do what you do",
      "",
      "We'll credit and tag you. Reply here with the line.",
      "",
      "— The Marigold team",
    ].join("\n"),
  },
  {
    id: "venue-package",
    name: "Venue Package",
    description:
      "Full venue submission — photos, capacity, style, pricing ballpark.",
    body: [
      "Hi {{vendor_name}} —",
      "",
      "We'd love to feature your venue on The Marigold. Could you send:",
      "",
      "  • 8–12 venue photos (mix: hero exterior, ceremony setup, reception, detail shots)",
      "  • Capacity (seated + standing, indoor + outdoor)",
      "  • A short style description (3–4 sentences — what kind of wedding fits here)",
      "  • Pricing ballpark (start-from number is fine — couples just want to know if it's in range)",
      "  • Any standout features brides should know (in-house catering, no-music curfew, accommodation, etc.)",
      "",
      "— The Marigold team",
    ].join("\n"),
  },
];

export function getSubmissionTemplates(): SubmissionRequestTemplate[] {
  const stored = getStore<SubmissionRequestTemplate[] | null>(
    STORE_KEYS.submissionTemplates,
    null,
  );
  return stored ?? DEFAULT_SUBMISSION_TEMPLATES;
}

export function setSubmissionTemplates(
  templates: SubmissionRequestTemplate[],
): void {
  setStore(STORE_KEYS.submissionTemplates, templates);
}

export function resetSubmissionTemplates(): void {
  setStore(STORE_KEYS.submissionTemplates, DEFAULT_SUBMISSION_TEMPLATES);
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export const VENDOR_CATEGORIES: { value: VendorCategory; label: string }[] = [
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "decorator", label: "Decorator" },
  { value: "planner", label: "Planner" },
  { value: "venue", label: "Venue" },
  { value: "caterer", label: "Caterer" },
  { value: "makeup", label: "Makeup / Hair" },
  { value: "florist", label: "Florist" },
  { value: "mehndi", label: "Mehndi Artist" },
  { value: "dj", label: "DJ / Music" },
  { value: "other", label: "Other" },
];

export const SUBMISSION_TYPES: { value: SubmissionType; label: string }[] = [
  { value: "photos", label: "Photos" },
  { value: "quote", label: "Quote" },
  { value: "tips", label: "Tips" },
  { value: "bio", label: "Bio" },
  { value: "wedding_recap", label: "Wedding Recap" },
  { value: "venue_package", label: "Venue Package" },
];

export const SUBMISSION_STATUSES: { value: SubmissionStatus; label: string }[] =
  [
    { value: "new", label: "New" },
    { value: "planned", label: "Planned" },
    { value: "used", label: "Used" },
  ];

export function vendorCategoryLabel(value: VendorCategory): string {
  return VENDOR_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function submissionTypeLabel(value: SubmissionType): string {
  return SUBMISSION_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function submissionStatusLabel(value: SubmissionStatus): string {
  return SUBMISSION_STATUSES.find((s) => s.value === value)?.label ?? value;
}
