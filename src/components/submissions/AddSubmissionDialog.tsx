"use client";

/**
 * Form dialog for adding (or editing) a vendor submission. Image URLs are a
 * dynamic list — users paste in any number of links until file uploads ship.
 */

import { useEffect, useState, type CSSProperties } from "react";
import { Modal } from "@/components/calendar/Modal";
import {
  SUBMISSION_TYPES,
  VENDOR_CATEGORIES,
} from "@/lib/db/submissions-store";
import type {
  SubmissionStatus,
  SubmissionType,
  VendorCategory,
  VendorSubmission,
  VendorSubmissionInput,
} from "@/lib/types";

interface AddSubmissionDialogProps {
  open: boolean;
  initial?: VendorSubmission | null;
  onClose: () => void;
  onSubmit: (input: VendorSubmissionInput) => void;
}

interface DraftState {
  vendor_name: string;
  category: VendorCategory;
  submission_type: SubmissionType;
  text_content: string;
  image_urls: string[];
  notes: string;
  status: SubmissionStatus;
}

function blankDraft(): DraftState {
  return {
    vendor_name: "",
    category: "photographer",
    submission_type: "photos",
    text_content: "",
    image_urls: [""],
    notes: "",
    status: "new",
  };
}

function fromInitial(s: VendorSubmission): DraftState {
  return {
    vendor_name: s.vendor_name,
    category: s.category,
    submission_type: s.submission_type,
    text_content: s.text_content,
    image_urls: s.image_urls.length > 0 ? s.image_urls : [""],
    notes: s.notes,
    status: s.status,
  };
}

export function AddSubmissionDialog({
  open,
  initial,
  onClose,
  onSubmit,
}: AddSubmissionDialogProps) {
  const [draft, setDraft] = useState<DraftState>(blankDraft);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(initial ? fromInitial(initial) : blankDraft());
    setError(null);
  }, [open, initial]);

  function updateUrl(idx: number, value: string) {
    setDraft((d) => ({
      ...d,
      image_urls: d.image_urls.map((url, i) => (i === idx ? value : url)),
    }));
  }

  function addUrlSlot() {
    setDraft((d) => ({ ...d, image_urls: [...d.image_urls, ""] }));
  }

  function removeUrl(idx: number) {
    setDraft((d) => ({
      ...d,
      image_urls: d.image_urls.filter((_, i) => i !== idx),
    }));
  }

  function handleSubmit() {
    const cleanedUrls = draft.image_urls.map((u) => u.trim()).filter(Boolean);
    if (!draft.vendor_name.trim()) {
      setError("Vendor / planner name is required.");
      return;
    }
    if (!draft.text_content.trim() && cleanedUrls.length === 0) {
      setError("Add some text content or at least one image URL.");
      return;
    }
    const input: VendorSubmissionInput = {
      vendor_name: draft.vendor_name.trim(),
      category: draft.category,
      submission_type: draft.submission_type,
      text_content: draft.text_content.trim(),
      image_urls: cleanedUrls,
      notes: draft.notes.trim(),
      status: draft.status,
    };
    onSubmit(input);
    onClose();
  }

  return (
    <Modal
      open={open}
      title={initial ? "Edit submission" : "Add a submission"}
      subtitle={
        initial
          ? "Update the vendor or planner content stored in your inbox."
          : "Paste in vendor / planner content. Quotes, tips, bios go in the text field. Image URLs link to whatever Drive / Dropbox / hosted asset they sent."
      }
      onClose={onClose}
      width={680}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Field label="Vendor / planner name *">
          <input
            type="text"
            value={draft.vendor_name}
            onChange={(e) =>
              setDraft({ ...draft, vendor_name: e.target.value })
            }
            placeholder="Priya Sharma Photography"
            style={inputStyle}
          />
        </Field>

        <div style={twoCol}>
          <Field label="Category">
            <select
              value={draft.category}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  category: e.target.value as VendorCategory,
                })
              }
              style={inputStyle}
            >
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Submission type">
            <select
              value={draft.submission_type}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  submission_type: e.target.value as SubmissionType,
                })
              }
              style={inputStyle}
            >
              {SUBMISSION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Text content"
          help="Quotes, tips, bio, testimonials. One tip per line for tip submissions — we'll split them across slides."
        >
          <textarea
            value={draft.text_content}
            onChange={(e) =>
              setDraft({ ...draft, text_content: e.target.value })
            }
            rows={6}
            placeholder="Paste the quote, tips, or bio they sent…"
            style={{ ...inputStyle, fontFamily: bodyFont, resize: "vertical" }}
          />
        </Field>

        <Field
          label="Image URLs"
          help="Paste a Drive / Dropbox / hosted link per row. Storage upload comes later."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {draft.image_urls.map((url, idx) => (
              <div
                key={idx}
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateUrl(idx, e.target.value)}
                  placeholder="https://..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                {draft.image_urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUrl(idx)}
                    style={removeButton}
                    title="Remove URL"
                    aria-label="Remove URL"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addUrlSlot} style={addUrlButton}>
              + Add another URL
            </button>
          </div>
        </Field>

        <Field
          label="Internal notes"
          help="Just for the team — how to use this content, when to schedule it, what to credit."
        >
          <textarea
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            rows={3}
            placeholder="e.g. great for a quote card after the upcoming venue series"
            style={{ ...inputStyle, fontFamily: bodyFont, resize: "vertical" }}
          />
        </Field>

        {initial && (
          <Field label="Status">
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  status: e.target.value as SubmissionStatus,
                })
              }
              style={inputStyle}
            >
              <option value="new">New</option>
              <option value="planned">Planned</option>
              <option value="used">Used</option>
            </select>
          </Field>
        )}

        {error && <div style={errorStyle}>{error}</div>}

        <div style={footerStyle}>
          <button type="button" onClick={onClose} style={cancelButton}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} style={primaryButton}>
            {initial ? "Save changes" : "Add submission"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface FieldProps {
  label: string;
  help?: string;
  children: React.ReactNode;
}

function Field({ label, help, children }: FieldProps) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={fieldLabelStyle}>{label}</span>
      {children}
      {help && <span style={fieldHelpStyle}>{help}</span>}
    </label>
  );
}

const bodyFont = "'Space Grotesk', sans-serif";

const inputStyle: CSSProperties = {
  fontFamily: bodyFont,
  fontSize: 14,
  padding: "10px 12px",
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.2)",
  borderRadius: 6,
  color: "var(--wine)",
  width: "100%",
  boxSizing: "border-box",
};

const fieldLabelStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--wine)",
};

const fieldHelpStyle: CSSProperties = {
  fontFamily: bodyFont,
  fontSize: 11,
  color: "var(--mauve)",
  lineHeight: 1.4,
};

const twoCol: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const footerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  paddingTop: 8,
  borderTop: "1px dashed rgba(75,21,40,0.15)",
};

const primaryButton: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  padding: "12px 24px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: "3px 3px 0 var(--gold)",
};

const cancelButton: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "10px 18px",
  background: "transparent",
  color: "var(--wine)",
  border: "1px solid var(--wine)",
  borderRadius: 4,
  cursor: "pointer",
};

const removeButton: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 18,
  width: 36,
  height: 36,
  background: "transparent",
  color: "var(--mauve)",
  border: "1px solid rgba(75,21,40,0.2)",
  borderRadius: 999,
  cursor: "pointer",
  lineHeight: 1,
};

const addUrlButton: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "10px 14px",
  background: "transparent",
  color: "var(--wine)",
  border: "1px dashed rgba(75,21,40,0.3)",
  borderRadius: 4,
  cursor: "pointer",
  alignSelf: "flex-start",
};

const errorStyle: CSSProperties = {
  padding: 12,
  background: "var(--blush)",
  border: "1px solid var(--deep-pink)",
  borderRadius: 8,
  color: "var(--deep-pink)",
  fontFamily: bodyFont,
  fontSize: 12,
};
