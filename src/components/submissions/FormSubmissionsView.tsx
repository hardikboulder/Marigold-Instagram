"use client";

/**
 * Form Submissions inbox — submissions captured from public /submit/[formId]
 * forms. Shown above the manual VendorSubmission inbox on the Submissions
 * page.
 *
 * Top-level tab bar groups submissions by form template type. The
 * "Save All to Media Library" action grabs every photo + text quote in a
 * submission and tags them with the form metadata.
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
  FORM_TEMPLATE_SEEDS,
} from "@/lib/db/form-templates";
import {
  deleteFormSubmission,
  getAllFormSubmissions,
  setLastSeenAt,
  syncFromPublicIndex,
  updateFormSubmission,
} from "@/lib/db/form-submissions-store";
import { getAllForms } from "@/lib/db/forms-store";
import {
  addMediaItem,
  generateImageThumbnail,
  generateTextThumbnail,
} from "@/lib/db/media-store";
import type {
  FormConfig,
  FormSubmission,
  FormSubmissionStatus,
  FormTemplateType,
} from "@/lib/types";
import { FormSubmissionCard } from "./FormSubmissionCard";

type TabKey = "all" | FormTemplateType;

const STATIC_TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "vendor", label: "Vendors" },
  { key: "vendor-portfolio", label: "Vendor Portfolio" },
  { key: "vendor-tips", label: "Vendor Tips" },
  { key: "vendor-blog-post", label: "Blog Posts" },
  { key: "venue", label: "Venue" },
  { key: "bride-confession", label: "Confessions" },
  { key: "bride-connect", label: "Bride Connect" },
  { key: "bride-diary", label: "Bride Diary" },
  { key: "wedding-recap", label: "Wedding Recap" },
  { key: "general", label: "General" },
];

export function FormSubmissionsView() {
  const toast = useToast();
  const [items, setItems] = useState<FormSubmission[]>([]);
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [tab, setTab] = useState<TabKey>("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  function refresh() {
    setItems(getAllFormSubmissions());
    setForms(getAllForms());
  }

  useEffect(() => {
    // Pull in any submissions written by the API route to /public/submissions
    // since we last opened the studio.
    syncFromPublicIndex().then((res) => {
      refresh();
      if (res.added > 0) {
        toast.success(
          `${res.added} new submission${res.added === 1 ? "" : "s"} synced from public forms.`,
        );
      }
      // Mark everything as "seen" so the badge in the nav resets.
      setLastSeenAt(new Date().toISOString());
    });
    refresh();
    // Light polling so the inbox stays warm if the studio was already open.
    const handle = window.setInterval(() => {
      syncFromPublicIndex().then(() => refresh());
    }, 15000);
    return () => window.clearInterval(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formsById = useMemo(() => {
    const map = new Map<string, FormConfig>();
    for (const f of forms) map.set(f.id, f);
    return map;
  }, [forms]);

  const filtered = useMemo(() => {
    if (tab === "all") return items;
    return items.filter((s) => s.templateType === tab);
  }, [items, tab]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const seed of FORM_TEMPLATE_SEEDS) map[seed.type] = 0;
    for (const item of items) {
      map[item.templateType] = (map[item.templateType] ?? 0) + 1;
    }
    return map;
  }, [items]);

  const newCount = items.filter((s) => s.status === "new").length;

  function handleStatus(id: string, status: FormSubmissionStatus) {
    updateFormSubmission(id, { status });
    refresh();
  }

  function handleDelete(id: string) {
    if (
      !window.confirm(
        "Delete this submission? Files stay on disk but the record is gone.",
      )
    )
      return;
    deleteFormSubmission(id);
    refresh();
    toast.success("Submission deleted.");
  }

  async function handleSaveToLibrary(submission: FormSubmission) {
    setSavingId(submission.id);
    let saved = 0;
    let failed = 0;
    const formConfig = formsById.get(submission.formId) ?? null;
    const tags = [submission.templateType.replace(/-/g, " ")];

    // Save images
    for (const file of submission.files) {
      if (!file.mimeType.startsWith("image/")) continue;
      try {
        const res = await fetch(file.filePath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const thumb = await generateImageThumbnail(blob);
        await addMediaItem({
          type: "image",
          fileName: file.fileName,
          mimeType: blob.type || file.mimeType,
          fileBlob: blob,
          thumbnailBlob: thumb.blob,
          width: thumb.width,
          height: thumb.height,
          fileSize: blob.size,
          tags,
          source: "vendor-submission",
          collection: "Form Submissions",
          notes: `From "${submission.formTitle}"`,
        });
        saved += 1;
      } catch (err) {
        failed += 1;
        console.warn("[forms] failed to save image", file.filePath, err);
      }
    }

    // Save text content (the long-form fields).
    const textBlocks: string[] = [];
    if (formConfig) {
      for (const field of formConfig.fields) {
        if (field.type !== "textarea" && field.type !== "text") continue;
        const value = submission.data[field.id];
        if (typeof value === "string" && value.trim().length > 30) {
          textBlocks.push(`${field.label}\n${value.trim()}`);
        }
      }
    }
    if (textBlocks.length > 0) {
      const combined = textBlocks.join("\n\n");
      try {
        const title = `${submission.formTitle} — ${submission.id.slice(0, 6)}`;
        const thumb = generateTextThumbnail(combined, title);
        await addMediaItem({
          type: "text",
          fileName: title,
          mimeType: "text/plain",
          fileBlob: new Blob([combined], { type: "text/plain" }),
          thumbnailBlob: thumb,
          fileSize: new Blob([combined]).size,
          textContent: combined,
          tags,
          source: "vendor-submission",
          collection: "Form Submissions",
          notes: `From "${submission.formTitle}"`,
        });
        saved += 1;
      } catch (err) {
        failed += 1;
        console.warn("[forms] failed to save text", err);
      }
    }

    setSavingId(null);
    if (saved > 0) {
      updateFormSubmission(submission.id, { status: "saved-to-library" });
      refresh();
      toast.success(
        `Saved ${saved} item${saved === 1 ? "" : "s"} to Media Library${failed > 0 ? ` (${failed} failed)` : ""}.`,
      );
    } else if (failed > 0) {
      toast.error(`Couldn't save ${failed} item${failed === 1 ? "" : "s"}.`);
    } else {
      toast.info("Nothing to save — submission has no photos or long-form text.");
    }
  }

  return (
    <section style={sectionStyle}>
      <header style={headerRow}>
        <div>
          <h2 style={titleStyle}>
            Form <i>Submissions</i>
          </h2>
          <p style={leadStyle}>
            Submissions from your shareable forms land here automatically.{" "}
            <Link href="/settings" style={inlineLink}>
              Manage forms in Settings
            </Link>
            .
          </p>
        </div>
        <div style={statRow}>
          <Stat label="Total" value={items.length} />
          <Stat label="New" value={newCount} accent="var(--deep-pink)" />
        </div>
      </header>

      <nav style={tabsBar} role="tablist" aria-label="Form template filter">
        {STATIC_TABS.map((t) => {
          const count = counts[t.key] ?? 0;
          const isActive = tab === t.key;
          if (t.key !== "all" && count === 0) return null;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(t.key)}
              style={{
                ...tabBtn,
                ...(isActive ? tabBtnActive : null),
              }}
            >
              {t.label}
              <span style={tabCount}>{count}</span>
            </button>
          );
        })}
      </nav>

      {filtered.length === 0 ? (
        <Empty />
      ) : (
        <div style={cardGrid}>
          {filtered.map((submission) => (
            <FormSubmissionCard
              key={submission.id}
              submission={submission}
              formConfig={formsById.get(submission.formId) ?? null}
              saving={savingId === submission.id}
              onUpdateStatus={(status) => handleStatus(submission.id, status)}
              onSaveToLibrary={() => handleSaveToLibrary(submission)}
              onDelete={() => handleDelete(submission.id)}
            />
          ))}
        </div>
      )}
    </section>
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

function Empty() {
  return (
    <div style={emptyStyle}>
      <div style={emptyTitle}>No form submissions yet.</div>
      <p style={emptyHint}>
        Create a form in <Link href="/settings" style={inlineLink}>Settings → Submission Forms</Link>,
        share the link, and submissions will appear here.
      </p>
    </div>
  );
}

const sectionStyle: CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto 32px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const headerRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
};

const titleStyle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 36,
  color: "var(--wine)",
  margin: "0 0 6px",
  lineHeight: 1,
};

const leadStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve)",
  lineHeight: 1.55,
  maxWidth: 560,
  margin: 0,
};

const inlineLink: CSSProperties = {
  color: "var(--deep-pink)",
  textDecoration: "underline",
};

const statRow: CSSProperties = {
  display: "flex",
  gap: 24,
};

const statBlock: CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const statValue: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 28,
  lineHeight: 1,
  color: "var(--wine)",
};

const statLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--mauve)",
  marginTop: 4,
};

const tabsBar: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  paddingBottom: 6,
  borderBottom: "1px solid rgba(75,21,40,0.1)",
};

const tabBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "8px 14px",
  background: "transparent",
  color: "var(--mauve)",
  border: "1px solid transparent",
  borderRadius: 999,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const tabBtnActive: CSSProperties = {
  background: "var(--wine)",
  color: "var(--cream)",
  borderColor: "var(--wine)",
};

const tabCount: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 10,
  background: "rgba(255,255,255,0.2)",
  padding: "1px 6px",
  borderRadius: 999,
};

const cardGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
  gap: 18,
};

const emptyStyle: CSSProperties = {
  padding: "40px 20px",
  textAlign: "center",
  background: "var(--blush)",
  borderRadius: 12,
  border: "1px dashed rgba(75,21,40,0.2)",
};

const emptyTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 24,
  color: "var(--wine)",
  fontStyle: "italic",
  marginBottom: 8,
};

const emptyHint: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve)",
  margin: 0,
};
