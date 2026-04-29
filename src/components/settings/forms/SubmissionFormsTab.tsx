"use client";

/**
 * Settings → Submission Forms tab.
 *
 * Three sub-sections:
 *   - Form Types — the seven canonical public forms keyed by slug
 *     (`/submit/vendor-portfolio`, `/submit/bride-confession`, …). These
 *     are always present, even on a fresh install — the slug routes resolve
 *     to seed defaults if the user hasn't customized them.
 *   - Custom Forms — extra one-off forms the user has built on top of a
 *     template (e.g. a second vendor-portfolio form for a specific city).
 *   - Sent — outreach log: every time a link was copied, emailed, or
 *     QR-exported. New submissions get matched back to the outreach that
 *     produced them so the user can see who responded.
 */

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import type { FormConfig, FormTemplateType } from "@/lib/types";
import {
  FORM_TEMPLATE_SEEDS,
  buildFormFromSeed,
  getFormTemplateSeed,
  templateLabel,
  type FormTemplateSeed,
} from "@/lib/db/form-templates";
import {
  createFormFromTemplate,
  deleteForm,
  duplicateForm,
  getAllForms,
  toggleFormActive,
  updateForm,
} from "@/lib/db/forms-store";
import { getAllFormSubmissions } from "@/lib/db/form-submissions-store";
import {
  channelLabel,
  deleteOutreach,
  getAllOutreach,
  type OutreachEntry,
} from "@/lib/db/outreach-log";
import { FormEditorDialog } from "./FormEditorDialog";
import { ShareFormModal } from "./ShareFormModal";
import { EmailComposerModal } from "@/components/submissions/EmailComposerModal";

type SubTab = "types" | "custom" | "sent";

interface Props {
  onToast: (message: string) => void;
}

/**
 * Either a real saved FormConfig or a virtual one synthesized from a seed.
 * Both shapes render identically — `__virtual` flags the latter so we know
 * not to expose Edit / Duplicate / Delete on it (those actions only make
 * sense on a real custom form).
 */
type FormCardData = FormConfig & {
  __virtual?: boolean;
  __seed?: FormTemplateSeed;
  __submissionCount: number;
};

function buildVirtualFormForType(seed: FormTemplateSeed): FormCardData {
  const base = buildFormFromSeed(seed);
  return {
    ...base,
    id: seed.type,
    createdAt: "",
    updatedAt: "",
    submissionCount: 0,
    __virtual: true,
    __seed: seed,
    __submissionCount: 0,
  };
}

export function SubmissionFormsTab({ onToast }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<SubTab>("types");
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [submissions, setSubmissions] = useState(() => [] as ReturnType<typeof getAllFormSubmissions>);
  const [outreach, setOutreach] = useState<OutreachEntry[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState<FormConfig | null>(null);
  const [sharing, setSharing] = useState<FormConfig | null>(null);
  const [previewing, setPreviewing] = useState<FormCardData | null>(null);
  const [origin, setOrigin] = useState("");

  function refresh() {
    setForms(getAllForms());
    setSubmissions(getAllFormSubmissions());
    setOutreach(getAllOutreach());
  }

  useEffect(() => {
    setHydrated(true);
    refresh();
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Submission counts keyed by form slug or id.
  const submissionCounts = useMemo(() => {
    const byKey: Record<string, number> = {};
    for (const s of submissions) {
      byKey[s.formId] = (byKey[s.formId] ?? 0) + 1;
    }
    return byKey;
  }, [submissions]);

  /**
   * Build the card list for the "Form Types" tab. For each canonical type,
   * surface the most-recent saved form if any exists, otherwise a virtual
   * seed-only card. Submission count includes both the slug and any custom
   * forms with the same templateType.
   */
  const formTypeCards: FormCardData[] = useMemo(() => {
    return FORM_TEMPLATE_SEEDS.map((seed) => {
      const realForms = forms.filter((f) => f.templateType === seed.type);
      const slugSubmissions = submissionCounts[seed.type] ?? 0;
      const customSubmissionsForType = realForms.reduce(
        (sum, f) => sum + (submissionCounts[f.id] ?? 0),
        0,
      );
      const totalSubmissions = slugSubmissions + customSubmissionsForType;

      if (realForms.length > 0) {
        // Use the user's customization, but tag the slug for the public URL.
        return {
          ...realForms[0],
          __submissionCount: totalSubmissions,
        } as FormCardData;
      }
      const virtual = buildVirtualFormForType(seed);
      virtual.__submissionCount = totalSubmissions;
      return virtual;
    });
  }, [forms, submissionCounts]);

  /**
   * Custom forms tab: forms the user explicitly created from a template,
   * minus the "primary" form for each type that already shows up under
   * Form Types. So, only show custom forms when there are 2+ of the same
   * templateType (otherwise the single one IS the primary and lives under
   * Form Types).
   */
  const customForms: FormCardData[] = useMemo(() => {
    const result: FormCardData[] = [];
    for (const f of forms) {
      const sameType = forms.filter((x) => x.templateType === f.templateType);
      if (sameType.length <= 1) continue;
      // Skip the most-recent of each type — it's already in Form Types.
      const sortedSameType = [...sameType].sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1,
      );
      if (sortedSameType[0].id === f.id) continue;
      result.push({
        ...f,
        __submissionCount: submissionCounts[f.id] ?? 0,
      });
    }
    return result;
  }, [forms, submissionCounts]);

  function handleCreate(type: FormTemplateType) {
    const created = createFormFromTemplate(type);
    setPickerOpen(false);
    refresh();
    setEditing(created);
    onToast(`Created form: ${created.title}.`);
  }

  function handleEditSave(updates: Partial<FormConfig>) {
    if (!editing) return;
    const saved = updateForm(editing.id, updates);
    setEditing(null);
    refresh();
    onToast(`Saved changes to "${saved.title}".`);
  }

  function handleDuplicate(form: FormCardData) {
    if (form.__virtual) {
      // Materialize the virtual form first so we have something to duplicate.
      const created = createFormFromTemplate(form.templateType);
      refresh();
      onToast(`Created your own copy of "${created.title}".`);
      return;
    }
    const copy = duplicateForm(form.id);
    refresh();
    if (copy) onToast(`Duplicated as "${copy.title}".`);
  }

  function handleDelete(form: FormCardData) {
    if (form.__virtual) {
      onToast("This is a default form type — it can't be deleted.");
      return;
    }
    const count = form.__submissionCount;
    const warning =
      count > 0
        ? `Delete "${form.title}"? ${count} submission${count === 1 ? "" : "s"} will stay in the inbox but the public link will go dead.`
        : `Delete "${form.title}"?`;
    if (!window.confirm(warning)) return;
    deleteForm(form.id);
    refresh();
    onToast("Form deleted.");
  }

  function handleToggleActive(form: FormCardData) {
    if (form.__virtual) {
      // Materialize first so the toggle has somewhere to persist.
      const created = createFormFromTemplate(form.templateType);
      toggleFormActive(created.id);
      refresh();
      return;
    }
    const updated = toggleFormActive(form.id);
    refresh();
    if (updated) {
      onToast(
        updated.isActive
          ? `"${updated.title}" is now active.`
          : `"${updated.title}" is paused — link will show "form closed".`,
      );
    }
  }

  function handleEdit(form: FormCardData) {
    if (form.__virtual) {
      // Materialize so edits have a real form to land on.
      const created = createFormFromTemplate(form.templateType);
      refresh();
      setEditing(created);
      return;
    }
    setEditing(form);
  }

  function publicUrlFor(form: FormCardData): string {
    if (!origin) return "";
    // The vendor blog-post form lives at its own dedicated route — its
    // multi-step AI flow doesn't fit the generic [formId] handler.
    if (form.templateType === "vendor-blog-post") {
      return `${origin}/submit/blog`;
    }
    // For a real saved form that's the only one of its type, prefer the
    // canonical slug. Otherwise use the form id.
    const sameType = forms.filter((f) => f.templateType === form.templateType);
    const slugIsAvailable = form.__virtual || sameType.length <= 1;
    return `${origin}/submit/${slugIsAvailable ? form.templateType : form.id}`;
  }

  function handleCopyLink(form: FormCardData) {
    const url = publicUrlFor(form);
    if (!url) return;
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      onToast("Couldn't copy — your browser blocked clipboard access.");
      return;
    }
    navigator.clipboard
      .writeText(url)
      .then(() => onToast("Link copied! Share it with vendors, brides, or anyone."))
      .catch(() => onToast("Couldn't copy — try again."));
  }

  function handlePreviewEmail(form: FormCardData) {
    setPreviewing(form);
  }

  function handleShare(form: FormCardData) {
    if (form.__virtual) {
      // Materialize so the modal has a real form id to track outreach against.
      const created = createFormFromTemplate(form.templateType);
      refresh();
      setSharing(created);
      return;
    }
    setSharing(form);
  }

  if (!hydrated) {
    return <div style={loadingHint}>loading…</div>;
  }

  return (
    <div style={containerStyle}>
      <header style={headerRow}>
        <div>
          <h2 style={sectionTitle}>Submission forms</h2>
          <p style={leadStyle}>
            Public web forms vendors and brides fill out themselves — submissions
            land in the{" "}
            <Link href="/submissions" style={inlineLink}>
              Submissions inbox
            </Link>{" "}
            with their photos and copy ready to use.
          </p>
        </div>
        <button
          type="button"
          style={primaryBtn}
          onClick={() => setPickerOpen(true)}
        >
          + Custom Form Variant
        </button>
      </header>

      <nav style={subtabsBar} role="tablist" aria-label="Form section">
        <SubTabBtn
          active={tab === "types"}
          onClick={() => setTab("types")}
          label="Form Types"
          count={formTypeCards.length}
        />
        <SubTabBtn
          active={tab === "custom"}
          onClick={() => setTab("custom")}
          label="Custom Forms"
          count={customForms.length}
        />
        <SubTabBtn
          active={tab === "sent"}
          onClick={() => setTab("sent")}
          label="Sent"
          count={outreach.length}
        />
      </nav>

      {tab === "types" && (
        <div style={cardGrid}>
          {formTypeCards.map((form) => (
            <FormCard
              key={form.templateType}
              form={form}
              publicUrl={publicUrlFor(form)}
              onEdit={() => handleEdit(form)}
              onShare={() => handleShare(form)}
              onCopyLink={() => handleCopyLink(form)}
              onDuplicate={() => handleDuplicate(form)}
              onDelete={() => handleDelete(form)}
              onToggleActive={() => handleToggleActive(form)}
              onPreviewEmail={() => handlePreviewEmail(form)}
            />
          ))}
        </div>
      )}

      {tab === "custom" && (
        <>
          {customForms.length === 0 ? (
            <CustomEmptyState onCreate={() => setPickerOpen(true)} />
          ) : (
            <div style={cardGrid}>
              {customForms.map((form) => (
                <FormCard
                  key={form.id}
                  form={form}
                  publicUrl={publicUrlFor(form)}
                  onEdit={() => handleEdit(form)}
                  onShare={() => handleShare(form)}
                  onCopyLink={() => handleCopyLink(form)}
                  onDuplicate={() => handleDuplicate(form)}
                  onDelete={() => handleDelete(form)}
                  onToggleActive={() => handleToggleActive(form)}
                  onPreviewEmail={() => handlePreviewEmail(form)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "sent" && (
        <SentLog
          entries={outreach}
          onDelete={(id) => {
            deleteOutreach(id);
            refresh();
            onToast("Removed from sent log.");
          }}
        />
      )}

      {pickerOpen && (
        <TemplatePicker
          onClose={() => setPickerOpen(false)}
          onPick={handleCreate}
        />
      )}

      <FormEditorDialog
        form={editing}
        onClose={() => setEditing(null)}
        onSave={handleEditSave}
      />

      <ShareFormModal
        form={sharing}
        onClose={() => {
          setSharing(null);
          // Re-pull outreach log so the Sent tab sees what just happened.
          refresh();
        }}
        onCopied={onToast}
      />

      <EmailComposerModal
        open={previewing !== null}
        onClose={() => setPreviewing(null)}
        onToast={onToast}
        initialFormType={previewing?.templateType ?? "vendor-portfolio"}
        formId={previewing?.id ?? "vendor-portfolio"}
        url={previewing ? publicUrlFor(previewing) : ""}
        previewOnly
      />
    </div>
  );
}

function SubTabBtn({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        ...subtabBtn,
        ...(active ? subtabBtnActive : null),
      }}
    >
      {label}
      <span style={subtabCount}>{count}</span>
    </button>
  );
}

interface FormCardProps {
  form: FormCardData;
  publicUrl: string;
  onEdit: () => void;
  onShare: () => void;
  onCopyLink: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onPreviewEmail: () => void;
}

function FormCard({
  form,
  publicUrl,
  onEdit,
  onShare,
  onCopyLink,
  onDuplicate,
  onDelete,
  onToggleActive,
  onPreviewEmail,
}: FormCardProps) {
  const isVirtual = form.__virtual === true;
  const created = form.__virtual
    ? "Default"
    : form.createdAt
    ? new Date(form.createdAt).toLocaleDateString()
    : "—";
  return (
    <article style={cardStyle}>
      <header style={cardHeader}>
        <div>
          <span style={templateBadge}>{templateLabel(form.templateType)}</span>
          <h3 style={cardTitleStyle}>{form.title}</h3>
        </div>
        <button
          type="button"
          onClick={onToggleActive}
          style={form.isActive ? activePill : inactivePill}
          title={
            form.isActive
              ? "Form is live — click to pause"
              : "Form is paused — click to reactivate"
          }
        >
          {form.isActive ? "Live" : "Paused"}
        </button>
      </header>

      {form.description && <p style={descStyle}>{form.description}</p>}

      <div style={urlRow} title={publicUrl}>
        <span style={urlLabel}>URL</span>
        <code style={urlCode}>
          {publicUrl
            ? publicUrl.replace(/^https?:\/\//, "")
            : "loading…"}
        </code>
      </div>

      <div style={statsRow}>
        <div style={statBlock}>
          <div style={statValue}>{form.__submissionCount}</div>
          <div style={statLabel}>
            Submission{form.__submissionCount === 1 ? "" : "s"}
          </div>
        </div>
        <div style={statBlock}>
          <div style={statValue}>
            {form.fields.filter((f) => f.enabled !== false).length}
          </div>
          <div style={statLabel}>Fields</div>
        </div>
        <div style={statBlock}>
          <div style={{ ...statValue, fontSize: 14, paddingTop: 12 }}>
            {created}
          </div>
          <div style={statLabel}>Created</div>
        </div>
      </div>

      <footer style={footerStyle}>
        <button type="button" onClick={onCopyLink} style={primaryCta}>
          Copy Link
        </button>
        <button type="button" onClick={onShare} style={secondaryCta}>
          Send via Email · Share · QR
        </button>
        <button
          type="button"
          onClick={onPreviewEmail}
          style={ghostBtn}
          title="Open the branded email exactly as the recipient will see it"
        >
          ✉️ Preview Email
        </button>
        <button type="button" onClick={onEdit} style={ghostBtn}>
          {isVirtual ? "Customize" : "Edit"}
        </button>
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={ghostLink}
          >
            Preview Form
          </a>
        )}
        <button type="button" onClick={onDuplicate} style={ghostBtn}>
          {isVirtual ? "Variant" : "Duplicate"}
        </button>
        {!isVirtual && (
          <button
            type="button"
            onClick={onDelete}
            style={{ ...ghostBtn, color: "var(--deep-pink)" }}
          >
            Delete
          </button>
        )}
      </footer>
    </article>
  );
}

function SentLog({
  entries,
  onDelete,
}: {
  entries: OutreachEntry[];
  onDelete: (id: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <div style={emptyStyle}>
        <div style={emptyTitle}>Nothing sent yet.</div>
        <p style={emptyHint}>
          When you copy a link, send via email, or download a QR code, we'll
          log it here so you can track who's been pinged.
        </p>
      </div>
    );
  }
  return (
    <div style={sentList}>
      {entries.map((entry) => (
        <article key={entry.id} style={sentRow}>
          <div style={sentLeft}>
            <span style={sentChannelPill}>{channelLabel(entry.channel)}</span>
            <span style={sentForm}>
              {getFormTemplateSeed(entry.templateType)?.label ?? entry.templateType}
            </span>
            <span style={sentRecipient}>{entry.recipient}</span>
          </div>
          <div style={sentRight}>
            <span style={sentTime}>
              {new Date(entry.sentAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            {entry.matchedSubmissionId ? (
              <span style={sentMatch}>↳ Submission received</span>
            ) : (
              <span style={sentPending}>Pending</span>
            )}
            <button
              type="button"
              onClick={() => onDelete(entry.id)}
              style={{ ...ghostBtn, padding: "6px 10px" }}
            >
              Remove
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function TemplatePicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (type: FormTemplateType) => void;
}) {
  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" onClick={onClose}>
      <div style={pickerModal} onClick={(e) => e.stopPropagation()}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>Pick a template</div>
            <h2 style={titleStyle}>
              <i>Start with a template</i>
            </h2>
          </div>
          <button type="button" onClick={onClose} style={closeBtn} aria-label="Close">
            ×
          </button>
        </header>
        <div style={pickerGrid}>
          {FORM_TEMPLATE_SEEDS.map((seed) => (
            <button
              key={seed.type}
              type="button"
              onClick={() => onPick(seed.type)}
              style={pickerCard}
            >
              <div style={pickerLabel}>{seed.label}</div>
              <div style={pickerPitch}>{seed.pitch}</div>
              <div style={pickerMeta}>
                {seed.fields.length} field{seed.fields.length === 1 ? "" : "s"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div style={emptyStyle}>
      <div style={emptyTitle}>No custom forms.</div>
      <p style={emptyHint}>
        The seven default form types above cover most needs. If you want a
        second variant of one (e.g. a city-specific vendor form), build a
        custom one here.
      </p>
      <button type="button" onClick={onCreate} style={primaryBtn}>
        + Build a Custom Form
      </button>
    </div>
  );
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24,
};

const headerRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 24,
  flexWrap: "wrap",
};

const sectionTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 36,
  color: "var(--wine)",
  margin: "0 0 8px",
  lineHeight: 1.1,
};

const leadStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve)",
  lineHeight: 1.6,
  maxWidth: 640,
  margin: 0,
};

const inlineLink: CSSProperties = {
  color: "var(--deep-pink)",
  textDecoration: "underline",
};

const primaryBtn: CSSProperties = {
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

const subtabsBar: CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  borderBottom: "1px solid rgba(75,21,40,0.1)",
  paddingBottom: 6,
};

const subtabBtn: CSSProperties = {
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

const subtabBtnActive: CSSProperties = {
  background: "var(--wine)",
  color: "var(--cream)",
  borderColor: "var(--wine)",
};

const subtabCount: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 10,
  background: "rgba(255,255,255,0.2)",
  padding: "1px 6px",
  borderRadius: 999,
};

const cardGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
  gap: 18,
};

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  padding: 20,
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.1)",
  borderRadius: 14,
  boxShadow: "3px 3px 0 rgba(212,168,83,0.18)",
};

const cardHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const templateBadge: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "4px 10px",
  background: "var(--blush)",
  color: "var(--deep-pink)",
  borderRadius: 999,
  display: "inline-block",
  marginBottom: 8,
};

const cardTitleStyle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 22,
  color: "var(--wine)",
  margin: 0,
  lineHeight: 1.15,
};

const descStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--mauve)",
  lineHeight: 1.55,
  margin: 0,
};

const urlRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  background: "rgba(212,168,83,0.08)",
  borderRadius: 6,
  border: "1px dashed rgba(75,21,40,0.15)",
  overflow: "hidden",
};

const urlLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--gold)",
  flexShrink: 0,
};

const urlCode: CSSProperties = {
  fontFamily: "'Space Grotesk', monospace",
  fontSize: 12,
  color: "var(--wine)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  flex: 1,
};

const activePill: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "5px 12px",
  background: "var(--gold)",
  color: "var(--wine)",
  border: "none",
  borderRadius: 999,
  cursor: "pointer",
};

const inactivePill: CSSProperties = {
  ...activePill,
  background: "rgba(75,21,40,0.12)",
  color: "var(--mauve)",
};

const statsRow: CSSProperties = {
  display: "flex",
  gap: 24,
  padding: "12px 0",
  borderTop: "1px dashed rgba(75,21,40,0.12)",
  borderBottom: "1px dashed rgba(75,21,40,0.12)",
};

const statBlock: CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const statValue: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 28,
  color: "var(--wine)",
  lineHeight: 1,
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

const footerStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: "auto",
};

const primaryCta: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "9px 14px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: "2px 2px 0 var(--gold)",
};

const secondaryCta: CSSProperties = {
  ...primaryCta,
  background: "var(--deep-pink)",
};

const ghostBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "8px 12px",
  background: "transparent",
  color: "var(--mauve)",
  border: "1px dashed rgba(75,21,40,0.3)",
  borderRadius: 4,
  cursor: "pointer",
};

const ghostLink: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "8px 12px",
  color: "var(--mauve)",
  textDecoration: "none",
  border: "1px dashed rgba(75,21,40,0.3)",
  borderRadius: 4,
  cursor: "pointer",
};

const emptyStyle: CSSProperties = {
  maxWidth: 640,
  margin: "0 auto",
  padding: "56px 32px",
  textAlign: "center",
  background: "var(--blush)",
  border: "1px dashed rgba(75,21,40,0.25)",
  borderRadius: 18,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 16,
};

const emptyTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 32,
  color: "var(--wine)",
  fontStyle: "italic",
};

const emptyHint: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve)",
  margin: 0,
  maxWidth: 480,
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(75,21,40,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1100,
  padding: 20,
};

const pickerModal: CSSProperties = {
  background: "var(--cream)",
  borderRadius: 16,
  width: "min(900px, 100%)",
  maxHeight: "90vh",
  overflow: "auto",
  boxShadow: "8px 8px 0 var(--gold)",
  border: "1px solid rgba(75,21,40,0.12)",
};

const headerStyle: CSSProperties = {
  padding: "24px 28px 12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  borderBottom: "1px dashed rgba(75,21,40,0.12)",
};

const eyebrowStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 4,
  color: "var(--pink)",
};

const titleStyle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 28,
  color: "var(--wine)",
  margin: "4px 0 0",
  lineHeight: 1.1,
};

const closeBtn: CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 28,
  lineHeight: 1,
  color: "var(--mauve)",
  cursor: "pointer",
};

const pickerGrid: CSSProperties = {
  padding: 20,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: 12,
};

const pickerCard: CSSProperties = {
  textAlign: "left",
  padding: 16,
  background: "white",
  border: "1px solid rgba(75,21,40,0.12)",
  borderRadius: 12,
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  transition: "all 0.15s ease",
};

const pickerLabel: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 18,
  color: "var(--wine)",
  lineHeight: 1.2,
};

const pickerPitch: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
  lineHeight: 1.5,
};

const pickerMeta: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--gold)",
  marginTop: 4,
};

const sentList: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const sentRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 16px",
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.08)",
  borderRadius: 8,
};

const sentLeft: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const sentRight: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const sentChannelPill: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "4px 10px",
  background: "var(--blush)",
  color: "var(--deep-pink)",
  borderRadius: 999,
};

const sentForm: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 16,
  color: "var(--wine)",
};

const sentRecipient: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--mauve)",
};

const sentTime: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
};

const sentMatch: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "4px 10px",
  background: "var(--gold)",
  color: "var(--wine)",
  borderRadius: 999,
};

const sentPending: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "4px 10px",
  background: "transparent",
  color: "var(--mauve)",
  border: "1px dashed rgba(75,21,40,0.25)",
  borderRadius: 999,
};

const loadingHint: CSSProperties = {
  padding: 80,
  textAlign: "center",
  fontFamily: "'Caveat', cursive",
  fontSize: 28,
  color: "var(--mauve)",
};
