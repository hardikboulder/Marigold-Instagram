"use client";

/**
 * Renders a FormSubmission (from the public form system) in the inbox grid.
 *
 * Different from VendorSubmission: data is keyed by form-field id, files are
 * SubmissionFile records, and we offer a one-click "Save All to Media Library"
 * action that grabs every file + text quote at once.
 */

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import type {
  FormConfig,
  FormSubmission,
  FormSubmissionStatus,
  SubmissionFile,
} from "@/lib/types";
import { FORM_SUBMISSION_STATUSES } from "@/lib/db/form-submissions-store";
import { templateLabel } from "@/lib/db/form-templates";

interface Props {
  submission: FormSubmission;
  formConfig: FormConfig | null;
  onUpdateStatus: (status: FormSubmissionStatus) => void;
  onSaveToLibrary: () => void;
  onDelete: () => void;
  saving: boolean;
}

interface BlogPostPayload {
  headline: string;
  markdown: string;
  html: string;
  readingTimeMin: number;
}

interface BlogAnswerEntry {
  question: string;
  answer: string;
}

function readBlogPost(submission: FormSubmission): BlogPostPayload | null {
  const raw = submission.data._blog_post;
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<BlogPostPayload>;
  if (!r.headline || !r.markdown || !r.html) return null;
  return {
    headline: String(r.headline),
    markdown: String(r.markdown),
    html: String(r.html),
    readingTimeMin:
      typeof r.readingTimeMin === "number" ? r.readingTimeMin : 5,
  };
}

function readBlogAnswers(submission: FormSubmission): BlogAnswerEntry[] {
  const raw = submission.data._blog_answers;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const e = entry as Partial<BlogAnswerEntry>;
      return {
        question: typeof e.question === "string" ? e.question : "",
        answer: typeof e.answer === "string" ? e.answer : "",
      };
    })
    .filter(
      (entry): entry is BlogAnswerEntry =>
        entry !== null && (entry.question.length > 0 || entry.answer.length > 0),
    );
}

function downloadTextFile(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function FormSubmissionCard({
  submission,
  formConfig,
  onUpdateStatus,
  onSaveToLibrary,
  onDelete,
  saving,
}: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const submitted = useMemo(
    () => new Date(submission.submittedAt).toLocaleString(),
    [submission.submittedAt],
  );

  const isBlogPost = submission.templateType === "vendor-blog-post";
  const blogPost = useMemo(
    () => (isBlogPost ? readBlogPost(submission) : null),
    [isBlogPost, submission],
  );
  const blogAnswers = useMemo(
    () => (isBlogPost ? readBlogAnswers(submission) : []),
    [isBlogPost, submission],
  );

  // Build an ordered list of [label, value, isLong] tuples from the data.
  const entries = useMemo(() => {
    const fields = formConfig?.fields ?? [];
    const seen = new Set<string>();
    const items: Array<{
      id: string;
      label: string;
      value: string;
      isLong: boolean;
    }> = [];
    for (const field of fields) {
      if (field.type === "file") continue;
      const raw = submission.data[field.id];
      seen.add(field.id);
      if (raw === undefined || raw === "" || (Array.isArray(raw) && raw.length === 0)) {
        continue;
      }
      const value =
        Array.isArray(raw)
          ? raw.join(", ")
          : typeof raw === "boolean"
          ? raw
            ? "Yes"
            : "No"
          : String(raw);
      items.push({
        id: field.id,
        label: field.label,
        value,
        isLong:
          field.type === "textarea" ||
          (typeof value === "string" && value.length > 80),
      });
    }
    // Catch any data keys we don't have a field for (form was edited, etc.)
    for (const [k, v] of Object.entries(submission.data)) {
      if (seen.has(k)) continue;
      // Internal payload fields used by special-cased renderers — skip
      // them so the generic entries grid doesn't dump JSON or HTML blobs.
      if (k.startsWith("_")) continue;
      if (k === "blog_post_html" || k === "blog_post_markdown") continue;
      const value =
        Array.isArray(v)
          ? v.join(", ")
          : typeof v === "boolean"
          ? v
            ? "Yes"
            : "No"
          : typeof v === "object"
          ? ""
          : String(v);
      if (!value) continue;
      items.push({ id: k, label: k, value, isLong: value.length > 80 });
    }
    return items;
  }, [formConfig, submission.data]);

  const visibleEntries = entries.slice(0, 4);
  const hasMore = entries.length > 4;

  const imageFiles = submission.files.filter((f) =>
    f.mimeType.startsWith("image/"),
  );
  const otherFiles = submission.files.filter(
    (f) => !f.mimeType.startsWith("image/"),
  );

  return (
    <>
    <article
      style={isBlogPost ? { ...cardStyle, ...blogCardStyle } : cardStyle}
    >
      <header style={cardHeader}>
        <div>
          <span style={isBlogPost ? blogBadgeStyle : badge}>
            {isBlogPost
              ? "BLOG POST"
              : `via ${templateLabel(submission.templateType)}`}
          </span>
          <h3 style={titleStyle}>{submission.formTitle}</h3>
          <div style={metaLine}>
            Submitted {submitted}
            {submission.files.length > 0 && (
              <> · {submission.files.length} file{submission.files.length === 1 ? "" : "s"}</>
            )}
            {blogPost && (
              <> · {blogPost.readingTimeMin} min read</>
            )}
          </div>
        </div>
        <select
          value={submission.status}
          onChange={(e) =>
            onUpdateStatus(e.target.value as FormSubmissionStatus)
          }
          style={statusSelect(submission.status)}
        >
          {FORM_SUBMISSION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </header>

      {blogPost && (
        <div style={blogPreviewBlock}>
          <h2 style={blogPreviewHeadline}>{blogPost.headline}</h2>
          <div
            style={blogPreviewBody}
            dangerouslySetInnerHTML={{ __html: blogPost.html }}
          />
        </div>
      )}

      {isBlogPost && blogAnswers.length > 0 && (
        <details
          style={blogAnswersBlock}
          onToggle={(e) =>
            setShowAnswers((e.target as HTMLDetailsElement).open)
          }
          open={showAnswers}
        >
          <summary style={blogAnswersSummary}>
            {showAnswers
              ? "Hide vendor's original answers"
              : `Show vendor's original answers (${blogAnswers.length})`}
          </summary>
          <div style={blogAnswersList}>
            {blogAnswers.map((entry, idx) => (
              <div key={`ans-${idx}`} style={blogAnswerRow}>
                <div style={blogAnswerQuestion}>{entry.question}</div>
                <div style={blogAnswerText}>{entry.answer}</div>
              </div>
            ))}
          </div>
        </details>
      )}

      {entries.length > 0 && (
        <dl style={dataGrid}>
          {visibleEntries.map((entry) => (
            <div
              key={entry.id}
              style={entry.isLong ? entryRowLong : entryRow}
            >
              <dt style={entryLabel}>{entry.label}</dt>
              <dd style={entryValue}>{entry.value}</dd>
            </div>
          ))}
          {hasMore && (
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              style={moreBtn}
            >
              {`Show ${entries.length - 4} more`}
            </button>
          )}
        </dl>
      )}

      {imageFiles.length > 0 && (
        <div style={imageGrid}>
          {imageFiles.map((file) => (
            <FileThumb key={file.filePath} file={file} />
          ))}
        </div>
      )}

      {otherFiles.length > 0 && (
        <div style={otherFilesRow}>
          {otherFiles.map((f) => (
            <a
              key={f.filePath}
              href={f.filePath}
              target="_blank"
              rel="noopener noreferrer"
              style={fileLink}
            >
              {f.fileName}
            </a>
          ))}
        </div>
      )}

      <footer style={footerStyle}>
        <button
          type="button"
          onClick={onSaveToLibrary}
          style={primaryCta}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save All to Media Library"}
        </button>
        {blogPost && (
          <>
            <button
              type="button"
              onClick={() =>
                downloadTextFile(
                  `${slugify(blogPost.headline)}.md`,
                  blogPost.markdown,
                  "text/markdown",
                )
              }
              style={ghostExportBtn}
            >
              Export as Markdown
            </button>
            <button
              type="button"
              onClick={() =>
                downloadTextFile(
                  `${slugify(blogPost.headline)}.html`,
                  buildHtmlDocument(blogPost),
                  "text/html",
                )
              }
              style={ghostExportBtn}
            >
              Export as HTML
            </button>
          </>
        )}
        <button type="button" onClick={onDelete} style={ghostBtnDanger}>
          Delete
        </button>
      </footer>
    </article>
    {detailsOpen && (
      <SubmissionDetailsDialog
        submission={submission}
        entries={entries}
        imageFiles={imageFiles}
        otherFiles={otherFiles}
        submitted={submitted}
        onClose={() => setDetailsOpen(false)}
      />
    )}
    </>
  );
}

interface DetailsDialogProps {
  submission: FormSubmission;
  entries: Array<{ id: string; label: string; value: string; isLong: boolean }>;
  imageFiles: SubmissionFile[];
  otherFiles: SubmissionFile[];
  submitted: string;
  onClose: () => void;
}

function SubmissionDetailsDialog({
  submission,
  entries,
  imageFiles,
  otherFiles,
  submitted,
  onClose,
}: DetailsDialogProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Submission details"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={dialogBackdrop}
    >
      <div style={dialogPanel}>
        <header style={dialogHeader}>
          <div>
            <div style={dialogEyebrow}>{submission.formTitle}</div>
            <div style={dialogMeta}>
              Submitted {submitted}
              {submission.files.length > 0 && (
                <> · {submission.files.length} file{submission.files.length === 1 ? "" : "s"}</>
              )}
              {entries.length > 0 && (
                <> · {entries.length} field{entries.length === 1 ? "" : "s"}</>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={dialogCloseBtn}
          >
            ×
          </button>
        </header>

        <div style={dialogBody}>
          {entries.length > 0 && (
            <section>
              <h4 style={dialogSectionTitle}>All fields</h4>
              <dl style={dialogFieldGrid}>
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    style={entry.isLong ? entryRowLong : entryRow}
                  >
                    <dt style={entryLabel}>{entry.label}</dt>
                    <dd style={entryValue}>{entry.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {imageFiles.length > 0 && (
            <section>
              <h4 style={dialogSectionTitle}>
                Images ({imageFiles.length})
              </h4>
              <div style={dialogImageGrid}>
                {imageFiles.map((file) => (
                  <a
                    key={file.filePath}
                    href={file.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={file.fileName}
                    style={dialogThumbLink}
                  >
                    <img
                      src={file.filePath}
                      alt={file.fileName}
                      style={dialogThumbImage}
                    />
                    <div style={dialogThumbCaption}>{file.fileName}</div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {otherFiles.length > 0 && (
            <section>
              <h4 style={dialogSectionTitle}>
                Other files ({otherFiles.length})
              </h4>
              <div style={otherFilesRow}>
                {otherFiles.map((f) => (
                  <a
                    key={f.filePath}
                    href={f.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={fileLink}
                  >
                    {f.fileName}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "blog-post"
  );
}

function buildHtmlDocument(post: BlogPostPayload): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(post.headline)}</title>
</head>
<body>
${post.html}
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function FileThumb({ file }: { file: SubmissionFile }) {
  return (
    <a
      href={file.filePath}
      target="_blank"
      rel="noopener noreferrer"
      style={thumbLink}
      title={file.fileName}
    >
      <img src={file.filePath} alt={file.fileName} style={thumbImage} />
    </a>
  );
}

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 20,
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.08)",
  borderRadius: 14,
  boxShadow: "3px 3px 0 rgba(212,168,83,0.18)",
  minWidth: 0,
  overflow: "hidden",
};

const cardHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const badge: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "3px 8px",
  background: "var(--blush)",
  color: "var(--deep-pink)",
  borderRadius: 999,
  display: "inline-block",
  marginBottom: 6,
};

const titleStyle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 22,
  color: "var(--wine)",
  margin: "0 0 4px",
  lineHeight: 1.15,
};

const metaLine: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
};

function statusSelect(status: FormSubmissionStatus): CSSProperties {
  const tones: Record<FormSubmissionStatus, { bg: string; color: string }> = {
    new: { bg: "var(--deep-pink)", color: "var(--cream)" },
    reviewed: { bg: "var(--gold)", color: "var(--wine)" },
    "saved-to-library": { bg: "rgba(212,168,83,0.4)", color: "var(--wine)" },
    used: { bg: "rgba(75,21,40,0.12)", color: "var(--mauve)" },
    rejected: { bg: "rgba(75,21,40,0.06)", color: "var(--mauve)" },
  };
  const tone = tones[status];
  return {
    fontFamily: "'Syne', sans-serif",
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    padding: "6px 10px",
    background: tone.bg,
    color: tone.color,
    border: "none",
    borderRadius: 999,
    cursor: "pointer",
  };
}

const dataGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gap: 8,
  margin: 0,
  minWidth: 0,
};

const entryRow: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: "8px 10px",
  background: "white",
  borderRadius: 6,
  border: "1px solid rgba(75,21,40,0.06)",
  minWidth: 0,
  overflow: "hidden",
};

const entryRowLong: CSSProperties = {
  ...entryRow,
  gridColumn: "1 / -1",
};

const entryLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--mauve)",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const entryValue: CSSProperties = {
  margin: 0,
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--wine)",
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const moreBtn: CSSProperties = {
  gridColumn: "1 / -1",
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  background: "transparent",
  border: "1px dashed rgba(75,21,40,0.25)",
  color: "var(--mauve)",
  borderRadius: 4,
  cursor: "pointer",
  padding: "6px 10px",
};

const imageGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
  gap: 6,
};

const thumbLink: CSSProperties = {
  display: "block",
  aspectRatio: "1 / 1",
  borderRadius: 6,
  overflow: "hidden",
  background: "white",
  border: "1px solid rgba(75,21,40,0.08)",
};

const thumbImage: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const otherFilesRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const fileLink: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--deep-pink)",
  textDecoration: "underline",
  padding: "4px 8px",
  background: "white",
  borderRadius: 4,
};

const footerStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: "auto",
  paddingTop: 8,
  borderTop: "1px dashed rgba(75,21,40,0.12)",
};

const primaryCta: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "10px 14px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: "2px 2px 0 var(--gold)",
};

const ghostBtnDanger: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "8px 14px",
  background: "transparent",
  color: "var(--deep-pink)",
  border: "1px dashed rgba(193,56,95,0.4)",
  borderRadius: 4,
  cursor: "pointer",
};

const ghostExportBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "8px 14px",
  background: "transparent",
  color: "var(--wine)",
  border: "1px dashed rgba(75,21,40,0.3)",
  borderRadius: 4,
  cursor: "pointer",
};

const blogCardStyle: CSSProperties = {
  borderTop: "3px solid var(--deep-pink)",
};

const blogBadgeStyle: CSSProperties = {
  ...badge,
  background: "var(--wine)",
  color: "var(--cream)",
  letterSpacing: 1.8,
};

const blogPreviewBlock: CSSProperties = {
  background: "white",
  border: "1px solid rgba(75,21,40,0.08)",
  borderRadius: 12,
  padding: "20px 24px",
  boxShadow: "inset 0 1px 0 rgba(212,168,83,0.18)",
  maxHeight: 420,
  overflow: "auto",
};

const blogPreviewHeadline: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 28,
  lineHeight: 1.15,
  color: "var(--wine)",
  margin: "0 0 12px",
};

const blogPreviewBody: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  lineHeight: 1.7,
  color: "#2A0C18",
};

const blogAnswersBlock: CSSProperties = {
  background: "var(--blush)",
  border: "1px dashed rgba(193,56,95,0.25)",
  borderRadius: 10,
  padding: "10px 14px",
};

const blogAnswersSummary: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--deep-pink)",
  cursor: "pointer",
  outline: "none",
};

const blogAnswersList: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  marginTop: 10,
};

const blogAnswerRow: CSSProperties = {
  background: "white",
  borderRadius: 8,
  padding: "8px 10px",
};

const blogAnswerQuestion: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--mauve)",
  marginBottom: 4,
};

const blogAnswerText: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--wine)",
  lineHeight: 1.55,
  whiteSpace: "pre-wrap",
};

const dialogBackdrop: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "rgba(75,21,40,0.55)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "5vh 16px",
  overflowY: "auto",
};

const dialogPanel: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: 840,
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.15)",
  borderRadius: 14,
  boxShadow: "0 20px 50px rgba(75,21,40,0.35)",
  display: "flex",
  flexDirection: "column",
  maxHeight: "90vh",
};

const dialogHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  padding: "20px 24px 12px",
  borderBottom: "1px solid rgba(75,21,40,0.08)",
};

const dialogEyebrow: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 24,
  color: "var(--wine)",
  lineHeight: 1.15,
  marginBottom: 4,
};

const dialogMeta: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
};

const dialogCloseBtn: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  border: "1px solid rgba(75,21,40,0.2)",
  background: "var(--cream)",
  color: "var(--wine)",
  fontFamily: "'Syne', sans-serif",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const dialogBody: CSSProperties = {
  padding: "16px 24px 24px",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 24,
};

const dialogSectionTitle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--mauve)",
  margin: "0 0 10px",
};

const dialogFieldGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 8,
  margin: 0,
};

const dialogImageGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 10,
};

const dialogThumbLink: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  textDecoration: "none",
  color: "var(--mauve)",
};

const dialogThumbImage: CSSProperties = {
  width: "100%",
  aspectRatio: "1 / 1",
  objectFit: "cover",
  borderRadius: 8,
  border: "1px solid rgba(75,21,40,0.08)",
  background: "white",
};

const dialogThumbCaption: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  color: "var(--mauve)",
  textAlign: "center",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
