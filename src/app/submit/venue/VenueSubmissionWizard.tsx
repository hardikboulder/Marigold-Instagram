"use client";

/**
 * Multi-step venue submission wizard at /submit/venue.
 *
 * Flow:
 *   - Step 1-5 collect text + select fields. Step 6 collects photos and a
 *     final summary preview.
 *   - Each "Next" tap validates only the visible fields in the current step.
 *   - Form state is persisted to sessionStorage on every change so the
 *     contact's progress is restored if they accidentally navigate away.
 *   - "Save & Finish Later" POSTs the current values to /api/venue/draft
 *     and shows the venue contact a unique resume URL.
 *   - Submitting the final step posts everything (including files) to
 *     /api/submit/venue, which generates the venue profile and tags photos.
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
} from "react";
import {
  VENUE_FORM_STEPS,
  type VenueField,
  type VenueStep,
} from "./venue-form-schema";
import { VenueSubmittedView } from "./VenueSubmittedView";

interface Props {
  draftToken?: string;
}

type FieldValue = string | string[] | File[] | boolean;

const DRAFT_SESSION_KEY = "marigold-venue-draft";

export function VenueSubmissionWizard({ draftToken }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, FieldValue>>(() =>
    initialValues(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftLink, setDraftLink] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState("");
  const [submitted, setSubmitted] = useState<{
    venueProfile: VenueProfile;
    submissionId: string;
    firstPhoto?: { name: string; dataUrl: string };
  } | null>(null);
  const honeypotRef = useRef<HTMLInputElement | null>(null);

  // Hydrate from sessionStorage and (if present) the resume token.
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
            `/api/venue/draft?token=${encodeURIComponent(draftToken)}`,
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

  const currentStep: VenueStep = VENUE_FORM_STEPS[stepIndex];
  const isFinalStep = stepIndex === VENUE_FORM_STEPS.length - 1;
  const visibleFields = useMemo(
    () => currentStep.fields.filter((f) => isFieldVisible(f, values)),
    [currentStep, values],
  );

  function setFieldValue(id: string, next: FieldValue) {
    setValues((v) => ({ ...v, [id]: next }));
    if (errors[id]) {
      setErrors((e) => {
        const { [id]: _drop, ...rest } = e;
        return rest;
      });
    }
  }

  function validateStep(step: VenueStep): Record<string, string> {
    const errs: Record<string, string> = {};
    for (const field of step.fields) {
      if (!isFieldVisible(field, values)) continue;
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

  function goToStep(nextIndex: number) {
    setErrors({});
    setStepIndex(nextIndex);
    // Scroll to top so the new step's header is visible on mobile.
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function onNext() {
    const errs = validateStep(currentStep);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0];
      const node = document.getElementById(`field-${firstKey}`);
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (stepIndex < VENUE_FORM_STEPS.length - 1) {
      goToStep(stepIndex + 1);
    }
  }

  function onBack() {
    if (stepIndex > 0) goToStep(stepIndex - 1);
  }

  async function onSaveDraft() {
    if (savingDraft) return;
    setSavingDraft(true);
    setDraftLink(null);
    try {
      const res = await fetch("/api/venue/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: draftToken,
          values: serializableValues(values),
          stepIndex,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Couldn't save your draft.");
      }
      const url = `${window.location.origin}/submit/venue?draft=${json.token}`;
      setDraftLink(url);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Couldn't save your draft.");
    } finally {
      setSavingDraft(false);
    }
  }

  async function onSubmit() {
    if (submitting) return;
    // Validate every step on final submit so we don't accept a partial form
    // even if the venue contact navigated past required fields.
    const allErrs: Record<string, string> = {};
    for (const step of VENUE_FORM_STEPS) {
      Object.assign(allErrs, validateStep(step));
    }
    setErrors(allErrs);
    if (Object.keys(allErrs).length > 0) {
      // Jump to the first step that contains an error.
      const firstId = Object.keys(allErrs)[0];
      const stepWithError = VENUE_FORM_STEPS.findIndex((s) =>
        s.fields.some((f) => f.id === firstId),
      );
      if (stepWithError >= 0 && stepWithError !== stepIndex) {
        goToStep(stepWithError);
        return;
      }
      setGlobalError("Please fix the highlighted fields before submitting.");
      return;
    }

    setSubmitting(true);
    setGlobalError("");
    try {
      const fd = new FormData();
      fd.append("_company", honeypotRef.current?.value ?? "");
      fd.append("_draft_token", draftToken ?? "");

      for (const step of VENUE_FORM_STEPS) {
        for (const field of step.fields) {
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
      }

      const res = await fetch("/api/submit/venue", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Submission failed (${res.status}).`);
      }

      // Capture a thumbnail from the first uploaded photo for the preview card.
      const firstPhoto = Array.isArray(values.venue_photos)
        ? (values.venue_photos as File[])[0]
        : undefined;
      let firstPhotoData: { name: string; dataUrl: string } | undefined;
      if (firstPhoto && firstPhoto.type.startsWith("image/")) {
        try {
          firstPhotoData = await readAsDataUrl(firstPhoto);
        } catch {
          // Preview is optional — fall through with no thumbnail.
        }
      }

      setSubmitted({
        venueProfile: json.venueProfile,
        submissionId: json.id,
        firstPhoto: firstPhotoData,
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
      <VenueSubmittedView
        venueProfile={submitted.venueProfile}
        firstPhoto={submitted.firstPhoto}
      />
    );
  }

  return (
    <div style={pageWrap}>
      <div style={pageInner}>
        <header style={brandHeader}>
          <span style={brandThe}>The </span>
          <span style={brandMari}>Marigold</span>
        </header>

        <div style={titleBlock}>
          <h1 style={formTitle}>
            Submit your <i>venue</i>
          </h1>
          <p style={formDescription}>
            The most useful venue intake form in the South Asian wedding space —
            so brides can evaluate your venue without making a phone call first.
          </p>
          <p style={timeEstimate}>Takes about 8–10 minutes</p>
        </div>

        <ProgressBar
          currentStep={currentStep.number}
          totalSteps={currentStep.totalSteps}
          stepTitle={currentStep.title}
        />

        <section style={stepCard}>
          <h2 style={stepTitleStyle}>{currentStep.title}</h2>
          {currentStep.subtitle && (
            <p style={stepSubtitle}>{currentStep.subtitle}</p>
          )}

          {/* Honeypot — visually hidden but crawlable. */}
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

          <div style={fieldStack}>
            {visibleFields.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                value={values[field.id]}
                error={errors[field.id]}
                onChange={(v) => setFieldValue(field.id, v)}
              />
            ))}
          </div>

          {isFinalStep && <SummaryPanel values={values} />}

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
                Bookmark this URL or email it to yourself. Your progress is
                saved — open it any time to keep going.
              </div>
            </div>
          )}

          <div style={actionsRow}>
            <button
              type="button"
              onClick={onBack}
              style={{
                ...secondaryBtn,
                visibility: stepIndex === 0 ? "hidden" : "visible",
              }}
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={onSaveDraft}
              style={ghostBtn}
              disabled={savingDraft}
            >
              {savingDraft ? "Saving…" : "Save & finish later"}
            </button>

            {isFinalStep ? (
              <button
                type="button"
                onClick={onSubmit}
                style={primaryBtn}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit venue"}
              </button>
            ) : (
              <button type="button" onClick={onNext} style={primaryBtn}>
                Next →
              </button>
            )}
          </div>
        </section>

        <p style={footerNote}>
          Your submission goes straight to The Marigold team. We'll reach out
          when we're ready to feature your venue.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProgressBar({
  currentStep,
  totalSteps,
  stepTitle,
}: {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
}) {
  const pct = Math.round((currentStep / totalSteps) * 100);
  return (
    <div style={progressWrap}>
      <div style={progressMeta}>
        <span style={progressStep}>
          Step {currentStep} of {totalSteps}
        </span>
        <span style={progressTitle}>{stepTitle}</span>
      </div>
      <div style={progressTrack}>
        <div style={{ ...progressFill, width: `${pct}%` }} />
      </div>
    </div>
  );
}

interface FieldRowProps {
  field: VenueField;
  value: FieldValue | undefined;
  error?: string;
  onChange: (v: FieldValue) => void;
}

function handleFieldFocus(e: FocusEvent<HTMLElement>) {
  const target = e.currentTarget;
  window.setTimeout(() => {
    target.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, 240);
}

function FieldRow({ field, value, error, onChange }: FieldRowProps) {
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

      {field.helpText && <div style={helpStyle}>{field.helpText}</div>}
      {error && <div style={errorStyle}>{error}</div>}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: VenueField;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
}) {
  switch (field.type) {
    case "text":
    case "email":
    case "url": {
      const v = (value as string) ?? "";
      return (
        <input
          type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
          inputMode={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
          value={v}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value.slice(0, field.maxLength ?? 5000))}
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
    case "number": {
      const v = (value as string) ?? "";
      return (
        <input
          type="number"
          inputMode="numeric"
          value={v}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFieldFocus}
          style={inputStyle}
        />
      );
    }
    case "select": {
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

function FileDropzone({
  field,
  value,
  onChange,
}: {
  field: VenueField;
  value: File[];
  onChange: (v: File[]) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
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
    setError("");
    const next: File[] = [...value];
    for (const file of Array.from(incoming)) {
      if (next.length >= maxFiles) {
        setError(`Max ${maxFiles} file${maxFiles === 1 ? "" : "s"} allowed.`);
        break;
      }
      if (!isAcceptedFile(file)) {
        setError(`"${file.name}" isn't an accepted file type.`);
        continue;
      }
      if (file.size > maxBytes) {
        setError(`"${file.name}" exceeds ${field.maxFileSize ?? 10}MB.`);
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
          Drop photos here or <u>click to browse</u>
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
      {error && <div style={errorStyle}>{error}</div>}
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

function SummaryPanel({ values }: { values: Record<string, FieldValue> }) {
  return (
    <div style={summaryPanel}>
      <div style={summaryHeader}>Review your submission</div>
      <div style={summarySub}>
        Take a final pass before submitting — once you submit, we'll review
        and reach out.
      </div>
      <div style={summaryGrid}>
        {VENUE_FORM_STEPS.map((step) => (
          <div key={step.id} style={summaryStepBlock}>
            <div style={summaryStepTitle}>
              {step.number}. {step.title}
            </div>
            <dl style={summaryDl}>
              {step.fields
                .filter((f) => isFieldVisible(f, values))
                .map((field) => {
                  const v = values[field.id];
                  const display = displayValue(v, field);
                  if (!display) return null;
                  return (
                    <div key={field.id} style={summaryRow}>
                      <dt style={summaryDt}>{field.label}</dt>
                      <dd style={summaryDd}>{display}</dd>
                    </div>
                  );
                })}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initialValues(): Record<string, FieldValue> {
  const v: Record<string, FieldValue> = {};
  for (const step of VENUE_FORM_STEPS) {
    for (const field of step.fields) {
      if (field.type === "multi-select") v[field.id] = [];
      else if (field.type === "file") v[field.id] = [];
      else if (field.type === "checkbox") v[field.id] = false;
      else v[field.id] = "";
    }
  }
  return v;
}

function isFieldVisible(
  field: VenueField,
  values: Record<string, FieldValue>,
): boolean {
  if (!field.showIf) return true;
  const target = values[field.showIf.fieldId];
  if (field.showIf.isYes) {
    return target === "Yes";
  }
  if (field.showIf.equals) {
    return (
      typeof target === "string" && field.showIf.equals.includes(target)
    );
  }
  return true;
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
  for (const step of VENUE_FORM_STEPS) {
    for (const field of step.fields) {
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
          field.type === "number" ||
          field.type === "select" ||
          field.type === "yesno") &&
        typeof v === "string"
      ) {
        out[field.id] = v;
      }
    }
  }
  return out;
}

function displayValue(v: FieldValue | undefined, field: VenueField): string {
  if (v === undefined) return "";
  if (field.type === "checkbox") return v ? "Yes" : "";
  if (field.type === "file" && Array.isArray(v)) {
    return v.length > 0 ? `${v.length} file${v.length === 1 ? "" : "s"} attached` : "";
  }
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
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

// Shape returned by /api/submit/venue. Kept in sync with the route.
export interface VenueProfile {
  venueType: string;
  venueName: string;
  venueLocation: string;
  capacity: number;
  bestFor: string;
  startingPriceText?: string;
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

const progressWrap: CSSProperties = {
  marginBottom: 16,
};

const progressMeta: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: 8,
};

const progressStep: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--wine)",
};

const progressTitle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--mauve)",
};

const progressTrack: CSSProperties = {
  height: 6,
  background: "rgba(75,21,40,0.08)",
  borderRadius: 999,
  overflow: "hidden",
};

const progressFill: CSSProperties = {
  height: "100%",
  background:
    "linear-gradient(90deg, var(--gold) 0%, var(--deep-pink) 100%)",
  borderRadius: 999,
  transition: "width 0.25s ease",
};

const stepCard: CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  padding: 28,
  boxShadow: "0 12px 32px rgba(75,21,40,0.07)",
  border: "1px solid rgba(75,21,40,0.06)",
};

const stepTitleStyle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontStyle: "italic",
  fontSize: 32,
  color: "var(--wine)",
  margin: 0,
  lineHeight: 1.15,
};

const stepSubtitle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve)",
  lineHeight: 1.65,
  margin: "10px 0 24px",
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
  borderColor: "var(--wine)",
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
  borderColor: "var(--deep-pink)",
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
  borderColor: "var(--deep-pink)",
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

const summaryPanel: CSSProperties = {
  marginTop: 28,
  padding: "20px 22px 8px",
  background: "var(--blush)",
  borderRadius: 12,
  border: "1px solid rgba(193,56,95,0.18)",
};

const summaryHeader: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontStyle: "italic",
  fontSize: 24,
  color: "var(--wine)",
};

const summarySub: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--mauve)",
  margin: "4px 0 18px",
};

const summaryGrid: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const summaryStepBlock: CSSProperties = {
  paddingBottom: 14,
  borderBottom: "1px solid rgba(75,21,40,0.1)",
};

const summaryStepTitle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 2,
  textTransform: "uppercase",
  color: "var(--deep-pink)",
  marginBottom: 8,
};

const summaryDl: CSSProperties = {
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const summaryRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(140px, 38%) 1fr",
  gap: 12,
};

const summaryDt: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
  margin: 0,
};

const summaryDd: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--wine)",
  margin: 0,
  wordBreak: "break-word",
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

const secondaryBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  padding: "14px 22px",
  background: "transparent",
  color: "var(--wine)",
  border: "1.5px solid var(--wine)",
  borderRadius: 10,
  cursor: "pointer",
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
