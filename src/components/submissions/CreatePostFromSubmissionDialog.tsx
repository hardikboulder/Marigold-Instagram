"use client";

/**
 * Turns a vendor submission into a calendar item. Suggests the best
 * (series, template) pair, pre-fills content_data, lets the user override
 * any of it, and creates the calendar entry. The submission is flipped to
 * "planned" so the inbox view can hide it from the Unused stats.
 */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Modal } from "@/components/calendar/Modal";
import {
  dayOfWeekName,
  defaultContentForTemplate,
  getActiveSeriesList,
  getActiveTemplatesForSeries,
  isoDate,
  isoWeekNumber,
  parseIsoDate,
} from "@/components/calendar/utils";
import { addCalendarItem } from "@/lib/db/content-calendar-store";
import { updateSubmission } from "@/lib/db/submissions-store";
import type {
  CalendarItem,
  CalendarItemInput,
  ContentData,
  VendorSubmission,
} from "@/lib/types";
import { getTemplateBySlug } from "@/lib/db/data-loader";
import {
  buildVendorCaption,
  prefillContentData,
  suggestTemplate,
  type TemplateSuggestion,
} from "./template-suggestions";

interface CreatePostFromSubmissionDialogProps {
  open: boolean;
  submission: VendorSubmission | null;
  /**
   * When set (e.g. when launched from the Template Gallery), the dialog locks
   * its template selector to this slug instead of the (category, type)-based
   * suggestion. The submission's prefill is still applied.
   */
  forcedTemplateSlug?: string;
  onClose: () => void;
  onCreated: (item: CalendarItem, submissionId: string) => void;
}

export function CreatePostFromSubmissionDialog({
  open,
  submission,
  forcedTemplateSlug,
  onClose,
  onCreated,
}: CreatePostFromSubmissionDialogProps) {
  const allSeries = useMemo(() => getActiveSeriesList(), []);
  const initialSuggestion: TemplateSuggestion | null = useMemo(() => {
    if (!submission) return null;
    if (forcedTemplateSlug) {
      const forced = getTemplateBySlug(forcedTemplateSlug);
      if (forced) {
        return {
          seriesSlug: forced.series_slug,
          templateSlug: forced.slug,
          reason: `Locked to ${forced.name} from the Template Gallery — submission content is pre-filled into this template's fields.`,
        };
      }
    }
    return suggestTemplate(submission);
  }, [submission, forcedTemplateSlug]);

  const [seriesSlug, setSeriesSlug] = useState<string>("");
  const [templateSlug, setTemplateSlug] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>(
    isoDate(new Date()),
  );
  const [contentData, setContentData] = useState<ContentData>({});
  const [caption, setCaption] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Reset on open: apply the suggestion + prefill.
  useEffect(() => {
    if (!open || !submission || !initialSuggestion) return;
    setSeriesSlug(initialSuggestion.seriesSlug);
    setTemplateSlug(initialSuggestion.templateSlug);
    setScheduledDate(isoDate(new Date()));
    const defaults = defaultContentForTemplate(initialSuggestion.templateSlug);
    const prefill = prefillContentData(
      initialSuggestion.templateSlug,
      submission,
    );
    setContentData({ ...defaults, ...prefill });
    setCaption("");
    setError(null);
  }, [open, submission, initialSuggestion]);

  const templates = useMemo(
    () => (seriesSlug ? getActiveTemplatesForSeries(seriesSlug) : []),
    [seriesSlug],
  );

  // Re-prefill whenever the template selection changes.
  useEffect(() => {
    if (!templateSlug || !submission) return;
    const defaults = defaultContentForTemplate(templateSlug);
    const prefill = prefillContentData(templateSlug, submission);
    setContentData({ ...defaults, ...prefill });
  }, [templateSlug, submission]);

  function handleSeriesChange(slug: string) {
    setSeriesSlug(slug);
    const next = getActiveTemplatesForSeries(slug);
    if (next.length > 0) setTemplateSlug(next[0].slug);
  }

  function handleGenerateCaption() {
    if (!submission) return;
    setCaption(buildVendorCaption(submission));
  }

  function handleSubmit() {
    if (!submission) return;
    if (!seriesSlug || !templateSlug) {
      setError("Pick a series and a template.");
      return;
    }
    setBusy(true);
    try {
      const template = templates.find((t) => t.slug === templateSlug);
      if (!template) {
        throw new Error("Template not found.");
      }
      const dateObj = parseIsoDate(scheduledDate);
      const input: CalendarItemInput = {
        scheduled_date: scheduledDate,
        scheduled_time: null,
        week_number: isoWeekNumber(dateObj),
        day_of_week: dayOfWeekName(dateObj),
        series_slug: seriesSlug,
        template_slug: templateSlug,
        format: template.format,
        status: "editing",
        content_data: {
          ...contentData,
          _submissionId: submission.id,
        },
        caption: caption.trim() || null,
        hashtags: [],
        ai_rationale: `Created from a ${submission.submission_type} submission by ${submission.vendor_name}.`,
        generation_prompt: null,
        sort_order: 0,
      };
      const created = addCalendarItem(input);
      updateSubmission(submission.id, {
        status: "planned",
        linked_calendar_item_id: created.id,
      });
      onCreated(created, submission.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!submission) return null;

  const template = templates.find((t) => t.slug === templateSlug);

  return (
    <Modal
      open={open}
      title="Create a post from this"
      subtitle={`Drop ${submission.vendor_name}'s submission into the calendar — pick a template and a date, edit the prefill, then save.`}
      onClose={onClose}
      width={760}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {initialSuggestion && (
          <div style={suggestionBanner}>
            <div style={suggestionEyebrow}>Suggested template</div>
            <p style={suggestionReason}>{initialSuggestion.reason}</p>
          </div>
        )}

        <div style={twoCol}>
          <Field label="Series">
            <select
              value={seriesSlug}
              onChange={(e) => handleSeriesChange(e.target.value)}
              disabled={Boolean(forcedTemplateSlug)}
              style={inputStyle}
            >
              <option value="">— Choose a series —</option>
              {allSeries.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Template">
            <select
              value={templateSlug}
              onChange={(e) => setTemplateSlug(e.target.value)}
              disabled={
                Boolean(forcedTemplateSlug) ||
                !seriesSlug ||
                templates.length === 0
              }
              style={inputStyle}
            >
              {!seriesSlug && <option value="">Pick a series first</option>}
              {templates.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name} ({t.format})
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Scheduled date">
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            style={inputStyle}
          />
        </Field>

        {template && template.editable_fields.length > 0 && (
          <section>
            <div style={fieldLabelStyle}>Template content</div>
            <p style={fieldHelpStyle}>
              Pre-filled from the submission. Tweak now or fine-tune in the
              editor after creating.
            </p>
            <div style={fieldsBlock}>
              {template.editable_fields.map((field) => {
                const value = contentData[field.key];
                const stringValue =
                  typeof value === "string"
                    ? value
                    : typeof value === "number"
                      ? String(value)
                      : "";
                if (field.type === "textarea") {
                  return (
                    <Field key={field.key} label={field.label}>
                      <textarea
                        value={stringValue}
                        rows={3}
                        maxLength={field.maxLength}
                        onChange={(e) =>
                          setContentData((d) => ({
                            ...d,
                            [field.key]: e.target.value,
                          }))
                        }
                        style={{
                          ...inputStyle,
                          fontFamily: bodyFont,
                          resize: "vertical",
                        }}
                      />
                    </Field>
                  );
                }
                if (field.type === "select") {
                  return (
                    <Field key={field.key} label={field.label}>
                      <select
                        value={stringValue}
                        onChange={(e) =>
                          setContentData((d) => ({
                            ...d,
                            [field.key]: e.target.value,
                          }))
                        }
                        style={inputStyle}
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  );
                }
                if (field.type === "number") {
                  return (
                    <Field key={field.key} label={field.label}>
                      <input
                        type="number"
                        value={stringValue}
                        min={field.min}
                        max={field.max}
                        onChange={(e) =>
                          setContentData((d) => ({
                            ...d,
                            [field.key]: Number(e.target.value),
                          }))
                        }
                        style={inputStyle}
                      />
                    </Field>
                  );
                }
                return (
                  <Field key={field.key} label={field.label}>
                    <input
                      type="text"
                      value={stringValue}
                      maxLength={field.maxLength}
                      onChange={(e) =>
                        setContentData((d) => ({
                          ...d,
                          [field.key]: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </Field>
                );
              })}
            </div>
          </section>
        )}

        <Field
          label="Caption"
          help="Optional — click Generate to draft a caption referencing the vendor, or leave blank and use Regenerate caption in the editor."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              placeholder="Caption goes here…"
              style={{
                ...inputStyle,
                fontFamily: bodyFont,
                resize: "vertical",
              }}
            />
            <button
              type="button"
              onClick={handleGenerateCaption}
              style={generateButton}
            >
              Generate caption
            </button>
          </div>
        </Field>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={footerStyle}>
          <button type="button" onClick={onClose} style={cancelButton}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy || !templateSlug}
            style={{
              ...primaryButton,
              opacity: busy || !templateSlug ? 0.5 : 1,
              cursor: busy ? "wait" : "pointer",
            }}
          >
            {busy ? "Adding…" : "Add to calendar"}
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
  marginBottom: 4,
  display: "block",
};

const fieldHelpStyle: CSSProperties = {
  fontFamily: bodyFont,
  fontSize: 11,
  color: "var(--mauve)",
  lineHeight: 1.4,
  marginBottom: 8,
  display: "block",
};

const twoCol: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const fieldsBlock: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
  marginTop: 8,
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

const generateButton: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "10px 14px",
  background: "transparent",
  color: "var(--deep-pink)",
  border: "1px dashed var(--deep-pink)",
  borderRadius: 4,
  cursor: "pointer",
  alignSelf: "flex-start",
};

const suggestionBanner: CSSProperties = {
  padding: "14px 18px",
  background: "var(--blush)",
  borderRadius: 10,
  border: "1px solid rgba(212,168,83,0.4)",
};

const suggestionEyebrow: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--pink)",
  marginBottom: 4,
};

const suggestionReason: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 18,
  color: "var(--wine)",
  lineHeight: 1.35,
  margin: 0,
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
