"use client";

/**
 * Public submission form — rendered at /submit/[formId].
 *
 * `formId` accepts either:
 *   - a custom form id (random string), OR
 *   - a template-type slug like `vendor-portfolio`, `bride-confession`, etc.
 *
 * Slug routes always render — they fall back to the seed defaults when the
 * studio hasn't customized that template type yet (see `getFormById`). The
 * submission record is tagged with whichever id appeared in the URL, so the
 * studio's inbox groups submissions by their public slug.
 *
 * Form state is persisted to sessionStorage on every change so that if a
 * vendor accidentally navigates away or backgrounds the tab, their progress
 * is restored when they come back within the same session.
 */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type DragEvent,
  type FocusEvent,
  type FormEvent,
} from "react";
import type { FormConfig, FormField } from "@/lib/types";
import { getFormById } from "@/lib/db/forms-store";

interface Props {
  formId: string;
}

type FieldValue = string | string[] | File[] | boolean;

const DRAFT_SESSION_KEY_PREFIX = "marigold-form-draft:";

/**
 * Files can't be JSON-serialized, so the session draft only persists
 * primitive values. File inputs reset on reload — but that's the expected
 * behaviour: the OS file picker doesn't surface a previously-picked file
 * after a navigation either.
 */
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

export function PublicSubmissionForm({ formId }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const honeypotRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setHydrated(true);
    const found = getFormById(formId);
    setConfig(found);
    if (found) {
      const initial: Record<string, FieldValue> = {};
      for (const field of found.fields) {
        if (field.enabled === false) continue;
        if (field.type === "multi-select") initial[field.id] = [];
        else if (field.type === "file") initial[field.id] = [];
        else if (field.type === "checkbox") initial[field.id] = false;
        else initial[field.id] = "";
      }

      // Restore from sessionStorage draft if available (within the same tab session).
      try {
        const raw = sessionStorage.getItem(DRAFT_SESSION_KEY_PREFIX + formId);
        if (raw) {
          const draft = JSON.parse(raw) as Record<string, unknown>;
          for (const field of found.fields) {
            if (field.enabled === false) continue;
            const v = draft[field.id];
            if (v === undefined) continue;
            if (field.type === "multi-select" && Array.isArray(v)) {
              initial[field.id] = v.filter((x) => typeof x === "string") as string[];
            } else if (field.type === "checkbox" && typeof v === "boolean") {
              initial[field.id] = v;
            } else if (
              (field.type === "text" ||
                field.type === "textarea" ||
                field.type === "number" ||
                field.type === "select" ||
                field.type === "date" ||
                field.type === "month-year") &&
              typeof v === "string"
            ) {
              initial[field.id] = v;
            }
          }
        }
      } catch {
        // ignore storage errors (private mode, etc.)
      }

      setValues(initial);
    }
  }, [formId]);

  // Persist non-file values whenever they change.
  useEffect(() => {
    if (!hydrated || !config) return;
    try {
      sessionStorage.setItem(
        DRAFT_SESSION_KEY_PREFIX + formId,
        JSON.stringify(serializableValues(values)),
      );
    } catch {
      // storage may be full or disabled — silently skip.
    }
  }, [values, formId, hydrated, config]);

  if (!hydrated) {
    return (
      <div style={loadingShell}>
        <div style={loadingText}>loading…</div>
      </div>
    );
  }

  if (!config) {
    return <NotFound />;
  }

  if (!config.isActive) {
    return <FormClosed title={config.title} />;
  }

  if (submitted) {
    return <ThankYou message={config.thankYouMessage} />;
  }

  const visibleFields = config.fields.filter((f) => f.enabled !== false);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    for (const field of visibleFields) {
      const value = values[field.id];
      const isEmpty =
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0) ||
        (field.type === "checkbox" && value === false);
      if (field.required && isEmpty) {
        errs[field.id] =
          field.type === "checkbox"
            ? "Please confirm to continue."
            : "This field is required.";
      }
      if (
        (field.type === "text" || field.type === "textarea") &&
        typeof value === "string" &&
        field.maxLength &&
        value.length > field.maxLength
      ) {
        errs[field.id] = `Max ${field.maxLength} characters.`;
      }
    }
    return errs;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setGlobalError("");
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0];
      const node = document.getElementById(`field-${firstKey}`);
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!config) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("_form_title", config.title);
      fd.append("_template_type", config.templateType);
      fd.append("_company", honeypotRef.current?.value ?? ""); // honeypot

      for (const field of visibleFields) {
        const value = values[field.id];
        if (field.type === "multi-select" && Array.isArray(value)) {
          for (const v of value as string[]) fd.append(field.id, v);
        } else if (field.type === "file" && Array.isArray(value)) {
          for (const file of value as File[]) {
            fd.append(field.id, file, file.name);
          }
        } else if (field.type === "checkbox") {
          fd.append(field.id, value ? "yes" : "");
        } else {
          fd.append(field.id, String(value ?? ""));
        }
      }

      // Always post to the URL formId — that's the slug the studio inbox groups by.
      const res = await fetch(`/api/submit/${formId}`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Submission failed (${res.status}).`);
      }
      // Clear the draft so a subsequent visit starts fresh.
      try {
        sessionStorage.removeItem(DRAFT_SESSION_KEY_PREFIX + formId);
      } catch {
        // ignore
      }
      setSubmitted(true);
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function setFieldValue(id: string, next: FieldValue) {
    setValues((v) => ({ ...v, [id]: next }));
    if (errors[id]) {
      setErrors((e) => {
        const { [id]: _drop, ...rest } = e;
        return rest;
      });
    }
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
            <i>{config.title}</i>
          </h1>
          {config.description && (
            <p style={formDescription}>{config.description}</p>
          )}
        </div>

        <form onSubmit={onSubmit} style={formStyle} noValidate>
          {/* Honeypot — visually hidden but crawlable. */}
          <div style={honeypotStyle} aria-hidden="true">
            <label>
              Company (leave blank)
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                ref={honeypotRef}
                name="_company"
              />
            </label>
          </div>

          {visibleFields.map((field) => (
            <FieldRow
              key={field.id}
              field={field}
              value={values[field.id]}
              error={errors[field.id]}
              onChange={(v) => setFieldValue(field.id, v)}
            />
          ))}

          {globalError && <div style={errorBanner}>{globalError}</div>}

          <button type="submit" style={submitBtn} disabled={submitting}>
            {submitting ? "Sending…" : "Submit"}
          </button>

          <p style={footerNote}>
            Your submission goes straight to The Marigold team. We'll reach out
            if we feature you.
          </p>
        </form>
      </div>
    </div>
  );
}

interface FieldRowProps {
  field: FormField;
  value: FieldValue | undefined;
  error?: string;
  onChange: (v: FieldValue) => void;
}

function handleFieldFocus(e: FocusEvent<HTMLElement>) {
  // Mobile keyboards obscure the bottom of the screen — scroll the field
  // into view after the keyboard has had a chance to open.
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
  field: FormField;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
}) {
  switch (field.type) {
    case "text": {
      const v = (value as string) ?? "";
      return (
        <input
          type="text"
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
    case "date": {
      const v = (value as string) ?? "";
      return (
        <input
          type="date"
          value={v}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFieldFocus}
          style={inputStyle}
        />
      );
    }
    case "month-year": {
      const v = (value as string) ?? "";
      return (
        <input
          type="month"
          value={v}
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
                  onChange={(e) => {
                    onChange(
                      e.target.checked
                        ? [...v, opt]
                        : v.filter((x) => x !== opt),
                    );
                  }}
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
          <span>Yes</span>
        </label>
      );
    }
    case "file": {
      return <FileDropzone field={field} value={(value as File[]) ?? []} onChange={onChange} />;
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
  field: FormField;
  value: File[];
  onChange: (v: File[]) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const maxFiles = field.maxFiles ?? 1;
  const maxBytes = (field.maxFileSize ?? 10) * 1024 * 1024;
  const accepted = field.acceptedTypes ?? ["image/"];

  // Compute totals to show alongside the dropzone.
  const totalBytes = value.reduce((sum, f) => sum + f.size, 0);

  function isAcceptedFile(file: File): boolean {
    if (accepted.some((prefix) => file.type.startsWith(prefix))) return true;
    // iPhones often deliver HEIC photos with empty `type`. Fall back to the
    // file extension so vendors can submit photos straight from the camera roll.
    const lowerName = file.name.toLowerCase();
    if (
      accepted.some((p) => p.startsWith("image/")) &&
      (lowerName.endsWith(".heic") || lowerName.endsWith(".heif"))
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
      // Allow re-picking the same file.
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
          Drop files here or <u>click to browse</u>
        </div>
        <div style={dropzoneSub}>
          {accepted.map((a) => a.replace("/", "").replace(/$/, "s")).join(" or ")}
          {" · "}
          up to {field.maxFileSize ?? 10}MB · max {maxFiles} file{maxFiles === 1 ? "" : "s"}
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
            {value.length} {value.length === 1 ? "file" : "files"} · {formatBytes(totalBytes)}
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
          <div style={fileIcon}>{file.type.startsWith("video/") ? "▶" : "📄"}</div>
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

function ThankYou({ message }: { message: string }) {
  return (
    <div style={pageWrap}>
      <div style={{ ...pageInner, textAlign: "center", maxWidth: 540 }}>
        <header style={brandHeader}>
          <span style={brandThe}>The </span>
          <span style={brandMari}>Marigold</span>
        </header>
        <div style={marigoldFlower} aria-hidden="true">
          {/* Stylized marigold svg */}
          <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
            <g fill="#D4A853">
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 360) / 12;
                return (
                  <ellipse
                    key={i}
                    cx="40"
                    cy="20"
                    rx="6"
                    ry="14"
                    transform={`rotate(${angle} 40 40)`}
                    opacity={0.85}
                  />
                );
              })}
            </g>
            <circle cx="40" cy="40" r="8" fill="#9C2647" />
          </svg>
        </div>
        <h1 style={thankYouTitle}>
          Thank <i>you!</i>
        </h1>
        <p style={thankYouMessage}>{message}</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div style={pageWrap}>
      <div style={{ ...pageInner, textAlign: "center", maxWidth: 540 }}>
        <header style={brandHeader}>
          <span style={brandThe}>The </span>
          <span style={brandMari}>Marigold</span>
        </header>
        <h1 style={thankYouTitle}>
          Form <i>not found</i>
        </h1>
        <p style={thankYouMessage}>
          This link is broken or the form has been deleted. Reach out to whoever
          shared it with you.
        </p>
      </div>
    </div>
  );
}

function FormClosed({ title }: { title: string }) {
  return (
    <div style={pageWrap}>
      <div style={{ ...pageInner, textAlign: "center", maxWidth: 540 }}>
        <header style={brandHeader}>
          <span style={brandThe}>The </span>
          <span style={brandMari}>Marigold</span>
        </header>
        <h1 style={thankYouTitle}>
          {title} is <i>closed</i>
        </h1>
        <p style={thankYouMessage}>
          We're not accepting submissions to this form right now. Check back
          soon — and follow{" "}
          <a
            href="https://instagram.com/themarigold"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--deep-pink)" }}
          >
            @themarigold
          </a>{" "}
          for updates.
        </p>
      </div>
    </div>
  );
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
  maxWidth: 640,
};

const loadingShell: CSSProperties = {
  ...pageWrap,
  alignItems: "center",
};

const loadingText: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 28,
  color: "var(--mauve)",
};

const brandHeader: CSSProperties = {
  textAlign: "center",
  marginBottom: 32,
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
  marginBottom: 32,
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
  maxWidth: 520,
  marginLeft: "auto",
  marginRight: "auto",
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24,
};

const honeypotStyle: CSSProperties = {
  position: "absolute",
  left: -10000,
  top: "auto",
  width: 1,
  height: 1,
  overflow: "hidden",
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
};

const fieldLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--wine)",
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
  fontSize: 16, // 16px prevents iOS Safari from auto-zooming on focus
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
};

const submitBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 13,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 3,
  padding: "20px 32px",
  minHeight: 56,
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  boxShadow: "4px 4px 0 var(--gold)",
  marginTop: 8,
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

const footerNote: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
  textAlign: "center",
  margin: "16px 0 0",
  fontStyle: "italic",
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

const marigoldFlower: CSSProperties = {
  margin: "0 auto 24px",
  display: "flex",
  justifyContent: "center",
};

const thankYouTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 56,
  color: "var(--wine)",
  margin: "0 0 16px",
  lineHeight: 1,
};

const thankYouMessage: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 16,
  color: "var(--mauve)",
  lineHeight: 1.7,
  margin: 0,
};
