"use client";

/**
 * Submission Inbox — local staging area for vendor / planner submissions.
 *
 * Read/write through `submissions-store.ts`. Adding a submission opens
 * AddSubmissionDialog. "Create Post From This" hands the submission to
 * CreatePostFromSubmissionDialog which suggests a template, prefills
 * content, and creates a calendar item.
 */

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useToast } from "@/components/app/ToastProvider";
import {
  SUBMISSION_STATUSES,
  SUBMISSION_TYPES,
  VENDOR_CATEGORIES,
  addSubmission,
  deleteSubmission,
  getAllSubmissions,
  submissionStatusLabel,
  submissionTypeLabel,
  updateSubmission,
  vendorCategoryLabel,
} from "@/lib/db/submissions-store";
import type {
  CalendarItem,
  SubmissionStatus,
  SubmissionType,
  VendorCategory,
  VendorSubmission,
  VendorSubmissionInput,
} from "@/lib/types";
import { AddSubmissionDialog } from "./AddSubmissionDialog";
import { CreatePostFromSubmissionDialog } from "./CreatePostFromSubmissionDialog";
import { FormSubmissionsView } from "./FormSubmissionsView";
import { EmailComposerModal } from "./EmailComposerModal";
import {
  addMediaItem,
  generateImageThumbnail,
  generateTextThumbnail,
} from "@/lib/db/media-store";

interface FilterState {
  vendor: string;
  category: VendorCategory | "all";
  type: SubmissionType | "all";
  status: SubmissionStatus | "all";
}

const EMPTY_FILTERS: FilterState = {
  vendor: "",
  category: "all",
  type: "all",
  status: "all",
};

export function SubmissionInboxView() {
  const toast = useToast();
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<VendorSubmission[]>([]);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<VendorSubmission | null>(null);
  const [creatingFor, setCreatingFor] = useState<VendorSubmission | null>(null);
  const [quickSendOpen, setQuickSendOpen] = useState(false);

  useEffect(() => {
    setItems(getAllSubmissions());
    setHydrated(true);
  }, []);

  function refresh() {
    setItems(getAllSubmissions());
  }

  function handleCreate(input: VendorSubmissionInput) {
    addSubmission(input);
    refresh();
    toast.success("Submission added to inbox.");
  }

  function handleSaveEdit(input: VendorSubmissionInput) {
    if (!editing) return;
    updateSubmission(editing.id, {
      vendor_name: input.vendor_name,
      category: input.category,
      submission_type: input.submission_type,
      text_content: input.text_content,
      image_urls: input.image_urls,
      notes: input.notes,
      status: input.status,
    });
    setEditing(null);
    refresh();
    toast.success("Submission updated.");
  }

  function handleDelete(id: string) {
    if (
      !window.confirm(
        "Delete this submission? The original is gone unless you exported a backup.",
      )
    ) {
      return;
    }
    deleteSubmission(id);
    refresh();
    toast.success("Submission deleted.");
  }

  function handleCycleStatus(item: VendorSubmission) {
    const order: SubmissionStatus[] = ["new", "planned", "used"];
    const next = order[(order.indexOf(item.status) + 1) % order.length];
    updateSubmission(item.id, { status: next });
    refresh();
    toast.info(`Marked ${submissionStatusLabel(next).toLowerCase()}.`);
  }

  function handleCreated(_item: CalendarItem) {
    refresh();
    toast.success("Added to the calendar — open the editor to fine-tune.");
  }

  async function handleSaveToLibrary(submission: VendorSubmission) {
    let savedCount = 0;
    let errorCount = 0;
    const tags = [submission.category, submission.submission_type];
    for (const url of submission.image_urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const fileName =
          url.split("/").pop()?.split("?")[0] || `${submission.vendor_name}.jpg`;
        const thumb = await generateImageThumbnail(blob);
        await addMediaItem({
          type: "image",
          fileName,
          mimeType: blob.type || "image/jpeg",
          fileBlob: blob,
          thumbnailBlob: thumb.blob,
          width: thumb.width,
          height: thumb.height,
          fileSize: blob.size,
          tags,
          source: "vendor-submission",
          collection: "Vendor Photos",
          vendorName: submission.vendor_name,
          vendorCategory: submission.category,
          submissionId: submission.id,
        });
        savedCount += 1;
      } catch (err) {
        errorCount += 1;
        console.warn("[media] failed to save image", url, err);
      }
    }
    if (submission.text_content.trim()) {
      try {
        const title = `${submission.vendor_name} — ${submissionTypeLabel(submission.submission_type)}`;
        const thumbnailBlob = generateTextThumbnail(submission.text_content, title);
        await addMediaItem({
          type: "text",
          fileName: title,
          mimeType: "text/plain",
          fileBlob: new Blob([submission.text_content], { type: "text/plain" }),
          thumbnailBlob,
          fileSize: new Blob([submission.text_content]).size,
          textContent: submission.text_content,
          tags,
          source: "vendor-submission",
          collection: "Text & Quotes",
          vendorName: submission.vendor_name,
          vendorCategory: submission.category,
          submissionId: submission.id,
          notes: submission.notes,
        });
        savedCount += 1;
      } catch (err) {
        errorCount += 1;
        console.warn("[media] failed to save text", err);
      }
    }
    if (savedCount > 0) {
      // Touch the submission so we have a record that content was saved.
      updateSubmission(submission.id, {
        notes: submission.notes
          ? `${submission.notes}\n[Content saved to Media Library on ${new Date().toLocaleDateString()}]`
          : `[Content saved to Media Library on ${new Date().toLocaleDateString()}]`,
      });
      refresh();
      toast.success(
        `Saved ${savedCount} item${savedCount === 1 ? "" : "s"} to Media Library${errorCount > 0 ? ` (${errorCount} failed)` : ""}.`,
      );
    } else if (errorCount > 0) {
      toast.error(`Couldn't save ${errorCount} item${errorCount === 1 ? "" : "s"} — check console for details.`);
    } else {
      toast.info("Nothing to save — submission has no content.");
    }
  }

  const filtered = useMemo(() => {
    return items.filter((s) => {
      if (
        filters.vendor &&
        !s.vendor_name.toLowerCase().includes(filters.vendor.toLowerCase())
      ) {
        return false;
      }
      if (filters.category !== "all" && s.category !== filters.category)
        return false;
      if (filters.type !== "all" && s.submission_type !== filters.type)
        return false;
      if (filters.status !== "all" && s.status !== filters.status) return false;
      return true;
    });
  }, [items, filters]);

  const filtersActive =
    filters.vendor !== "" ||
    filters.category !== "all" ||
    filters.type !== "all" ||
    filters.status !== "all";

  const statusCounts = useMemo(() => {
    const c: Record<SubmissionStatus, number> = { new: 0, planned: 0, used: 0 };
    for (const s of items) c[s.status] += 1;
    return c;
  }, [items]);

  return (
    <div className="marigold-page-pad" style={pageStyle}>
      <header style={heroBlock}>
        <div style={eyebrowStyle}>The Marigold Content Studio</div>
        <h1 style={titleStyle}>
          Submission <i style={{ color: "var(--hot-pink)" }}>Inbox</i>
        </h1>
        <p style={leadStyle}>
          Vendor and planner content lives here until you turn it into a post.
          Submissions from your public forms appear automatically; add manual
          entries below for content that arrived via DM or email.
        </p>

        <div style={topActionsRow}>
          <button
            type="button"
            onClick={() => setQuickSendOpen(true)}
            style={requestContentBtn}
          >
            ✉️ Request Content
          </button>
          <Link href="/settings" style={settingsLink}>
            Manage forms in Settings →
          </Link>
        </div>

        <div style={statRow}>
          <Stat label="Total" value={items.length} />
          <Stat label="New" value={statusCounts.new} accent="var(--deep-pink)" />
          <Stat
            label="Planned"
            value={statusCounts.planned}
            accent="var(--gold)"
          />
          <Stat label="Used" value={statusCounts.used} accent="var(--mauve)" />
        </div>
      </header>

      <FormSubmissionsView />

      <div style={dividerBlock}>
        <span style={dividerLine} />
        <div style={dividerLabel}>Manual entries</div>
        <span style={dividerLine} />
      </div>

      <section style={controlsRow}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flex: 1 }}>
          <input
            type="search"
            value={filters.vendor}
            onChange={(e) =>
              setFilters((f) => ({ ...f, vendor: e.target.value }))
            }
            placeholder="Search vendor / planner…"
            style={{ ...selectStyle, minWidth: 220 }}
          />
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                category: e.target.value as VendorCategory | "all",
              }))
            }
            style={selectStyle}
          >
            <option value="all">All categories</option>
            {VENDOR_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                type: e.target.value as SubmissionType | "all",
              }))
            }
            style={selectStyle}
          >
            <option value="all">All types</option>
            {SUBMISSION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                status: e.target.value as SubmissionStatus | "all",
              }))
            }
            style={selectStyle}
          >
            <option value="all">All statuses</option>
            {SUBMISSION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {filtersActive && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              style={ghostButton}
            >
              Clear
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          style={primaryAction}
        >
          + Add Submission
        </button>
      </section>

      {!hydrated ? (
        <div style={loadingHint}>loading the inbox…</div>
      ) : items.length === 0 ? (
        <EmptyInbox onAdd={() => setAddOpen(true)} />
      ) : filtered.length === 0 ? (
        <NoMatches onClear={() => setFilters(EMPTY_FILTERS)} />
      ) : (
        <div style={cardGrid}>
          {filtered.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onEdit={() => setEditing(submission)}
              onDelete={() => handleDelete(submission.id)}
              onCycleStatus={() => handleCycleStatus(submission)}
              onCreatePost={() => setCreatingFor(submission)}
              onSaveToLibrary={() => void handleSaveToLibrary(submission)}
            />
          ))}
        </div>
      )}

      <AddSubmissionDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleCreate}
      />
      <AddSubmissionDialog
        open={editing !== null}
        initial={editing}
        onClose={() => setEditing(null)}
        onSubmit={handleSaveEdit}
      />
      <CreatePostFromSubmissionDialog
        open={creatingFor !== null}
        submission={creatingFor}
        onClose={() => setCreatingFor(null)}
        onCreated={handleCreated}
      />
      <EmailComposerModal
        open={quickSendOpen}
        onClose={() => setQuickSendOpen(false)}
        onToast={(msg) => toast.success(msg)}
        initialFormType="vendor-portfolio"
        url=""
        allowFormTypeChange
      />
    </div>
  );
}

interface SubmissionCardProps {
  submission: VendorSubmission;
  onEdit: () => void;
  onDelete: () => void;
  onCycleStatus: () => void;
  onCreatePost: () => void;
  onSaveToLibrary: () => void;
}

function SubmissionCard({
  submission,
  onEdit,
  onDelete,
  onCycleStatus,
  onCreatePost,
  onSaveToLibrary,
}: SubmissionCardProps) {
  const previewText = submission.text_content.trim();
  const truncated =
    previewText.length > 240 ? `${previewText.slice(0, 240)}…` : previewText;
  const imageCount = submission.image_urls.length;

  return (
    <article style={cardStyle}>
      <header style={cardHeader}>
        <div>
          <div style={vendorName}>{submission.vendor_name}</div>
          <div style={categoryLine}>
            {vendorCategoryLabel(submission.category)}
          </div>
        </div>
        <button
          type="button"
          onClick={onCycleStatus}
          style={statusBadgeStyle(submission.status)}
          title="Click to cycle status"
        >
          {submissionStatusLabel(submission.status)}
        </button>
      </header>

      <div style={typeBadge}>
        {submissionTypeLabel(submission.submission_type)}
      </div>

      {truncated && <p style={previewStyle}>{truncated}</p>}

      {imageCount > 0 && (
        <div style={imageRow}>
          <span style={imageCountBadge}>
            {imageCount} image{imageCount === 1 ? "" : "s"}
          </span>
          {submission.image_urls.slice(0, 3).map((url, idx) => (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={imageLink}
              title={url}
            >
              link {idx + 1}
            </a>
          ))}
          {imageCount > 3 && (
            <span style={moreLinks}>+{imageCount - 3} more</span>
          )}
        </div>
      )}

      {submission.notes && (
        <div style={notesStyle} title={submission.notes}>
          <span style={notesEyebrow}>notes</span> {submission.notes}
        </div>
      )}

      {submission.linked_calendar_item_id && (
        <Link
          href={`/editor/${submission.linked_calendar_item_id}`}
          style={linkedItemStyle}
        >
          → Open the post that uses this
        </Link>
      )}

      <footer style={cardFooter}>
        <button type="button" onClick={onCreatePost} style={primaryCta}>
          Create Post From This
        </button>
        <button type="button" onClick={onSaveToLibrary} style={ghostButton}>
          Save to Media Library
        </button>
        <button type="button" onClick={onEdit} style={ghostButton}>
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          style={{ ...ghostButton, color: "var(--deep-pink)" }}
        >
          Delete
        </button>
      </footer>
    </article>
  );
}

function Stat({
  label,
  value,
  accent = "var(--wine)",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div style={statBlock}>
      <div style={{ ...statValue, color: accent }}>{value}</div>
      <div style={statLabel}>{label}</div>
    </div>
  );
}

function EmptyInbox({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={emptyState}>
      <div style={emptyTitle}>Inbox is empty.</div>
      <p style={emptyHint}>
        Send a vendor one of the request templates from{" "}
        <Link href="/settings" style={inlineLink}>
          Brand Settings → Vendor Submissions
        </Link>
        , then drop their reply into the inbox here so it never gets lost in a
        DM.
      </p>
      <button type="button" onClick={onAdd} style={primaryAction}>
        + Add Submission
      </button>
    </div>
  );
}

function NoMatches({ onClear }: { onClear: () => void }) {
  return (
    <div style={emptyState}>
      <div style={emptyTitle}>No submissions match those filters.</div>
      <button type="button" onClick={onClear} style={ghostButton}>
        Clear filters
      </button>
    </div>
  );
}

function statusBadgeStyle(status: SubmissionStatus): CSSProperties {
  const map: Record<SubmissionStatus, { bg: string; color: string }> = {
    new: { bg: "var(--deep-pink)", color: "var(--cream)" },
    planned: { bg: "var(--gold)", color: "var(--wine)" },
    used: { bg: "rgba(75,21,40,0.12)", color: "var(--mauve)" },
  };
  const tone = map[status];
  return {
    fontFamily: "'Syne', sans-serif",
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    padding: "6px 12px",
    background: tone.bg,
    color: tone.color,
    border: "none",
    borderRadius: 999,
    cursor: "pointer",
  };
}

const pageStyle: CSSProperties = {
  background: "var(--cream)",
  minHeight: "100vh",
};

const heroBlock: CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto 24px",
};

const eyebrowStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 6,
  color: "var(--pink)",
  marginBottom: 10,
};

const titleStyle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 72,
  color: "var(--wine)",
  lineHeight: 1,
  marginBottom: 14,
};

const leadStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 16,
  color: "var(--mauve)",
  lineHeight: 1.6,
  maxWidth: 720,
  marginBottom: 20,
};

const inlineLink: CSSProperties = {
  color: "var(--deep-pink)",
  textDecoration: "underline",
};

const topActionsRow: CSSProperties = {
  display: "flex",
  gap: 14,
  flexWrap: "wrap",
  alignItems: "center",
  marginBottom: 18,
};

const requestContentBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  padding: "12px 22px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: "3px 3px 0 var(--gold)",
};

const settingsLink: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--deep-pink)",
  textDecoration: "underline",
};

const statRow: CSSProperties = {
  display: "flex",
  gap: 24,
  flexWrap: "wrap",
  marginTop: 8,
};

const statBlock: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};

const statValue: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 36,
  lineHeight: 1,
};

const statLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--mauve)",
  marginTop: 4,
};

const controlsRow: CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto 20px",
  display: "flex",
  gap: 16,
  alignItems: "flex-start",
  justifyContent: "space-between",
  flexWrap: "wrap",
};

const selectStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  padding: "10px 12px",
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.2)",
  borderRadius: 6,
  color: "var(--wine)",
};

const primaryAction: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  padding: "12px 22px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: "3px 3px 0 var(--gold)",
};

const ghostButton: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "8px 14px",
  background: "transparent",
  color: "var(--mauve)",
  border: "1px dashed rgba(75,21,40,0.3)",
  borderRadius: 4,
  cursor: "pointer",
};

const cardGrid: CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: 20,
};

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 20,
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.08)",
  borderRadius: 14,
  boxShadow: "3px 3px 0 rgba(212,168,83,0.18)",
};

const cardHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const vendorName: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 22,
  color: "var(--wine)",
  lineHeight: 1.15,
};

const categoryLine: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--mauve)",
  marginTop: 4,
};

const typeBadge: CSSProperties = {
  alignSelf: "flex-start",
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "4px 10px",
  background: "var(--blush)",
  color: "var(--deep-pink)",
  borderRadius: 999,
};

const previewStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--wine)",
  lineHeight: 1.55,
  margin: 0,
  whiteSpace: "pre-wrap",
};

const imageRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const imageCountBadge: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--gold)",
};

const imageLink: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
  textDecoration: "underline",
};

const moreLinks: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
};

const notesStyle: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 16,
  color: "var(--mauve)",
  lineHeight: 1.4,
  padding: "8px 10px",
  background: "rgba(212,168,83,0.1)",
  borderRadius: 6,
};

const notesEyebrow: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--gold)",
  marginRight: 6,
};

const linkedItemStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--deep-pink)",
  textDecoration: "none",
};

const cardFooter: CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: "auto",
  paddingTop: 8,
  borderTop: "1px dashed rgba(75,21,40,0.12)",
  flexWrap: "wrap",
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

const emptyState: CSSProperties = {
  maxWidth: 720,
  margin: "32px auto",
  padding: "56px 32px",
  background: "var(--blush)",
  border: "1px dashed rgba(75,21,40,0.25)",
  borderRadius: 18,
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 14,
};

const emptyTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 36,
  color: "var(--wine)",
  fontStyle: "italic",
  lineHeight: 1.1,
};

const emptyHint: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve)",
  lineHeight: 1.55,
  maxWidth: 520,
  margin: 0,
};

const loadingHint: CSSProperties = {
  padding: 80,
  textAlign: "center",
  fontFamily: "'Caveat', cursive",
  fontSize: 28,
  color: "var(--mauve)",
};

const dividerBlock: CSSProperties = {
  maxWidth: 1180,
  margin: "8px auto 24px",
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const dividerLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 4,
  color: "var(--mauve)",
  whiteSpace: "nowrap",
};

const dividerLine: CSSProperties = {
  flex: 1,
  height: 1,
  background: "rgba(75,21,40,0.12)",
};
