"use client";

import Link from "next/link";
import type { CSSProperties, ChangeEvent } from "react";
import { useState } from "react";
import type {
  CalendarStatus,
  ContentData,
  EditableField,
  TemplateDefinition,
  VendorSubmission,
} from "@/lib/types";
import { STATUS_BADGES } from "@/components/calendar/labels";
import {
  submissionTypeLabel,
  vendorCategoryLabel,
} from "@/lib/db/submissions-store";
import { MediaDropField } from "@/components/media/MediaDropField";
import { parseMediaRef } from "@/lib/db/media-types";

const IMAGE_FIELD_KEY_RE = /(image|photo|picture|backgroundImage|cover|avatar|logo|profile)/i;
const TEXT_DROP_KEY_RE = /(quote|tip|caption|confession|hottake|hot_take|bio|description|notes|story|excerpt|advice|takeaway|content)/i;

function isLikelyImageField(field: EditableField): boolean {
  return IMAGE_FIELD_KEY_RE.test(field.key);
}

function isLikelyTextDropField(field: EditableField): boolean {
  return field.type === "textarea" || TEXT_DROP_KEY_RE.test(field.key);
}

const CAPTION_MAX = 2200;

const STATUSES: CalendarStatus[] = [
  "suggested",
  "approved",
  "editing",
  "exported",
  "posted",
];

interface EditPanelProps {
  template: TemplateDefinition;
  templatesInSeries: TemplateDefinition[];
  contentData: ContentData;
  caption: string;
  hashtags: string[];
  userPrompt: string;
  status: CalendarStatus;
  scheduledDate: string;
  scheduledTime: string;
  regenerating: "content" | "caption" | null;
  exporting: boolean;
  /** When the post was created from a vendor submission, show a back-ref. */
  submission?: VendorSubmission | null;
  onTemplateChange: (slug: string) => void;
  onContentChange: (key: string, value: string | number) => void;
  onCaptionChange: (caption: string) => void;
  onHashtagsChange: (hashtags: string[]) => void;
  onUserPromptChange: (prompt: string) => void;
  onStatusChange: (status: CalendarStatus) => void;
  onScheduledDateChange: (date: string) => void;
  onScheduledTimeChange: (time: string) => void;
  onRegenerateContent: () => void;
  onRegenerateCaption: () => void;
  onExportPNG: () => void;
}

export function EditPanel(props: EditPanelProps) {
  const {
    template,
    templatesInSeries,
    contentData,
    caption,
    hashtags,
    userPrompt,
    status,
    scheduledDate,
    scheduledTime,
    regenerating,
    exporting,
    onTemplateChange,
    onContentChange,
    onCaptionChange,
    onHashtagsChange,
    onUserPromptChange,
    onStatusChange,
    onScheduledDateChange,
    onScheduledTimeChange,
    onRegenerateContent,
    onRegenerateCaption,
    onExportPNG,
    submission,
  } = props;

  return (
    <div style={panelStyle}>
      {submission && <SubmissionBadge submission={submission} />}
      <Section title="Template">
        <TemplatePicker
          template={template}
          templates={templatesInSeries}
          onChange={onTemplateChange}
        />
      </Section>

      <Section title="Content">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {template.editable_fields.map((field) => (
            <DynamicField
              key={field.key}
              field={field}
              value={contentData[field.key]}
              onChange={(v) => onContentChange(field.key, v)}
            />
          ))}
        </div>
      </Section>

      <Section
        title="AI controls"
        subtitle="Regenerate content or caption with Claude. The custom prompt is your Layer 4 override."
      >
        <Field label="Custom prompt (optional)">
          <textarea
            value={userPrompt}
            onChange={(e) => onUserPromptChange(e.target.value)}
            rows={3}
            placeholder="Tell the AI what you want — e.g. 'a confession about hiding the venue from the in-laws'."
            style={{ ...inputStyle, fontFamily: fontBody, resize: "vertical" }}
          />
        </Field>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onRegenerateContent}
            disabled={regenerating !== null}
            style={{
              ...primaryButton,
              opacity: regenerating !== null ? 0.6 : 1,
              cursor: regenerating !== null ? "wait" : "pointer",
            }}
          >
            {regenerating === "content" ? "Regenerating…" : "Regenerate content"}
          </button>
          <button
            type="button"
            onClick={onRegenerateCaption}
            disabled={regenerating !== null}
            style={{
              ...secondaryButton,
              opacity: regenerating !== null ? 0.6 : 1,
              cursor: regenerating !== null ? "wait" : "pointer",
            }}
          >
            {regenerating === "caption" ? "Regenerating…" : "Regenerate caption"}
          </button>
        </div>
      </Section>

      <Section title="Caption">
        <CaptionEditor caption={caption} onChange={onCaptionChange} />
      </Section>

      <Section title="Hashtags">
        <HashtagEditor hashtags={hashtags} onChange={onHashtagsChange} />
      </Section>

      <Section title="Schedule & status">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <Field label="Date">
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => onScheduledDateChange(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Time">
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => onScheduledTimeChange(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Status">
            <select
              value={status}
              onChange={(e) =>
                onStatusChange(e.target.value as CalendarStatus)
              }
              style={inputStyle}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_BADGES[s].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Format">
            <ReadonlyValue value={template.format.toUpperCase()} />
          </Field>
        </div>
      </Section>

      <Section title="Export">
        <button
          type="button"
          onClick={onExportPNG}
          disabled={exporting}
          style={{
            ...exportButton,
            opacity: exporting ? 0.6 : 1,
            cursor: exporting ? "wait" : "pointer",
          }}
        >
          {exporting ? "Exporting…" : "Export PNG"}
        </button>
        <p
          style={{
            fontFamily: fontBody,
            fontSize: 11,
            color: "var(--mauve)",
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          Saves a {template.dimensions.width}×{template.dimensions.height} PNG
          to your downloads and to the Asset Library.
        </p>
      </Section>
    </div>
  );
}

function SubmissionBadge({ submission }: { submission: VendorSubmission }) {
  return (
    <Link
      href="/submissions"
      style={submissionBadge}
      title={`Submitted by ${submission.vendor_name} — open the inbox`}
    >
      <span style={submissionEyebrow}>From a submission</span>
      <span style={submissionLine}>
        {submission.vendor_name}{" "}
        <span style={submissionMeta}>
          · {vendorCategoryLabel(submission.category)} ·{" "}
          {submissionTypeLabel(submission.submission_type)}
        </span>
      </span>
      <span style={submissionCta}>Open in inbox →</span>
    </Link>
  );
}

interface TemplatePickerProps {
  template: TemplateDefinition;
  templates: TemplateDefinition[];
  onChange: (slug: string) => void;
}

function TemplatePicker({ template, templates, onChange }: TemplatePickerProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <select
        value={template.slug}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      >
        {templates.map((t) => (
          <option key={t.slug} value={t.slug}>
            {t.name} ({t.format})
          </option>
        ))}
      </select>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {templates.map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => onChange(t.slug)}
            style={{
              ...templateChip,
              background:
                t.slug === template.slug ? "var(--wine)" : "transparent",
              color: t.slug === template.slug ? "var(--cream)" : "var(--wine)",
            }}
            title={t.name}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background:
                  t.format === "story"
                    ? "var(--pink)"
                    : t.format === "post"
                      ? "var(--gold)"
                      : "var(--mauve)",
              }}
            />
            {t.name.replace(/^.*?— /, "") || t.name}
          </button>
        ))}
      </div>
    </div>
  );
}

interface DynamicFieldProps {
  field: EditableField;
  value: unknown;
  onChange: (v: string | number) => void;
}

function DynamicField({ field, value, onChange }: DynamicFieldProps) {
  const stringValue =
    typeof value === "string"
      ? value
      : typeof value === "number"
        ? String(value)
        : "";
  const numberValue = typeof value === "number" ? value : Number(stringValue) || 0;
  const isImageField = isLikelyImageField(field);
  const isTextDropField = isLikelyTextDropField(field);
  const mediaRefId = parseMediaRef(stringValue);

  if (field.type === "textarea") {
    const len = stringValue.length;
    const limit = field.maxLength;
    return (
      <Field label={fieldLabel(field)} help={field.helpText}>
        <MediaDropField
          accept={isImageField ? ["image", "video", "text"] : ["text"]}
          onMediaDropped={(v) => onChange(v)}
          hint={isImageField ? "Drop media here" : "Drop text here"}
        >
          <textarea
            value={stringValue}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              onChange(e.target.value)
            }
            rows={3}
            maxLength={limit}
            style={{ ...inputStyle, fontFamily: fontBody, resize: "vertical" }}
          />
        </MediaDropField>
        {limit !== undefined && (
          <Counter current={len} max={limit} over={len > limit} />
        )}
      </Field>
    );
  }

  if (field.type === "number") {
    return (
      <Field label={fieldLabel(field)} help={field.helpText}>
        <input
          type="number"
          value={numberValue}
          min={field.min}
          max={field.max}
          onChange={(e) => onChange(Number(e.target.value))}
          style={inputStyle}
        />
      </Field>
    );
  }

  if (field.type === "select") {
    return (
      <Field label={fieldLabel(field)} help={field.helpText}>
        <select
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
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

  const len = stringValue.length;
  const limit = field.maxLength;

  if (isImageField || isTextDropField) {
    return (
      <Field label={fieldLabel(field)} help={field.helpText}>
        <MediaDropField
          accept={
            isImageField
              ? isTextDropField
                ? ["image", "video", "text"]
                : ["image", "video"]
              : ["text"]
          }
          onMediaDropped={(v) => onChange(v)}
          hint={isImageField ? "Drop image / video here" : "Drop text here"}
        >
          <input
            type="text"
            value={stringValue}
            maxLength={limit}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              isImageField
                ? "Drag from Media drawer or paste a URL"
                : undefined
            }
            style={inputStyle}
          />
        </MediaDropField>
        {mediaRefId && (
          <span style={mediaRefBadge} title={`Linked media id: ${mediaRefId}`}>
            ✓ Linked to media library
            <button
              type="button"
              onClick={() => onChange("")}
              style={mediaRefClearBtn}
              title="Unlink"
            >
              ×
            </button>
          </span>
        )}
        {limit !== undefined && (
          <Counter current={len} max={limit} over={len > limit} />
        )}
      </Field>
    );
  }

  return (
    <Field label={fieldLabel(field)} help={field.helpText}>
      <input
        type="text"
        value={stringValue}
        maxLength={limit}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
      {limit !== undefined && (
        <Counter current={len} max={limit} over={len > limit} />
      )}
    </Field>
  );
}

function fieldLabel(field: EditableField): string {
  return field.required ? `${field.label} *` : field.label;
}

interface CaptionEditorProps {
  caption: string;
  onChange: (value: string) => void;
}

function CaptionEditor({ caption, onChange }: CaptionEditorProps) {
  const len = caption.length;
  const over = len > CAPTION_MAX;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <textarea
        value={caption}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder="Instagram caption — short lines, ends with a question or CTA."
        style={{ ...inputStyle, fontFamily: fontBody, resize: "vertical" }}
      />
      <Counter current={len} max={CAPTION_MAX} over={over} />
    </div>
  );
}

interface HashtagEditorProps {
  hashtags: string[];
  onChange: (next: string[]) => void;
}

function HashtagEditor({ hashtags, onChange }: HashtagEditorProps) {
  const [draft, setDraft] = useState("");

  function normalize(raw: string): string | null {
    const trimmed = raw.trim().replace(/\s+/g, "");
    if (!trimmed) return null;
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  }

  function addDraft() {
    const next = normalize(draft);
    if (!next) return;
    if (hashtags.includes(next)) {
      setDraft("");
      return;
    }
    onChange([...hashtags, next]);
    setDraft("");
  }

  function remove(tag: string) {
    onChange(hashtags.filter((t) => t !== tag));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {hashtags.length === 0 && (
          <span style={{ fontFamily: fontBody, fontSize: 12, color: "var(--mauve)" }}>
            No hashtags yet — regenerate caption to suggest some, or add your own.
          </span>
        )}
        {hashtags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => remove(tag)}
            title="Click to remove"
            style={hashtagPill}
          >
            {tag}
            <span style={{ marginLeft: 6, opacity: 0.7 }}>×</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder="Add custom hashtag…"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button type="button" onClick={addDraft} style={addButton}>
          Add
        </button>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function Section({ title, subtitle, children }: SectionProps) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <h3
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 2.4,
            color: "var(--pink)",
            margin: 0,
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            style={{
              fontFamily: fontBody,
              fontSize: 12,
              color: "var(--mauve)",
              marginTop: 4,
              marginBottom: 0,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

interface FieldProps {
  label: string;
  help?: string;
  children: React.ReactNode;
}

function Field({ label, help, children }: FieldProps) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.4,
          color: "var(--wine)",
        }}
      >
        {label}
      </span>
      {children}
      {help && (
        <span
          style={{
            fontFamily: fontBody,
            fontSize: 11,
            color: "var(--mauve)",
            lineHeight: 1.4,
          }}
        >
          {help}
        </span>
      )}
    </label>
  );
}

function Counter({
  current,
  max,
  over,
}: {
  current: number;
  max: number;
  over: boolean;
}) {
  return (
    <span
      style={{
        fontFamily: fontBody,
        fontSize: 10,
        color: over ? "var(--deep-pink)" : "var(--mauve)",
        textAlign: "right",
      }}
    >
      {current} / {max}
    </span>
  );
}

function ReadonlyValue({ value }: { value: string }) {
  return (
    <div
      style={{
        ...inputStyle,
        background: "rgba(75,21,40,0.04)",
        color: "var(--mauve)",
        cursor: "not-allowed",
      }}
    >
      {value}
    </div>
  );
}

const fontBody = "'Space Grotesk', sans-serif";

const panelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 28,
  padding: "32px 28px 64px",
  background: "var(--cream)",
  borderRight: "1px solid rgba(75,21,40,0.08)",
};

const inputStyle: CSSProperties = {
  fontFamily: fontBody,
  fontSize: 13,
  padding: "10px 12px",
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.2)",
  borderRadius: 6,
  color: "var(--wine)",
  width: "100%",
  boxSizing: "border-box",
};

const primaryButton: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "10px 18px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: "3px 3px 0 var(--gold)",
};

const secondaryButton: CSSProperties = {
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

const exportButton: CSSProperties = {
  ...primaryButton,
  background: "var(--pink)",
  color: "white",
  width: "100%",
  padding: "14px 20px",
  fontSize: 12,
};

const templateChip: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "8px 12px",
  border: "1px solid var(--wine)",
  borderRadius: 999,
  cursor: "pointer",
};

const hashtagPill: CSSProperties = {
  fontFamily: fontBody,
  fontSize: 12,
  fontWeight: 600,
  padding: "6px 10px",
  background: "var(--blush)",
  color: "var(--deep-pink)",
  border: "1px solid rgba(153,53,86,0.25)",
  borderRadius: 999,
  cursor: "pointer",
};

const submissionBadge: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: "10px 14px",
  background: "var(--blush)",
  border: "1px dashed rgba(153,53,86,0.4)",
  borderRadius: 10,
  textDecoration: "none",
};

const submissionEyebrow: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--deep-pink)",
};

const submissionLine: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 18,
  color: "var(--wine)",
  lineHeight: 1.15,
};

const submissionMeta: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  color: "var(--mauve)",
  fontStyle: "normal",
};

const submissionCta: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--deep-pink)",
  marginTop: 4,
};

const mediaRefBadge: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.2,
  padding: "4px 8px",
  background: "var(--mint)",
  color: "var(--wine)",
  borderRadius: 999,
  marginTop: 4,
  alignSelf: "flex-start",
};

const mediaRefClearBtn: CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  color: "var(--wine)",
  padding: 0,
  lineHeight: 1,
};

const addButton: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "10px 16px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};

