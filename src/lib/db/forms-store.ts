/**
 * Submission form configurations — backed by localStorage.
 *
 * A FormConfig is the customized version of a FormTemplateSeed: the title,
 * description, and field set after the user has tweaked it. The public form
 * page at /submit/[formId] reads from this store.
 */

import {
  STORE_KEYS_FORMS,
  getStore,
  updateStore,
} from "@/lib/db/local-store";
import {
  FORM_TEMPLATE_SEEDS,
  buildFormFromSeed,
  getFormTemplateSeed,
} from "@/lib/db/form-templates";
import type { FormConfig, FormField, FormTemplateType } from "@/lib/types";

const FORM_TEMPLATE_TYPES: readonly FormTemplateType[] = [
  "vendor",
  "vendor-portfolio",
  "vendor-tips",
  "venue",
  "bride-confession",
  "bride-connect",
  "bride-diary",
  "wedding-recap",
  "general",
] as const;

function isFormTemplateType(value: string): value is FormTemplateType {
  return (FORM_TEMPLATE_TYPES as readonly string[]).includes(value);
}

function readAll(): FormConfig[] {
  return getStore<FormConfig[]>(STORE_KEYS_FORMS.forms, []);
}

function newId(prefix = "form"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function sortItems(items: FormConfig[]): FormConfig[] {
  return [...items].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
  );
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function getAllForms(): FormConfig[] {
  return sortItems(readAll());
}

/**
 * Resolves a form by id, with two layers of fallback so the public URL
 * `/submit/<slug>` (e.g. `/submit/vendor-portfolio`) always works:
 *
 *   1. Exact id match — a custom form the user created.
 *   2. Template-type slug — the most-recent form with that templateType.
 *   3. Virtual seed form — the seed defaults, returned with the slug as id.
 *
 * The third path means a fresh install can already accept submissions
 * without the user creating a form first.
 */
export function getFormById(id: string): FormConfig | null {
  const all = readAll();
  const direct = all.find((f) => f.id === id);
  if (direct) return direct;

  if (isFormTemplateType(id)) {
    const matches = sortItems(all.filter((f) => f.templateType === id));
    if (matches.length > 0) return matches[0];

    const seed = getFormTemplateSeed(id);
    if (seed) {
      const virtualBase = buildFormFromSeed(seed);
      const virtual: FormConfig = {
        ...virtualBase,
        id,
        createdAt: "",
        updatedAt: "",
        submissionCount: 0,
      };
      return virtual;
    }
  }

  return null;
}

/**
 * URL slug used for the public link. Built-in template types use their
 * slug (`/submit/vendor-portfolio`); custom forms fall back to their id.
 */
export function getFormPublicSlug(form: FormConfig): string {
  if (isFormTemplateType(form.id)) return form.id;
  // If this is the only / first form of a built-in type, prefer the slug
  // so links shared via Settings stay stable as the form is edited.
  const all = readAll();
  const sameTypeCount = all.filter((f) => f.templateType === form.templateType).length;
  if (sameTypeCount <= 1 && isFormTemplateType(form.templateType)) {
    return form.templateType;
  }
  return form.id;
}

export function getActiveForms(): FormConfig[] {
  return sortItems(readAll()).filter((f) => f.isActive);
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export function createFormFromTemplate(
  type: FormTemplateType,
): FormConfig {
  const seed = getFormTemplateSeed(type);
  if (!seed) throw new Error(`Unknown form template: ${type}`);
  const now = nowIso();
  const config: FormConfig = {
    ...buildFormFromSeed(seed),
    id: newId("form"),
    createdAt: now,
    updatedAt: now,
    submissionCount: 0,
  };
  updateStore<FormConfig[]>(STORE_KEYS_FORMS.forms, [], (current) => [
    config,
    ...current,
  ]);
  return config;
}

export function updateForm(
  id: string,
  updates: Partial<Omit<FormConfig, "id" | "createdAt">>,
): FormConfig {
  let updated: FormConfig | null = null;
  updateStore<FormConfig[]>(STORE_KEYS_FORMS.forms, [], (current) =>
    current.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...updates, updatedAt: nowIso() };
      return updated;
    }),
  );
  if (!updated) throw new Error(`Form not found: ${id}`);
  return updated;
}

export function duplicateForm(id: string): FormConfig | null {
  const existing = getFormById(id);
  if (!existing) return null;
  const now = nowIso();
  const copy: FormConfig = {
    ...existing,
    id: newId("form"),
    title: `${existing.title} (copy)`,
    createdAt: now,
    updatedAt: now,
    submissionCount: 0,
    fields: existing.fields.map((field) => ({ ...field })),
  };
  updateStore<FormConfig[]>(STORE_KEYS_FORMS.forms, [], (current) => [
    copy,
    ...current,
  ]);
  return copy;
}

export function deleteForm(id: string): void {
  updateStore<FormConfig[]>(STORE_KEYS_FORMS.forms, [], (current) =>
    current.filter((f) => f.id !== id),
  );
}

export function toggleFormActive(id: string): FormConfig | null {
  const existing = getFormById(id);
  if (!existing) return null;
  return updateForm(id, { isActive: !existing.isActive });
}

export function incrementSubmissionCount(id: string): void {
  const existing = getFormById(id);
  if (!existing) return;
  updateForm(id, { submissionCount: existing.submissionCount + 1 });
}

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

export function newFieldId(prefix = "field"): string {
  return `${prefix}_${Date.now().toString(36).slice(-4)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function blankField(): FormField {
  return {
    id: newFieldId(),
    type: "text",
    label: "New question",
    required: false,
    enabled: true,
  };
}

export const FIELD_TYPE_LABELS: { value: FormField["type"]; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Single choice" },
  { value: "multi-select", label: "Multi-select" },
  { value: "file", label: "File upload" },
  { value: "date", label: "Date" },
  { value: "month-year", label: "Month + Year" },
  { value: "checkbox", label: "Checkbox" },
];

export { FORM_TEMPLATE_SEEDS };
