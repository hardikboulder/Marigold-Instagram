"use client";

/**
 * Smart vendor intake form at /submit/vendor.
 *
 * Layout:
 *   - Single scrolling page (NOT a wizard) — short enough that progressive
 *     disclosure carries the load.
 *   - Universal opening fields appear immediately.
 *   - Once the vendor picks a category, category-specific questions slide
 *     in with a height/opacity transition and the page gently scrolls so
 *     the new section is visible.
 *   - Universal closing fields render below the category section.
 *
 * The category picker is a searchable combobox (typing "photo" filters to
 * Photographer + Photo Booth). Categories are grouped under headings.
 *
 * State persists to sessionStorage on every change so a vendor who tabs
 * away and comes back doesn't lose progress. File uploads are not
 * persisted — that's a browser limitation; we surface this in the UI.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type DragEvent,
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  CATEGORY_FIELDS,
  MICRO_CATEGORIES,
  NICHE_OTHER_SENTINEL,
  UNIVERSAL_CLOSING_FIELDS,
  UNIVERSAL_OPENING_FIELDS,
  VENDOR_CATEGORIES,
  getAllVendorFields,
  getCategoryById,
  getCategoryByLabel,
  getFieldsForCategory,
  groupedVendorCategories,
  type VendorCategory,
  type VendorField,
} from "./vendor-form-schema";
import {
  VendorSubmittedView,
  deriveOnboardingContext,
  type VendorOnboardingContext,
  type VendorProfile,
} from "./VendorSubmittedView";

interface Props {
  draftToken?: string;
}

type FieldValue = string | string[] | File[] | boolean;

const DRAFT_SESSION_KEY = "marigold-vendor-draft";
const CATEGORY_SECTION_ID = "category-questions";

export function VendorSubmissionForm({ draftToken }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [values, setValues] = useState<Record<string, FieldValue>>(() =>
    initialValues(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftLink, setDraftLink] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState("");
  const [submitted, setSubmitted] = useState<{
    vendorProfile: VendorProfile;
    submissionId: string;
    firstPhoto?: { name: string; dataUrl: string };
    onboardingContext: VendorOnboardingContext;
  } | null>(null);
  const honeypotRef = useRef<HTMLInputElement | null>(null);
  const categorySectionRef = useRef<HTMLDivElement | null>(null);
  const previousCategoryRef = useRef<string>("");

  const categoryId = (values.category as string) || "";
  const category = useMemo(() => getCategoryById(categoryId), [categoryId]);
  const categoryFields = useMemo(
    () => getFieldsForCategory(categoryId),
    [categoryId],
  );

  // Hydrate from sessionStorage and resume token.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      let next = initialValues();
      try {
        const raw = sessionStorage.getItem(DRAFT_SESSION_KEY);
        if (raw) {
          const draft = JSON.parse(raw) as Record<string, unknown>;
          next = { ...next, ...sanitiseDraft(draft) };
        }
      } catch {
        // ignore
      }
      if (draftToken) {
        try {
          const res = await fetch(
            `/api/vendor/draft?token=${encodeURIComponent(draftToken)}`,
          );
          if (res.ok) {
            const json = await res.json();
            if (json?.values && typeof json.values === "object") {
              next = { ...next, ...sanitiseDraft(json.values) };
            }
          }
        } catch {
          // network error — fall back to whatever was in sessionStorage
        }
      }
      if (!cancelled) {
        setValues(next);
        setHydrated(true);
        previousCategoryRef.current = (next.category as string) || "";
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [draftToken]);

  // Persist non-file values on every change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        DRAFT_SESSION_KEY,
        JSON.stringify(serializableValues(values)),
      );
    } catch {
      // ignore quota / private-mode errors
    }
  }, [values, hydrated]);

  // Track the previous category id. The category-specific section slides
  // in just below the dropdown the user just clicked, so no auto-scroll is
  // needed — scrolling away would skip past the universal opening fields
  // the user may not have filled in yet.
  useEffect(() => {
    if (!hydrated) return;
    previousCategoryRef.current = categoryId;
  }, [categoryId, hydrated]);

  function setFieldValue(id: string, next: FieldValue) {
    setValues((v) => {
      // When the category changes, drop any answers that belonged to the
      // previous category so the resume token doesn't accumulate stale
      // data (and the summary panel stays accurate).
      if (id === "category") {
        const prevCategory = (v.category as string) || "";
        if (prevCategory && prevCategory !== next) {
          const purged = { ...v };
          for (const f of getFieldsForCategory(prevCategory)) {
            if (f.type === "multi-select" || f.type === "file") purged[f.id] = [];
            else if (f.type === "checkbox") purged[f.id] = false;
            else purged[f.id] = "";
          }
          return { ...purged, category: next };
        }
      }
      return { ...v, [id]: next };
    });
    if (errors[id]) {
      setErrors((e) => {
        const { [id]: _drop, ...rest } = e;
        return rest;
      });
    }
  }

  function isVisible(field: VendorField): boolean {
    const cond = field.showIf;
    if (!cond) return true;
    const target = values[cond.fieldId];
    if (cond.includes !== undefined) {
      return Array.isArray(target) && (target as string[]).includes(cond.includes);
    }
    if (cond.equals && cond.equals.length > 0) {
      return typeof target === "string" && cond.equals.includes(target);
    }
    return true;
  }

  function visibleFieldList(): VendorField[] {
    const all: VendorField[] = [...UNIVERSAL_OPENING_FIELDS];
    if (categoryId) {
      all.push(...categoryFields);
      all.push(...UNIVERSAL_CLOSING_FIELDS);
    }
    return all.filter(isVisible);
  }

  function validateAll(): Record<string, string> {
    const errs: Record<string, string> = {};
    for (const field of visibleFieldList()) {
      const v = values[field.id];
      const empty =
        v === undefined ||
        v === "" ||
        (Array.isArray(v) && v.length === 0) ||
        (field.type === "checkbox" && v === false);
      if (field.required && empty) {
        errs[field.id] =
          field.type === "checkbox"
            ? "Please confirm to continue."
            : "This field is required.";
        continue;
      }
      if (field.type === "email" && typeof v === "string" && v.length > 0) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
          errs[field.id] = "Enter a valid email.";
        }
      }
      if (field.type === "url" && typeof v === "string" && v.length > 0) {
        if (!/^https?:\/\//i.test(v)) {
          errs[field.id] = "Start the link with http:// or https://";
        }
      }
      if (
        (field.type === "text" || field.type === "textarea") &&
        typeof v === "string" &&
        field.maxLength &&
        v.length > field.maxLength
      ) {
        errs[field.id] = `Max ${field.maxLength} characters.`;
      }
    }
    return errs;
  }

  async function onSaveDraft() {
    if (savingDraft) return;
    setSavingDraft(true);
    setDraftLink(null);
    try {
      const res = await fetch("/api/vendor/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: draftToken,
          values: serializableValues(values),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Couldn't save your draft.");
      }
      const url = `${window.location.origin}/submit/vendor?draft=${json.token}`;
      setDraftLink(url);
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : "Couldn't save your draft.",
      );
    } finally {
      setSavingDraft(false);
    }
  }

  async function onSubmit() {
    if (submitting) return;
    const errs = validateAll();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstId = Object.keys(errs)[0];
      const node = document.getElementById(`field-${firstId}`);
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
      setGlobalError("Please fix the highlighted fields before submitting.");
      return;
    }

    setSubmitting(true);
    setGlobalError("");
    try {
      const fd = new FormData();
      fd.append("_company", honeypotRef.current?.value ?? "");
      fd.append("_draft_token", draftToken ?? "");

      for (const field of visibleFieldList()) {
        const v = values[field.id];
        if (v === undefined) continue;
        if (field.type === "multi-select" && Array.isArray(v)) {
          for (const item of v as string[]) fd.append(field.id, item);
        } else if (field.type === "file" && Array.isArray(v)) {
          for (const file of v as File[]) {
            fd.append(field.id, file, file.name);
          }
        } else if (field.type === "checkbox") {
          fd.append(field.id, v ? "yes" : "");
        } else {
          fd.append(field.id, String(v ?? ""));
        }
      }

      const res = await fetch("/api/submit/vendor", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Submission failed (${res.status}).`);
      }

      const firstPhoto = Array.isArray(values.portfolio_photos)
        ? (values.portfolio_photos as File[])[0]
        : undefined;
      let firstPhotoData: { name: string; dataUrl: string } | undefined;
      if (firstPhoto && firstPhoto.type.startsWith("image/")) {
        try {
          firstPhotoData = await readAsDataUrl(firstPhoto);
        } catch {
          // preview is optional
        }
      }

      // Read the optional headshot/logo as a data URL so it can ride along to
      // the blog form via sessionStorage.
      const headshotFile = Array.isArray(values.headshot_or_logo)
        ? (values.headshot_or_logo as File[])[0]
        : undefined;
      let headshotDataUrl: string | undefined;
      if (headshotFile && headshotFile.type.startsWith("image/")) {
        try {
          const read = await readAsDataUrl(headshotFile);
          headshotDataUrl = read.dataUrl;
        } catch {
          // optional
        }
      }

      const onboardingContext = deriveOnboardingContext(
        serializableValues(values),
        json.vendorProfile,
        headshotDataUrl,
      );

      setSubmitted({
        vendorProfile: json.vendorProfile,
        submissionId: json.id,
        firstPhoto: firstPhotoData,
        onboardingContext,
      });
      try {
        sessionStorage.removeItem(DRAFT_SESSION_KEY);
      } catch {
        // ignore
      }
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <div style={{ ...pageWrap, alignItems: "center" }}>
        <div style={loadingText}>loading…</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <VendorSubmittedView
        vendorProfile={submitted.vendorProfile}
        firstPhoto={submitted.firstPhoto}
        submissionId={submitted.submissionId}
        onboardingContext={submitted.onboardingContext}
      />
    );
  }

  const estimatedMinutes = category?.estimatedMinutes ?? 4;

  return (
    <div style={pageWrap}>
      <div style={pageInner}>
        <header style={brandHeader}>
          <span style={brandThe}>The </span>
          <span style={brandMari}>Marigold</span>
        </header>

        <div style={titleBlock}>
          <h1 style={formTitle}>
            Submit your <i>vendor</i> profile
          </h1>
          <p style={formDescription}>
            Tell us about your work — quick, friendly, no government-form
            energy. We'll use this to feature you to the South Asian couples
            who already love The Marigold.
          </p>
          <p style={timeEstimate}>
            Takes about {estimatedMinutes} minute{estimatedMinutes === 1 ? "" : "s"}
          </p>
        </div>

        {/* Honeypot */}
        <div style={honeypotStyle} aria-hidden="true">
          <label>
            Company (leave blank)
            <input
              ref={honeypotRef}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              name="_company"
            />
          </label>
        </div>

        <section style={sectionCard}>
          <SectionHeader
            kicker="Tell us about your work"
            title="The basics"
            subtitle="Just a few quick things so we know who you are."
          />
          <div style={fieldStack}>
            {UNIVERSAL_OPENING_FIELDS.filter(isVisible).map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                value={values[field.id]}
                error={errors[field.id]}
                onChange={(v) => setFieldValue(field.id, v)}
                category={category}
              />
            ))}
          </div>
        </section>

        <div
          ref={categorySectionRef}
          id={CATEGORY_SECTION_ID}
          style={{
            ...slideWrap,
            ...(categoryId ? slideOpen : slideClosed),
          }}
        >
          {category && (
            <section style={sectionCard}>
              <SectionHeader
                kicker="A few specifics"
                title={`A few things couples always want to know about ${categoryHeadingLabel(category)}`}
                handwritten
              />
              <div style={fieldStack}>
                {categoryFields.filter(isVisible).map((field) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    value={values[field.id]}
                    error={errors[field.id]}
                    onChange={(v) => setFieldValue(field.id, v)}
                    category={category}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <div
          style={{
            ...slideWrap,
            ...(categoryId ? slideOpen : slideClosed),
          }}
        >
          {categoryId && (
            <section style={sectionCard}>
              <SectionHeader
                kicker="Show us your best"
                title="Photos & finishing touches"
                subtitle="A few photos go a long way — couples reach out to vendors whose work they can already picture at their wedding."
              />
              <div style={fieldStack}>
                {UNIVERSAL_CLOSING_FIELDS.filter(isVisible).map((field) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    value={values[field.id]}
                    error={errors[field.id]}
                    onChange={(v) => setFieldValue(field.id, v)}
                    category={category}
                  />
                ))}
              </div>

              {globalError && <div style={errorBanner}>{globalError}</div>}

              {draftLink && (
                <div style={draftLinkPanel}>
                  <div style={draftLinkLabel}>Your resume link</div>
                  <input
                    readOnly
                    value={draftLink}
                    onFocus={(e) => e.currentTarget.select()}
                    style={draftLinkInput}
                  />
                  <div style={draftLinkHelp}>
                    Bookmark this URL or email it to yourself. Photos won't be
                    saved across sessions — you'll need to re-pick them when
                    you come back.
                  </div>
                </div>
              )}

              <div style={actionsRow}>
                <button
                  type="button"
                  onClick={onSaveDraft}
                  style={ghostBtn}
                  disabled={savingDraft}
                >
                  {savingDraft ? "Saving…" : "Save & finish later"}
                </button>
                <button
                  type="button"
                  onClick={onSubmit}
                  style={primaryBtn}
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Submit my profile"}
                </button>
              </div>
            </section>
          )}
        </div>

        <p style={footerNote}>
          Your submission goes straight to The Marigold team. We'll reach out
          when we're ready to feature your work.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function categoryHeadingLabel(category: VendorCategory): string {
  if (category.id === "other") return "your craft";
  // For the heading we use a slightly more conversational phrasing.
  switch (category.id) {
    case "wedding-planner":
      return "wedding planning";
    case "makeup-hair":
      return "bridal beauty";
    case "decorator-floral":
      return "décor & florals";
    case "horse-baraat":
      return "baraat horses";
    case "puja-supplies":
      return "puja supplies";
    case "henna-entertainment":
      return "event entertainment";
    case "coffee-chai":
      return "your cart";
    case "photo-booth":
      return "your booth";
    default:
      return category.label.toLowerCase();
  }
}

function SectionHeader({
  kicker,
  title,
  subtitle,
  handwritten,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  handwritten?: boolean;
}) {
  return (
    <div style={sectionHeaderWrap}>
      {kicker && <div style={sectionKicker}>{kicker}</div>}
      <h2 style={handwritten ? sectionTitleHandwritten : sectionTitle}>
        {title}
      </h2>
      {subtitle && <p style={sectionSubtitle}>{subtitle}</p>}
    </div>
  );
}

interface FieldRowProps {
  field: VendorField;
  value: FieldValue | undefined;
  error?: string;
  onChange: (v: FieldValue) => void;
  category?: VendorCategory;
}

function handleFieldFocus(e: FocusEvent<HTMLElement>) {
  const target = e.currentTarget;
  // Only scroll when the field is actually obscured — otherwise the page
  // jiggles on every dropdown open. The 240ms delay gives a mobile
  // keyboard time to slide up; we measure after that to see if it
  // actually covered the field.
  window.setTimeout(() => {
    if (!target.isConnected) return;
    const rect = target.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const margin = 80;
    const obscured = rect.top < margin || rect.bottom > viewportHeight - margin;
    if (!obscured) return;
    target.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, 240);
}

function FieldRow({ field, value, error, onChange, category }: FieldRowProps) {
  const helpText =
    field.helpTextByCategory && category
      ? field.helpTextByCategory[category.id] ?? field.helpText
      : field.helpText;

  return (
    <div id={`field-${field.id}`} style={fieldRow}>
      <label style={fieldLabelRow}>
        <span style={fieldLabel}>
          {field.label}
          {field.required && <span style={requiredStar}> *</span>}
        </span>
        {(field.type === "text" || field.type === "textarea") &&
          typeof value === "string" &&
          field.maxLength && (
            <span style={charCount}>
              {value.length}/{field.maxLength}
            </span>
          )}
      </label>

      <FieldInput field={field} value={value} onChange={onChange} />

      {helpText && <div style={helpStyle}>{helpText}</div>}
      {error && <div style={errorStyle}>{error}</div>}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: VendorField;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
}) {
  switch (field.type) {
    case "text":
    case "email":
    case "url": {
      const v = (value as string) ?? "";
      if (field.prefix) {
        return (
          <div style={inputWithPrefixWrap}>
            <span style={inputPrefix}>{field.prefix}</span>
            <input
              type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
              inputMode={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
              value={v}
              placeholder={field.placeholder}
              onChange={(e) =>
                onChange(e.target.value.slice(0, field.maxLength ?? 5000))
              }
              onFocus={handleFieldFocus}
              style={inputWithPrefix}
            />
          </div>
        );
      }
      return (
        <input
          type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
          inputMode={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
          value={v}
          placeholder={field.placeholder}
          onChange={(e) =>
            onChange(e.target.value.slice(0, field.maxLength ?? 5000))
          }
          onFocus={handleFieldFocus}
          style={inputStyle}
        />
      );
    }
    case "textarea": {
      const v = (value as string) ?? "";
      return (
        <textarea
          value={v}
          placeholder={field.placeholder}
          rows={4}
          onChange={(e) =>
            onChange(e.target.value.slice(0, field.maxLength ?? 50000))
          }
          onFocus={handleFieldFocus}
          style={textareaStyle}
        />
      );
    }
    case "select": {
      // Special-case the category dropdown — it gets the searchable combobox.
      if (field.id === "category") {
        return (
          <CategoryCombobox
            value={(value as string) ?? ""}
            onChange={(v) => onChange(v)}
          />
        );
      }
      if (field.id === "niche") {
        return (
          <NicheCombobox
            value={(value as string) ?? ""}
            onChange={(v) => onChange(v)}
          />
        );
      }
      const v = (value as string) ?? "";
      return (
        <div style={selectWrap}>
          <select
            value={v}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFieldFocus}
            style={selectStyle}
          >
            <option value="">— Select —</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }
    case "yesno": {
      const v = (value as string) ?? "";
      return (
        <div style={pillRow}>
          {["Yes", "No"].map((opt) => {
            const active = v === opt;
            return (
              <button
                type="button"
                key={opt}
                onClick={() => onChange(active ? "" : opt)}
                style={{
                  ...pillBtn,
                  ...(active ? pillBtnActive : null),
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      );
    }
    case "multi-select": {
      const v = (value as string[]) ?? [];
      return (
        <div style={multiSelectGrid}>
          {(field.options ?? []).map((opt) => {
            const checked = v.includes(opt);
            return (
              <label
                key={opt}
                style={{
                  ...checkboxOption,
                  ...(checked ? checkboxOptionActive : null),
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    onChange(
                      e.target.checked
                        ? [...v, opt]
                        : v.filter((x) => x !== opt),
                    )
                  }
                  style={hiddenInput}
                />
                <span style={checkmark} aria-hidden="true">
                  {checked ? "✓" : ""}
                </span>
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      );
    }
    case "checkbox": {
      const v = Boolean(value);
      return (
        <label
          style={{
            ...checkboxOption,
            ...(v ? checkboxOptionActive : null),
            display: "inline-flex",
          }}
        >
          <input
            type="checkbox"
            checked={v}
            onChange={(e) => onChange(e.target.checked)}
            style={hiddenInput}
          />
          <span style={checkmark} aria-hidden="true">
            {v ? "✓" : ""}
          </span>
          <span>I agree</span>
        </label>
      );
    }
    case "file": {
      return (
        <FileDropzone
          field={field}
          value={(value as File[]) ?? []}
          onChange={onChange}
        />
      );
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Searchable category combobox
// ---------------------------------------------------------------------------

function CategoryCombobox({
  value,
  onChange,
}: {
  value: string; // stores category id
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selected = value ? getCategoryById(value) : undefined;
  const grouped = useMemo(() => groupedVendorCategories(), []);

  // Flat list filtered by the current query; preserves group order so the
  // active-index keyboard arrows match what the user sees.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return VENDOR_CATEGORIES;
    return VENDOR_CATEGORIES.filter((c) =>
      c.label.toLowerCase().includes(q) ||
      c.group.toLowerCase().includes(q),
    );
  }, [query]);

  const filteredGrouped = useMemo(() => {
    if (!query.trim()) return grouped;
    return grouped
      .map((g) => ({
        ...g,
        categories: g.categories.filter((c) => filtered.includes(c)),
      }))
      .filter((g) => g.categories.length > 0);
  }, [filtered, grouped, query]);

  // Close on outside click.
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Reset active index whenever the filtered list changes shape.
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  function selectCategory(c: VendorCategory) {
    onChange(c.id);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      e.preventDefault();
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setActiveIdx((i) => Math.max(i - 1, 0));
      e.preventDefault();
    } else if (e.key === "Enter") {
      const c = filtered[activeIdx];
      if (c) selectCategory(c);
      e.preventDefault();
    } else if (e.key === "Escape") {
      setOpen(false);
      e.preventDefault();
    }
  }

  return (
    <div ref={wrapRef} style={comboboxWrap}>
      <div
        style={{
          ...selectStyle,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: open ? "8px 40px 8px 12px" : "14px 40px 14px 16px",
        }}
        onClick={() => {
          setOpen(true);
          window.setTimeout(() => inputRef.current?.focus(), 30);
        }}
      >
        {open ? (
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder={selected?.label ?? "Search categories — try 'photo'…"}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={comboboxInput}
            autoFocus
          />
        ) : (
          <span style={selected ? comboboxSelected : comboboxPlaceholder}>
            {selected?.label ?? "Pick your craft — type to search"}
          </span>
        )}
      </div>

      {open && (
        <div style={comboboxList} role="listbox">
          {filteredGrouped.length === 0 && (
            <div style={comboboxEmpty}>
              Nothing matches "{query}". Try a broader word, or pick "My
              category isn't listed".
            </div>
          )}
          {filteredGrouped.map((g) => (
            <div key={g.group}>
              <div style={comboboxGroupHeader}>{g.group}</div>
              {g.categories.map((c) => {
                const flatIdx = filtered.indexOf(c);
                const active = flatIdx === activeIdx;
                const isSelected = c.id === value;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => selectCategory(c)}
                    onMouseEnter={() => setActiveIdx(flatIdx)}
                    style={{
                      ...comboboxOption,
                      ...(active ? comboboxOptionActive : null),
                      ...(isSelected ? comboboxOptionSelected : null),
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Niche combobox — shown when the vendor picks "My category isn't listed".
// Mirrors CategoryCombobox but loads MICRO_CATEGORIES and appends the
// NICHE_OTHER_SENTINEL row as a fallback for vendors whose niche isn't
// in the list.
// ---------------------------------------------------------------------------

function NicheCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Flat list (with group ordering preserved) plus the sentinel at the
  // bottom — so arrow-key navigation matches the rendered order.
  const flat = useMemo(() => {
    const all: { group: string; option: string }[] = [];
    for (const g of MICRO_CATEGORIES) {
      for (const opt of g.options) all.push({ group: g.group, option: opt });
    }
    all.push({ group: "Still not here?", option: NICHE_OTHER_SENTINEL });
    return all;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flat;
    return flat.filter(
      (row) =>
        row.option.toLowerCase().includes(q) ||
        row.group.toLowerCase().includes(q),
    );
  }, [flat, query]);

  const filteredGrouped = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const row of filtered) {
      const list = map.get(row.group) ?? [];
      list.push(row.option);
      map.set(row.group, list);
    }
    return Array.from(map.entries()).map(([group, options]) => ({
      group,
      options,
    }));
  }, [filtered]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  function selectOption(option: string) {
    onChange(option);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      e.preventDefault();
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setActiveIdx((i) => Math.max(i - 1, 0));
      e.preventDefault();
    } else if (e.key === "Enter") {
      const row = filtered[activeIdx];
      if (row) selectOption(row.option);
      e.preventDefault();
    } else if (e.key === "Escape") {
      setOpen(false);
      e.preventDefault();
    }
  }

  return (
    <div ref={wrapRef} style={comboboxWrap}>
      <div
        style={{
          ...selectStyle,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          padding: open ? "8px 40px 8px 12px" : "14px 40px 14px 16px",
        }}
        onClick={() => {
          setOpen(true);
          window.setTimeout(() => inputRef.current?.focus(), 30);
        }}
      >
        {open ? (
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder={value || "Search niches — try 'cart' or 'magician'…"}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={comboboxInput}
            autoFocus
          />
        ) : (
          <span style={value ? comboboxSelected : comboboxPlaceholder}>
            {value || "Pick your niche — type to search"}
          </span>
        )}
      </div>

      {open && (
        <div style={comboboxList} role="listbox">
          {filteredGrouped.length === 0 && (
            <div style={comboboxEmpty}>
              Nothing matches "{query}". Try a broader word, or pick "
              {NICHE_OTHER_SENTINEL}".
            </div>
          )}
          {filteredGrouped.map((g) => (
            <div key={g.group}>
              <div style={comboboxGroupHeader}>{g.group}</div>
              {g.options.map((opt) => {
                const flatIdx = filtered.findIndex(
                  (r) => r.group === g.group && r.option === opt,
                );
                const active = flatIdx === activeIdx;
                const isSelected = opt === value;
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => selectOption(opt)}
                    onMouseEnter={() => setActiveIdx(flatIdx)}
                    style={{
                      ...comboboxOption,
                      ...(active ? comboboxOptionActive : null),
                      ...(isSelected ? comboboxOptionSelected : null),
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// File dropzone — same UX as the venue form, simplified.
// ---------------------------------------------------------------------------

function FileDropzone({
  field,
  value,
  onChange,
}: {
  field: VendorField;
  value: File[];
  onChange: (v: File[]) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [dropError, setDropError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const maxFiles = field.maxFiles ?? 1;
  const maxBytes = (field.maxFileSize ?? 10) * 1024 * 1024;
  const accepted = field.acceptedTypes ?? ["image/"];
  const totalBytes = value.reduce((sum, f) => sum + f.size, 0);

  function isAcceptedFile(file: File): boolean {
    if (accepted.some((p) => file.type.startsWith(p))) return true;
    const lower = file.name.toLowerCase();
    if (
      accepted.some((p) => p.startsWith("image/")) &&
      (lower.endsWith(".heic") || lower.endsWith(".heif"))
    ) {
      return true;
    }
    return false;
  }

  function addFiles(incoming: FileList | File[]) {
    setDropError("");
    const next: File[] = [...value];
    for (const file of Array.from(incoming)) {
      if (next.length >= maxFiles) {
        setDropError(`Max ${maxFiles} file${maxFiles === 1 ? "" : "s"} allowed.`);
        break;
      }
      if (!isAcceptedFile(file)) {
        setDropError(`"${file.name}" isn't an accepted file type.`);
        continue;
      }
      if (file.size > maxBytes) {
        setDropError(`"${file.name}" exceeds ${field.maxFileSize ?? 10}MB.`);
        continue;
      }
      next.push(file);
    }
    onChange(next);
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }

  function handlePick(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  }

  function removeFile(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div
        style={{
          ...dropzoneStyle,
          ...(dragOver ? dropzoneActive : null),
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div style={dropzoneIcon}>↑</div>
        <div style={dropzoneText}>
          Drop photos here or <u>tap to browse</u>
        </div>
        <div style={dropzoneSub}>
          Images · up to {field.maxFileSize ?? 10}MB each · max {maxFiles}{" "}
          file{maxFiles === 1 ? "" : "s"}
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={`${accepted.join(",")},.heic,.heif`}
          onChange={handlePick}
          style={{ display: "none" }}
        />
      </div>
      {dropError && <div style={errorStyle}>{dropError}</div>}
      {value.length > 0 && (
        <>
          <div style={fileSummaryRow}>
            {value.length} {value.length === 1 ? "file" : "files"} ·{" "}
            {formatBytes(totalBytes)}
          </div>
          <div style={fileGrid}>
            {value.map((file, idx) => (
              <FilePreview
                key={`${file.name}-${idx}`}
                file={file}
                onRemove={() => removeFile(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    if (file.type.startsWith("image/")) {
      const u = URL.createObjectURL(file);
      setUrl(u);
      return () => URL.revokeObjectURL(u);
    }
  }, [file]);

  return (
    <div style={filePreview}>
      <div style={fileThumbWrap}>
        {url ? (
          <img src={url} alt={file.name} style={fileThumb} />
        ) : (
          <div style={fileIcon}>📄</div>
        )}
        <button
          type="button"
          onClick={onRemove}
          style={removeBtn}
          aria-label="Remove file"
        >
          ×
        </button>
      </div>
      <div style={fileName}>{file.name}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initialValues(): Record<string, FieldValue> {
  const v: Record<string, FieldValue> = {};
  for (const field of getAllVendorFields()) {
    if (field.type === "multi-select") v[field.id] = [];
    else if (field.type === "file") v[field.id] = [];
    else if (field.type === "checkbox") v[field.id] = false;
    else v[field.id] = "";
  }
  return v;
}

function serializableValues(
  values: Record<string, FieldValue>,
): Record<string, string | string[] | boolean> {
  const out: Record<string, string | string[] | boolean> = {};
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string" || typeof value === "boolean") {
      out[key] = value;
    } else if (Array.isArray(value)) {
      const stringsOnly = value.every((v) => typeof v === "string");
      if (stringsOnly) out[key] = value as string[];
    }
  }
  return out;
}

function sanitiseDraft(
  draft: Record<string, unknown>,
): Record<string, FieldValue> {
  const out: Record<string, FieldValue> = {};
  for (const field of getAllVendorFields()) {
    const v = draft[field.id];
    if (v === undefined) continue;
    if (field.type === "multi-select" && Array.isArray(v)) {
      out[field.id] = v.filter((x) => typeof x === "string") as string[];
    } else if (field.type === "checkbox" && typeof v === "boolean") {
      out[field.id] = v;
    } else if (
      (field.type === "text" ||
        field.type === "textarea" ||
        field.type === "email" ||
        field.type === "url" ||
        field.type === "select" ||
        field.type === "yesno") &&
      typeof v === "string"
    ) {
      out[field.id] = v;
    }
  }
  return out;
}

function readAsDataUrl(
  file: File,
): Promise<{ name: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve({ name: file.name, dataUrl: result });
      } else {
        reject(new Error("Unexpected reader result"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("read error"));
    reader.readAsDataURL(file);
  });
}

// We expose this so the route handler can re-derive the same lookup if it
// needs to (kept here so the form file is the single source of truth for
// label-to-id translation that the dropdown uses).
export function vendorCategoryLookup(label: string): string | undefined {
  return getCategoryByLabel(label)?.id;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const pageWrap: CSSProperties = {
  minHeight: "100vh",
  background: "var(--cream)",
  display: "flex",
  justifyContent: "center",
  padding: "40px 20px 80px",
};

const pageInner: CSSProperties = {
  width: "100%",
  maxWidth: 720,
};

const loadingText: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 28,
  color: "var(--mauve)",
};

const brandHeader: CSSProperties = {
  textAlign: "center",
  marginBottom: 24,
};

const brandThe: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontWeight: 400,
  fontSize: 16,
  color: "var(--mauve)",
  letterSpacing: 0.5,
};

const brandMari: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontStyle: "italic",
  fontSize: 26,
  color: "var(--wine)",
};

const titleBlock: CSSProperties = {
  textAlign: "center",
  marginBottom: 28,
};

const formTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 48,
  color: "var(--wine)",
  margin: 0,
  lineHeight: 1.05,
};

const formDescription: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 15,
  color: "var(--mauve)",
  lineHeight: 1.6,
  marginTop: 14,
  maxWidth: 560,
  marginLeft: "auto",
  marginRight: "auto",
};

const timeEstimate: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 22,
  color: "var(--deep-pink)",
  marginTop: 8,
};

const sectionCard: CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  padding: 28,
  boxShadow: "0 12px 32px rgba(75,21,40,0.07)",
  border: "1px solid rgba(75,21,40,0.06)",
  marginBottom: 18,
};

const sectionHeaderWrap: CSSProperties = {
  marginBottom: 22,
};

const sectionKicker: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 2.5,
  textTransform: "uppercase",
  color: "var(--deep-pink)",
  marginBottom: 6,
};

const sectionTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontStyle: "italic",
  fontSize: 30,
  color: "var(--wine)",
  margin: 0,
  lineHeight: 1.15,
};

const sectionTitleHandwritten: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 32,
  color: "var(--wine)",
  margin: 0,
  lineHeight: 1.15,
  fontWeight: 600,
};

const sectionSubtitle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve)",
  lineHeight: 1.65,
  margin: "10px 0 0",
};

const slideWrap: CSSProperties = {
  overflow: "hidden",
  transition:
    "max-height 0.45s ease, opacity 0.4s ease, transform 0.45s ease, margin 0.4s ease",
};

const slideClosed: CSSProperties = {
  maxHeight: 0,
  opacity: 0,
  transform: "translateY(-8px)",
  marginTop: 0,
  marginBottom: 0,
  pointerEvents: "none",
};

const slideOpen: CSSProperties = {
  maxHeight: 6000,
  opacity: 1,
  transform: "translateY(0)",
  marginTop: 4,
  marginBottom: 0,
  pointerEvents: "auto",
};

const fieldStack: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 22,
};

const fieldRow: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const fieldLabelRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 12,
};

const fieldLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--wine)",
  lineHeight: 1.4,
};

const requiredStar: CSSProperties = {
  color: "var(--deep-pink)",
};

const charCount: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  color: "var(--mauve)",
};

const inputStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 16,
  padding: "14px 16px",
  background: "var(--cream)",
  border: "1.5px solid rgba(75,21,40,0.15)",
  borderRadius: 8,
  color: "var(--wine)",
  outline: "none",
  width: "100%",
  minHeight: 48,
  transition: "border-color 0.15s ease",
};

const inputWithPrefixWrap: CSSProperties = {
  display: "flex",
  alignItems: "center",
  background: "var(--cream)",
  border: "1.5px solid rgba(75,21,40,0.15)",
  borderRadius: 8,
  paddingLeft: 14,
  minHeight: 48,
};

const inputPrefix: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 16,
  color: "var(--mauve)",
  marginRight: 4,
};

const inputWithPrefix: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 16,
  padding: "14px 12px 14px 0",
  background: "transparent",
  border: "none",
  color: "var(--wine)",
  outline: "none",
  width: "100%",
  minHeight: 48,
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  lineHeight: 1.6,
  minHeight: 100,
};

const selectWrap: CSSProperties = {
  position: "relative",
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  appearance: "none",
  paddingRight: 40,
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'><path fill='%239C2647' d='M3 5l4 4 4-4'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
  cursor: "pointer",
};

const helpStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--mauve)",
  fontStyle: "italic",
  lineHeight: 1.5,
};

const errorStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--deep-pink)",
  fontWeight: 500,
};

const errorBanner: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  padding: "12px 16px",
  background: "rgba(193,56,95,0.1)",
  color: "var(--deep-pink)",
  borderRadius: 8,
  border: "1px solid rgba(193,56,95,0.3)",
  marginTop: 16,
};

const honeypotStyle: CSSProperties = {
  position: "absolute",
  left: -10000,
  top: "auto",
  width: 1,
  height: 1,
  overflow: "hidden",
};

const pillRow: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const pillBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  padding: "12px 28px",
  minWidth: 110,
  background: "var(--cream)",
  border: "1.5px solid rgba(75,21,40,0.15)",
  borderRadius: 999,
  color: "var(--wine)",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const pillBtnActive: CSSProperties = {
  background: "var(--wine)",
  border: "1.5px solid var(--wine)",
  color: "var(--cream)",
};

const multiSelectGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: 8,
};

const checkboxOption: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "14px 16px",
  minHeight: 48,
  background: "var(--cream)",
  border: "1.5px solid rgba(75,21,40,0.15)",
  borderRadius: 8,
  cursor: "pointer",
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--wine)",
  transition: "all 0.15s ease",
};

const checkboxOptionActive: CSSProperties = {
  background: "var(--blush)",
  border: "1.5px solid var(--deep-pink)",
};

const hiddenInput: CSSProperties = {
  position: "absolute",
  opacity: 0,
  pointerEvents: "none",
  width: 0,
  height: 0,
};

const checkmark: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 20,
  height: 20,
  borderRadius: 4,
  background: "white",
  border: "1.5px solid var(--deep-pink)",
  color: "var(--deep-pink)",
  fontWeight: 800,
  fontSize: 12,
  flexShrink: 0,
};

const dropzoneStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "32px 24px",
  background: "var(--cream)",
  border: "2px dashed rgba(75,21,40,0.25)",
  borderRadius: 12,
  cursor: "pointer",
  textAlign: "center",
  transition: "all 0.15s ease",
};

const dropzoneActive: CSSProperties = {
  border: "2px dashed var(--deep-pink)",
  background: "var(--blush)",
};

const dropzoneIcon: CSSProperties = {
  fontSize: 24,
  color: "var(--deep-pink)",
  fontWeight: 700,
  lineHeight: 1,
};

const dropzoneText: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--wine)",
};

const dropzoneSub: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
};

const fileSummaryRow: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--mauve)",
  marginTop: 12,
};

const fileGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
  gap: 12,
  marginTop: 12,
};

const filePreview: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const fileThumbWrap: CSSProperties = {
  position: "relative",
  aspectRatio: "1 / 1",
  background: "white",
  borderRadius: 8,
  overflow: "hidden",
  border: "1px solid rgba(75,21,40,0.12)",
};

const fileThumb: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const fileIcon: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  color: "var(--mauve)",
};

const removeBtn: CSSProperties = {
  position: "absolute",
  top: 4,
  right: 4,
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  fontSize: 14,
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const fileName: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  color: "var(--mauve)",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const draftLinkPanel: CSSProperties = {
  marginTop: 20,
  padding: "16px 18px",
  background: "var(--gold-light)",
  border: "1px solid rgba(212,168,83,0.4)",
  borderRadius: 10,
};

const draftLinkLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: "var(--wine)",
  marginBottom: 8,
};

const draftLinkInput: CSSProperties = {
  ...inputStyle,
  background: "white",
  fontSize: 13,
};

const draftLinkHelp: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
  fontStyle: "italic",
  marginTop: 8,
};

const actionsRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 28,
  alignItems: "center",
  justifyContent: "space-between",
};

const primaryBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 13,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2.5,
  padding: "16px 28px",
  minHeight: 52,
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  boxShadow: "4px 4px 0 var(--gold)",
};

const ghostBtn: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  padding: "12px 16px",
  background: "transparent",
  color: "var(--deep-pink)",
  border: "none",
  textDecoration: "underline",
  cursor: "pointer",
};

const footerNote: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
  textAlign: "center",
  margin: "20px 0 0",
  fontStyle: "italic",
};

// Combobox styles
const comboboxWrap: CSSProperties = {
  position: "relative",
};

const comboboxInput: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 16,
  padding: "12px 4px",
  background: "transparent",
  border: "none",
  color: "var(--wine)",
  outline: "none",
  width: "100%",
  minHeight: 40,
};

const comboboxSelected: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 16,
  color: "var(--wine)",
};

const comboboxPlaceholder: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 16,
  color: "var(--mauve)",
};

const comboboxList: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  right: 0,
  background: "white",
  borderRadius: 10,
  border: "1px solid rgba(75,21,40,0.15)",
  boxShadow: "0 12px 32px rgba(75,21,40,0.12)",
  maxHeight: 320,
  overflowY: "auto",
  zIndex: 50,
  padding: "6px 0",
};

const comboboxGroupHeader: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--mauve)",
  padding: "10px 16px 4px",
};

const comboboxOption: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 15,
  padding: "10px 16px",
  background: "transparent",
  color: "var(--wine)",
  border: "none",
  cursor: "pointer",
};

const comboboxOptionActive: CSSProperties = {
  background: "var(--blush)",
};

const comboboxOptionSelected: CSSProperties = {
  fontWeight: 700,
  color: "var(--deep-pink)",
};

const comboboxEmpty: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve)",
  padding: "16px 20px",
  fontStyle: "italic",
};
